include(Resources.id("aphrodite:library/code/util/error_supplier.js"));

const colorKey = "color";
const res = new ConfigResponder.TextField(colorKey, ComponentUtil.translatable("name.raf.color"), "0xfafafa").setErrorSupplier(ErrorSupplier.Color);

const getColor = entity => java.awt.Color.getColor(entity.getCustomConfig(colorKey));

function c(ctx, state, entity, model) {
    entity.registerCustomConfig(res);
    let rm = model.copy(); rm.sourceLocation = null;
    duv(rm);
    setColor(rm, getColor(entity));
    let dyn = new DynamicModelHolder();
    dyn.uploadLater(rm);
    state.dyn = dyn;
    ctx.drawCalls.put("barsa", new ClusterDrawCall(dyn, new Matrix4f()));
}

function r(ctx, state, entity) {
    setColor0(state.dyn, getColor(entity));
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