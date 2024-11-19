include(Resources.id("aphrodite:library/code/face.js"));
include(Resources.id("aphrodite:library/code/text_u.js"));
include(Resources.id("aphrodite:library/code/color_int_base.js"));

//const font0 = Resources.getSystemFont("Noto Serif");
const font0 = Resources.readFont(Resources.id("aphrodite:library/font/hkh_sxt.ttf"));
const fontSize = 256;
const font = font0.deriveFont(Font.PLAIN, fontSize);

const cp = (str) => {return TextU.CP(str)};

function create(ctx, state, entity) {

    let nu = false;

    pi = (key, mnum) => {
        let num = parseInt(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    pf = (key, mnum) => {
        let num = parseFloat(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    if (!entity.data.containsKey("text")) {
        entity.data.put("text", "default");
        nu = true;
    }
    state.text = entity.data.get("text");

    state.scale = pf("scale", 1);
    state.color = pi("color", 0);

    state.face = neww(ctx, state.text, state.scale, state.color);

    if (nu) entity.sendUpdateC2S();
}

function render(ctx, state, entity) {
   state.face.tick();

   let nu = false;

    pi = (key, mnum) => {
        let num = parseInt(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    pf = (key, mnum) => {
        let num = parseFloat(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    let scale = pf("scale", 1);
    let color = pi("color", 0);
    let text = entity.data.get("text");
    if (scale != state.scale || color != state.color || text != state.text) {
        state.scale = scale;
        state.color = color;
        state.text = text;
        state.face.close();
        state.face = neww(ctx, state.text, state.scale, state.color);
    }
    if (nu) entity.sendUpdateC2S();
}

function dispose(ctx, state, entity) {
    state.face.close();
}

function getSize(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
}


function neww(ctx, str, scale, color){
    let size = getSize(str, font);
    let face = new Face({
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: size,
        model: {
            size: [size[0]/100 * scale, size[1]/100 * scale],
            renderType: "exteriortranslucent"
        }
    });
    let tex = face.texture;
    let g = tex.graphics;
    g.setColor(new Color(color));
    g.setFont(font);
    g.drawString(str, 0, size[1]);
    tex.upload();
    return face;
}