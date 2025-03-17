importPackage (java.awt);
importPackage (java.awt.image);

include(Resources.id("aphrodite:library/code/util/tostring.js"));
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));

const keyColor = "color";
const keyScale = "scale";
const keyText = "text";
const keyFont = "font";

const res1 = new ConfigResponder.TextField(keyColor, ComponentUtil.translatable("name.raf.color"), "0").setErrorSupplier(ErrorSupplier.Color);
const res2 = new ConfigResponder.TextField(keyScale, ComponentUtil.translatable("name.raf.scale"), "1").setErrorSupplier(ErrorSupplier.Float);
const res3 = new ConfigResponder.TextField(keyText, ComponentUtil.translatable("name.raf.text"), "Hello, World!");
const res4 = new ConfigResponder.TextField(keyFont, ComponentUtil.translatable("name.raf.font"), "aphrodite:library/font/zhdh.ttf");

const g0 = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB).createGraphics();

const mat = new Matrix4f();
mat.translate(0, 0.5, 0);

function create(ctx, state, entity) {
    entity.registerCustomConfig(res1);
    entity.registerCustomConfig(res2);
    entity.registerCustomConfig(res3);
    entity.registerCustomConfig(res4);
    entity.sendUpdateC2S();
    
    state.dyn = new DynamicModelHolder();
    state.info = genInfo(entity);
    state.tex = genTexture(state.info);
    state.dyn.uploadLater(genModel(state.tex));

    ctx.drawCalls.put(0, new ClusterDrawCall(state.dyn, mat));
}

function render(ctx, state, entity) {
    let info = genInfo(entity);
    if (toString(info) != toString(state.info)) {
        state.info = info;
        state.tex.close();
        state.tex = genTexture(state.info);
        state.dyn.uploadLater(genModel(state.tex));
    }
}

function dispose(ctx, state, entity) {
    state.tex.close();
    state.dyn.close();
}

function genInfo(entity) {
    let color = parseInt(entity.getCustomConfig(keyColor));
    let scale = parseFloat(entity.getCustomConfig(keyScale));
    let text = entity.getCustomConfig(keyText);
    let font = entity.getCustomConfig(keyFont);
    return {
        color: color,
        scale: scale,
        text: text,
        font: font
    }
}

const SCALE = 150;

function genTexture(info) {
    let font = getFont(info.font);
    font = font.deriveFont(info.scale * SCALE);
    let fm = g0.getFontMetrics(font);
    let w = fm.stringWidth(info.text);
    let h = fm.getHeight();
    let gt = GraphicsTexture(w, h);
    let g = gt.graphics;
    g.setColor(new Color(info.color));
    g.setFont(font);
    g.drawString(info.text, 0, fm.getAscent());
    gt.upload();
    return gt;
}

function genModel(tex) {
    let w = tex.width / SCALE, h = tex.height / SCALE;
    let builder = new RawMeshBuilder(4, "exterior", tex.identifier);
    for(let i = 0; i < 4; i++) {
        builder.vertex(new Vector3f(w * (i == 0 || i == 1? 0.5 : -0.5), h * (i == 0 || i == 3 ? -0.5 : 0.5), 0)).uv(i == 0 || i ==1 ? 1 : 0, i == 0 || i == 3 ? 1 : 0).normal(0, 0, 0).endVertex();
    }
    let rawModel = new RawModel();
    rawModel.append(builder.getMesh());
    rawModel.triangulate();
    return rawModel;
}

var getFont = (function() {
    const FONT_CACHE = new Map();
    return function(src) {
        if (FONT_CACHE.has(src)) {
            return FONT_CACHE.get(src);
        }
        if (Resources.hasResource(Resources.id(src))) FONT_CACHE.set(src, Resources.readFont(Resources.id(src)));
        else FONT_CACHE.set(src, new Font(src, Font.PLAIN, 16));
        return FONT_CACHE.get(src);
    }
})();