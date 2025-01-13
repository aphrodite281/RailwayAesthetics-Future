include(Resources.id("aphrodite:library/code/model/face.js"));
include(Resources.id("aphrodite:library/code/util/text_u.js"));
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/base/color_int_base.js"));

const fontKey = "font";
const colorKey = "color";
const scaleKey = "scale";
const textKey = "text";
const faceKey = "face";


let defaultFont = "aphrodite:library/font/lgc.ttf";
let nowFont = ClientConfig.get(fontKey) || defaultFont;

const res0 = new ConfigResponder(fontKey, ComponentUtil.translatable("name.raf.font"), defaultFont, str => str, ErrorSupplier.Font, str => {nowFont = str}, (str, builder) => builder.setTooltip(ComponentUtil.translatable("tip.raf.reload_resourcepack")));

ClientConfig.register(res0);


const font0 = Resources.readFont(Resources.id(ClientConfig.get(fontKey)));
const fontSize = 256;
const font = font0.deriveFont(Font.PLAIN, fontSize);
const gt = new GraphicsTexture(1, 1);
const g0 = gt.graphics;
g0.setFont(font);

const cp = (str) => {return TextU.CP(str)};

const res1 = new ConfigResponder(colorKey, ComponentUtil.translatable("name.raf.color"), "0", str => str, ErrorSupplier.Int, str => {}, (str, builder) => {});
const res2 = new ConfigResponder(scaleKey, ComponentUtil.translatable("name.raf.scale"), "1", str => str, ErrorSupplier.Float, str => {}, (str, builder) => {});
const res3 = new ConfigResponder(textKey, ComponentUtil.translatable("name.raf.text"), "default", str => str, () => java.util.Optional.empty(), str => {}, (str, builder) => {});

function create(ctx, state, entity) {
    let configMap = entity.getCustomConfigs();

    let oldConfig = configMap.toString();

    entity.registerCustomConfig(res1);
    entity.registerCustomConfig(res2);
    entity.registerCustomConfig(res3);

    let newConfig = configMap.toString();

    if (oldConfig!= newConfig) {
        entity.sendUpdateC2S();
    }

    state.color = parseInt(configMap.get(colorKey));  
    state.scale = parseFloat(configMap.get(scaleKey));
    state.text = configMap.get(textKey);
    //或者 state.text = entity.getCustomConfig(colorKey);

    state.face = neww(ctx, state.text, state.scale, state.color);
    state.created = true;
}

function render(ctx, state, entity) {
    if (!state.created) create(ctx, state, entity);

    let configMap = entity.getCustomConfigs();
   
    let scale = parseFloat(configMap.get(scaleKey));
    let color = parseInt(configMap.get(colorKey));
    let text = configMap.get(textKey);

    // ctx.setDebugInfo("scale", scale);
    // ctx.setDebugInfo("color", color);
    // ctx.setDebugInfo("text", text);

    if (scale != state.scale || color != state.color || text != state.text) {
        state.scale = scale;
        state.color = color;
        state.text = text;
        state.face.close();
        state.face = neww(ctx, state.text, state.scale, state.color);
    }
}

function dispose(ctx, state, entity) {
    state.face.close();
}

const mat = new Matrix4f();
mat.translate(0, 0.5, 0);

function neww(ctx, str, scale, color){
    let fm = g0.getFontMetrics();
    let size = [fm.stringWidth(str), fm.getHeight()];
    let face = new Face({
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: size,
        model: {
            size: [size[0]/100 * scale, size[1]/100 * scale],
            uvSize: [1, 1],
            renderType: "exteriortranslucent"
        }
    });
    let tex = face.texture;
    let g = tex.graphics;
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, size[0], size[1]);
    g.setColor(new Color(color));
    g.setFont(font);
    g.drawString(str, 0, fm.getAscent());
    tex.upload();
    ctx.drawCalls.put(faceKey, new ClusterDrawCall(face.model, mat));
    return face;
}