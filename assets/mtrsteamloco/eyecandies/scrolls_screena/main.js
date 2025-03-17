importPackage (java.awt);

include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/util/tostring.js"));
include(Resources.id("aphrodite:library/code/gui/orderly_responder.js"));

const dfont = Resources.readFont(Resources.id("aphrodite:library/font/zhdh.ttf"));

const keyBackgroundColor = "background_color";
const keyTextColor = "text_color";
const keyGridColor = "grid_color";
const keySpeed = "speed";
const keyTEXSize = "tex_size";
const keyModelSize = "model_size";
const keyFontSize = "font_size";
const keyOffsetY = "offset_y";
const keyText = "text";
const keyHasGrid = "has_grid";

const res = (function() {

    function gen(key, dv) {
        return new ConfigResponder.TextField(key, ComponentUtil.translatable("name.raf." + key), dv);
    }

    let r = Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
    function mul(p) {
        return function(str) {
            str = str + "";
            let parts = str.split("/");
            if (parts.length != 2) return r;
            let a = parseFloat(parts[0]);
            let b = parseFloat(parts[1]);
            if (isNaN(a) || isNaN(b)) return r;
            if (p) if (a <= 0 || b <= 0) return r;
            return Optional.empty();
        }
    }

    let bc = gen(keyBackgroundColor, "0x3d3d3d").setErrorSupplier(ErrorSupplier.Color);
    let tc = gen(keyTextColor, "0xffffff").setErrorSupplier(ErrorSupplier.Color);
    let gc = gen(keyGridColor, "0x000000").setErrorSupplier(ErrorSupplier.Color);
    let sp = gen(keySpeed, "-10/0").setErrorSupplier(mul(false));
    let uv = gen(keyTEXSize, "200/20").setErrorSupplier(mul(true));
    let ms = gen(keyModelSize, "10/1").setErrorSupplier(mul(true));
    let fs = gen(keyFontSize, "18").setErrorSupplier(ErrorSupplier.numberRange(0, null, true, true));
    let sy = gen(keyOffsetY, "-1").setErrorSupplier(ErrorSupplier.Number);
    let tx = gen(keyText, "Hello, World!    ");
    let gr = gen(keyHasGrid, "true").setErrorSupplier(ErrorSupplier.only(["true", "false"]));

    return orderlyResponder("ARAF", "made by Aphrodite281",[bc, tc, gc, sp, uv, ms, fs, sy, tx, gr]);
})();

const mat = new Matrix4f();
mat.translate(0, 0.5, 0);

function create(ctx, state, entity) {
    entity.registerCustomConfig(res);
    entity.sendUpdateC2S();

    state.running = true;
    state.lastRenderTime = Date.now();

    state.dyn = new DynamicModelHolder();

    state.tack = function() {
        let info = null;
        let texture = null;
        let model = null;
        let grid = null;

        try {

        while (state.running && (state.lastRenderTime + 10000) > Date.now()) {
            let start = Date.now();
            let ne = genInfo(entity);
            
            let changed = false;
            function k(key) {
                changed = changed || toString(info[key]) != toString(ne[key].toString);
            }

            if (info != null) {
                k("modelSize");
                k("texSize");
                k("hasGrid"); 
                k("gridColor");
            } else changed = true;


            info = ne;
            if (changed) {
                if (texture != null) texture.close();

                texture = genTexture(info);
                model = genModel(info, texture);

                let rm = new RawModel();
                rm.append(model.copy());
                if (info.hasGrid + '' == "true") {
                    grid = genGrid(info);
                    rm.append(grid.copy());
                }

                state.dyn.uploadLater(rm);
            }

            let g = texture.graphics;

            g.setColor(info.backgroundColor);
            g.fillRect(0, 0, texture.width, texture.height);
            let fm = g.getFontMetrics(dfont.deriveFont(info.fontSize));
            let w = fm.stringWidth(info.text);
            let d = fm.getDescent();
            let tx = Date.now() / 1000 * info.speed[0] % w;
            let ty = Date.now() / 1000 * info.speed[1] % (fm.getHeight() * 1.2);
            if (info.speed[0] == 0) tx = 0;
            if (info.speed[1] == 0) ty = 0;
            ty += (info.texSize[1] - d);
            ty += info.offsetY;
            g.setColor(info.textColor);
            g.setFont(dfont.deriveFont(info.fontSize));
            for (let i = -2; i < 3; i++) {
                for (let j = -2; j < 3; j++) {
                    g.drawString(info.text, tx + w * i, ty + fm.getHeight() * j * 1.2);
                }
            }
            // g.drawString(info.text, 0, info.texSize[1]);
            texture.upload();
            let end = Date.now();
            let el = end - start;
            ctx.setDebugInfo("used", el);
            java.lang.Thread.sleep(Math.max(0, 1000 / 24 - el));
            model.replaceAllTexture(texture.identifier);
        }

        }catch (e) {
            ctx.setDebugInfo("error", e.message, e.stack);
        }
        if (texture != null) texture.close();
        
        print("exit");
        ctx.setDebugInfo("exit", true);
    };

    state.thread = new java.lang.Thread(state.tack, "Scrolls ScreenA Thread" + ctx.hashCode().toString(16));
    state.thread.start();
    ctx.drawCalls.put(0, new ClusterDrawCall(state.dyn, mat));
}

function render(ctx, state, entity) {
    state.lastRenderTime = Date.now();
    if (!state.thread.isAlive()) {
        state.thread = new java.lang.Thread(state.tack, "Scrolls ScreenA Thread" + ctx.hashCode().toString(16));
        state.thread.start();
    }
}

function dispose(ctx, state, entity) {
    state.running = false;
}

function genModel(info, tex) {// Resources.id("minecraft:textures/misc/white.png")
    let builder = new RawMeshBuilder(4, "light", tex.identifier);
    for(let i = 0; i < 4; i++) {
        builder.vertex(new Vector3f(info.modelSize[0] * (i == 0 || i == 1? 0.5 : -0.5), info.modelSize[1] * (i == 0 || i == 3 ? -0.5 : 0.5), 0)).uv(i == 0 || i ==1 ? 1 : 0, i == 0 || i == 3 ? 1 : 0).normal(0, 0, 0).endVertex();
    }
    let rawModel = new RawModel();
    rawModel.append(builder.getMesh());
    rawModel.triangulate();
    return rawModel;
}

var grid = (function() {
    let gt = new GraphicsTexture(30, 30);
    let g = gt.graphics;
    g.setColor(Color.BLACK);
    g.fillRect(0, 0, 30, 30);
    g.setComposite(AlphaComposite.Clear);
    g.fillRoundRect(2, 2, 26, 26, 13, 13);
    gt.upload();
    return gt;
})();

function genGrid(info) {
    let builder = new RawMeshBuilder(4, "exteriortranslucent", grid.identifier);
    for(let i = 0; i < 4; i++) {
        builder.vertex(new Vector3f(info.modelSize[0] * (i == 0 || i == 1? 0.5 : -0.5), info.modelSize[1] * (i == 0 || i == 3 ? -0.5 : 0.5), 0.005)).uv(i == 0 || i ==1 ? info.texSize[0] : 0, i == 0 || i == 3 ? info.texSize[1] : 0).normal(0, 0, 0).endVertex();
    }
    let rawModel = new RawModel();
    let mash = builder.getMesh();
    mash.materialProp.attrState.setColor(info.gridColor << 8 | 0xFF);
    rawModel.append(mash);
    rawModel.triangulate();
    return rawModel;
}

function genTexture(info) {
    let gt = GraphicsTexture(info.texSize[0], info.texSize[1]);
    return gt;
}

function genInfo(entity) {
    function split(str) {
        str = str + "";
        let parts = str.split("/");
        return [parseFloat(parts[0]), parseFloat(parts[1])];
    } 
    let modelSize = split(entity.getCustomConfig(keyModelSize));
    let texSize = split(entity.getCustomConfig(keyTEXSize));
    let speed = split(entity.getCustomConfig(keySpeed));
    let text = entity.getCustomConfig(keyText);
    let hasGrid = entity.getCustomConfig(keyHasGrid);
    let fontSize = entity.getCustomConfig(keyFontSize);
    let offsetY = Number(entity.getCustomConfig(keyOffsetY));
    let textColor = entity.getCustomConfig(keyTextColor);
    let backgroundColor = entity.getCustomConfig(keyBackgroundColor);
    let gridColor = entity.getCustomConfig(keyGridColor);
    return {
        modelSize: modelSize,
        texSize: texSize,
        speed: speed,
        text: text,
        hasGrid: hasGrid,
        fontSize: fontSize,
        offsetY: offsetY,
        textColor: new Color(textColor),
        backgroundColor: new Color(backgroundColor),
        gridColor: gridColor
    };
}
