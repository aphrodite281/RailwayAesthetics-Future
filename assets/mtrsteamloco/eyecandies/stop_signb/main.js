include(Resources.id("mtrsteamloco:library/code/face.js"));

//const font0 = Resources.getSystemFont("Noto Serif");
const font0 = Resources.readFont(Resources.id("mtrsteamloco:library/font/hkh_sxt.ttf"));
const fontSize = 256;
const font = font0.deriveFont(Font.PLAIN, fontSize);

function create(ctx, state, entity) {
    //try{
    
        if(entity.data.get("scale") == null) {
            entity.data.put("scale", 1 + "");
        }
        if(entity.data.get("color") == null) {
            entity.data.put("color", "0x000000");
        }
        if(entity.data.get("text") == null) {
            entity.data.put("text", "default");
        }

        if(isNaN(parseFloat(entity.data.get("scale")))){
            state.scale = 1;
            entity.data.put("scale", 1 + "");
        }else {
            state.scale = parseFloat(entity.data.get("scale"));
        }
        if(isNaN(parseInt(entity.data.get("color")))){
            state.color = 0x000000;
            entity.data.put("color", "0x000000");
        }else {
            state.color = parseInt(entity.data.get("color"));
        }
        state.text = entity.data.get("text");

        newFace(ctx, state, state.text);
        changeScale(state.scale, state);
        changeString(state.text, state);

        entity.sendUpdateC2S();
        
    //}catch(e) {

    //}
}

function render(ctx, state, entity) {
    ctx.setDebugInfo("scale",entity.data.get("scale"))
    ctx.setDebugInfo(entity.data.containsKey("scale"),1)
    //try{
        state.face.tick();

        let newScale = parseFloat(entity.data.get("scale"));
        if(state.scale!= newScale && isNaN(newScale) == false) {
            ctx.setDebugInfo("SH","scale: " + state.scale + " -> " + newScale);
            state.scale = newScale;
            changeScale(state.scale, state);
        }

        let newColor = parseInt(entity.data.get("color"));
        if(state.color!= newColor && isNaN(newColor) == false) {
            ctx.setDebugInfo("CH","color: " + state.color + " -> " + newColor);
            state.color = newColor;
            changeString(state.text, state);
        }

        let newText = entity.data.get("text");
        if(newText!= null && state.text!= newText) {
            ctx.setDebugInfo("NH","text: " + state.text + " -> " + newText);
            state.text = newText;
            try {
                state.face.close();
            }catch(e) {

            }
            newFace(ctx, state, state.text);
            changeString(state.text, state);
            changeScale(state.scale, state);
        }
    //}catch(e) {

    //}
}

function dispose(ctx, state, entity) {
    try {
        state.face.close();
    }catch(e) {

    }
}

function getSize(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
}

function newFace(ctx, state, str) {
    let size = getSize(str, font);
    let face = new Face({
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: size,
        model: {
            size: [size[0]/100, size[1]/100],
            renderType: "exteriortranslucent"
        }
    });
    state.face = face;
    state.text = str;
    state.size = size;
    state.rmA = state.face.rawModel.copy();
    state.rmA.sourceLocation = null;
}

function changeScale(scale, state) {
    let face = state.face;
    let rmB = state.rmA.copy();
    rmB.sourceLocation = null;
    rmB.applyScale(scale, scale, scale);
    rmB.replaceAllTexture(face.path);
    face.rawModel = rmB;
    face.model.uploadLater(rmB);
    state.scale = scale;
}

function changeString(text, state) {
    let face = state.face;
    try {
        face.texture.close();
    }catch(e) {
        
    }
    face.texture = new GraphicsTexture(state.size[0], state.size[1]);
    let g = face.texture.graphics;
    g.setColor(new Color(state.color));
    g.setFont(font);
    g.drawString(text, 0, state.size[1]);
    face.texture.upload();
    face.path = face.texture.identifier;
    state.text = text;
}