include(Resources.id("aphrodite:library/code/network/web_image_manager.js"));
include(Resources.id("aphrodite:library/code/gui/boolean_responder.js"));
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/gui/orderly_responder.js"));

const KEY_IMAGE = "image";
const KEY_MODEL_SIZE = "model_size";
const KEY_FLIP_U = "flip_u";
const KEY_FLIP_V = "flip_v";
const KEY_GIF_SPEED = "gif_speed";
const KEY_OVERLAY_COLOR = "overlay_color";
const KEY_RENDER_TYPE = "render_type";

const IMAGE_RESPONDER = new ConfigResponder.TextField(KEY_IMAGE, ComponentUtil.translatable("name.raf.image"), "https://image.hokubu.cn/i/2025/03/23/67df5dee55f02.png");
const MODEL_SIZE_RESPONDER = new ConfigResponder.TextField(KEY_MODEL_SIZE, ComponentUtil.translatable("name.raf.model_size"), "5/5")
    .setErrorSupplier(function(str) {
        let wr = Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        let tokens = str.split("/");
        if (tokens.length != 2) return wr;
        let n0 = parseFloat(tokens[0]), n1 = parseFloat(tokens[1]);
        if (isNaN(n0) || isNaN(n1)) return wr;
        if (n0 <= 0 || n1 <= 0) return wr;
        return Optional.empty();
    });
const FLIP_U_RESPONDER = newBooleanResponder(KEY_FLIP_U, ComponentUtil.translatable("name.raf.flip_u"), false);
const FLIP_V_RESPONDER = newBooleanResponder(KEY_FLIP_V, ComponentUtil.translatable("name.raf.flip_v"), false);
const GIF_SPEED_RESPONDER = new ConfigResponder.TextField(KEY_GIF_SPEED, ComponentUtil.translatable("name.raf.gif_speed"), "1")
    .setErrorSupplier(ErrorSupplier.Float);
const OVERLAY_COLOR_RESPONDER = new ConfigResponder.TextField(KEY_OVERLAY_COLOR, ComponentUtil.translatable("name.raf.overlay_color"), "0xFFFFFFFF")
    .setErrorSupplier(ErrorSupplier.Color);
const RENDER_TYPE_RESPONDER = new ConfigResponder.TextField(KEY_RENDER_TYPE, ComponentUtil.translatable("name.raf.render_type"), "light")
    .setErrorSupplier(ErrorSupplier.RenderType);
const COM_RESPONDER = orderlyResponder("ARAF", "made by Aphrodite281", [IMAGE_RESPONDER, MODEL_SIZE_RESPONDER, FLIP_U_RESPONDER, FLIP_V_RESPONDER, GIF_SPEED_RESPONDER, OVERLAY_COLOR_RESPONDER, RENDER_TYPE_RESPONDER]);

const MATRIX = new Matrix4f();
MATRIX.translate(0, 0.5, 0);

function load(url, callback) {
    WebImageManager.getInstance().loadImage(url, callback);
}

function create(ctx, state, entity) {
    entity.registerCustomConfig(COM_RESPONDER);
    entity.sendUpdateC2S();
    state.dyn = new DynamicModelHolder();
    update(ctx, state, entity);
    ctx.drawCalls.put(0, new ClusterDrawCall(state.dyn, MATRIX));

    state.last = Date.now();
}

function render(ctx, state, entity) {
    let start = Date.now();
    update(ctx, state, entity);
    ctx.setDebugInfo("used", (Date.now() - start) + "ms", "internal", (start - state.last) + "ms");
    state.last = start;
}

function dispose(ctx, state, entity) {

}

function update(ctx, state, entity) {
    let info = genInfo(entity);
    let flag = true;
    if (state.info != null) {
        flag = state.info.url != info.url || state.info.size.x != info.size.x || state.info.size.y != info.size.y || state.info.flipU != info.flipU || state.info.flipV != info.flipV || state.info.gifSpeed != info.gifSpeed || state.info.overlay_color != info.overlay_color || state.info.renderType != info.renderType;
    }
    if (flag) {
        state.info = info;
        let face = genFaceModel(info);
        state.holder = null;
        state.dyn.uploadLater(face);
        genHolder(info, ctx, state.dyn, face, function(holder) {
            state.holder = holder;
        });
    } else {
        if (state.holder != null) state.holder.update(state.dyn);
    }
}

function Bitmap(face, bitmap, info) {
    face.replaceAllTexture(bitmap.texture.identifier);

    this.update = function(dyn) {

    }

    this.toString = function() {
        return "Bitmap";
    }
}

function Gif(face, gif, info) {
    const reader = gif.createReader(true, info.gifSpeed);

    this.update = function(dyn) {
        let m = dyn.getUploadedModel();
        if (m == null || m == undefined) return;
        m.replaceAllTexture(reader.getFrame().texture.identifier);
    }

    this.toString = function() {
        return "Gif";
    }
}

function genHolder(info, ctx, dyn, face, callback) {
    WebImageManager.getInstance().loadImage(info.url, function(img) {
        if (img == null) {
            ctx.setDebugInfo("Failed to load image");
            return;
        }
        let holder;
        switch(img.TYPE) {
            case "gif": holder = new Gif(face, img, info); break;
            case "bitmap": holder = new Bitmap(face, img, info); break;
        }
        callback(holder);
    });
}

function genFaceModel(info) {
    let size = info.size;
    let u = info.flipU == false ? 1 : -1;
    let v = info.flipV == false ? 1 : -1;
    let builder = new RawMeshBuilder(4, info.renderType, Resources.id("minecraft:textures/misc/white.png"));
    for(let i = 0; i < 4; i++) {
        builder.vertex(new Vector3f(size.x * (i == 0 || i == 1? 0.5 : -0.5), size.y * (i == 0 || i == 3 ? -0.5 : 0.5), 0)).uv(i == 0 || i ==1 ? u : 0, i == 0 || i == 3 ? v : 0).normal(0, 0, 0).endVertex();
    }
    let mesh = builder.getMesh();
    let color = info.overlay_color;
    mesh.materialProp.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
    let rawModel = new RawModel();
    rawModel.append(mesh);
    return rawModel;
}

function genInfo(entity) {
    let url = entity.getCustomConfig(KEY_IMAGE);
    let si = entity.getCustomConfig(KEY_MODEL_SIZE);
    let tokens = si.split("/");
    let size = {
        x: parseFloat(tokens[0]),
        y: parseFloat(tokens[1])
    }
    let flipU = entity.getCustomConfig(KEY_FLIP_U) + "";
    flipU = flipU == "true";
    let flipV = entity.getCustomConfig(KEY_FLIP_V) + "";
    flipV = flipV == "true";
    let gifSpeed = entity.getCustomConfig(KEY_GIF_SPEED);
    gifSpeed = parseFloat(gifSpeed);
    let overlay_color = entity.getCustomConfig(KEY_OVERLAY_COLOR);
    overlay_color = parseInt(overlay_color);
    let renderType = entity.getCustomConfig(KEY_RENDER_TYPE);
    return {
        url: url,
        size: size,
        flipU: flipU,
        flipV: flipV,
        gifSpeed: gifSpeed,
        overlay_color: overlay_color,
        renderType: renderType
    }
}