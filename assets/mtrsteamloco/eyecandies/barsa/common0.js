include(Resources.id("aphrodite:library/code/base/color_int_base.js"));

const colors = [["color", 0xfafafa]];

function c(ctx, state, entity, model) {
    ColorIntBase.init(ctx, state, entity, colors);
    let rm = model.copy(); rm.sourceLocation = null;
    duv(rm);
    setColor(rm, state.color);
    let dyn = new DynamicModelHolder();
    dyn.uploadLater(rm);
    state.dyn = dyn;
}

function r(ctx, state, entity) {
    try {
        ColorIntBase.tick(ctx, state, entity, colors);
        setColor0(state.dyn, state.color);
        ctx.drawModel(state.dyn, null);
    } catch (e) {}
}

function setColor(rm, c) {
    let color = c << 8 | 0xff;
    for (let [mat, ml] of rm.meshList) {
        mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
    }
}

function setColor0(dyn, c) {
    let color = c << 8 | 0xff;
    let mc = dyn.getUploadedModel();
    let vs = [mc.uploadedOpaqueParts, mc.uploadedTranslucentParts];
    for (let v of vs) {
        for (let vr of v.meshList) {
            let mat = vr.materialProp;
            mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
        }
    }
}

function duv(rm) {
    for (let [mat, ml] of rm.meshList) {
        let shift = Math.random();
        for (let v of ml.vertices) {
            v.u = v.u * 2 + shift;
            v.v = v.v * 2 + shift;
        }
    }
}