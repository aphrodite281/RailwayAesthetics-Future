const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const rms = MM.loadPartedRawModel(RU.manager(), RU.id("mtrsteamloco:eyecandies/signal_lighta/main.obj"), null);

function create(ctx, state, entity) {
    let l0 = rms.get("l").copy(); l0.sourceLocation = null; setColor(l0, 0x0fff0fff); l0.setAllRenderType("light");
    let l1 = rms.get("l").copy(); l1.sourceLocation = null; setColor(l1, 0xffff0fff); l1.setAllRenderType("light");
    let l2 = rms.get("l").copy(); l2.sourceLocation = null; setColor(l2, 0xff0f0fff); l2.setAllRenderType("light");
    let m = rms.get("l").copy(); m.sourceLocation = null; setColor(m, 0xffffffff); m.setAllRenderType("exterior");
    let d0 = rms.get("d").copy(); d0.sourceLocation = null; d0.setAllRenderType("exterior");
    let z = rms.get("z").copy(); z.sourceLocation = null; z.setAllRenderType("exterior");
    state.l0 = new DynamicModelHolder(); state.l0.uploadLater(l0);
    state.l1 = new DynamicModelHolder(); state.l1.uploadLater(l1);
    state.l2 = new DynamicModelHolder(); state.l2.uploadLater(l2);
    state.m = new DynamicModelHolder(); state.m.uploadLater(m);
    state.d0 = new DynamicModelHolder(); state.d0.uploadLater(d0);
    state.z = new DynamicModelHolder(); state.z.uploadLater(z);
}

function render(ctx, state, entity) {
    let oa;
    try {
        let pos = entity.getWorldPosVector3f();
        let facing = entity.getBlockYRot() + entity.rotateY / Math.PI * 180 + 90;
        let nodePos = entity.getNodePos(pos, facing);
        oa = MCU.getOccupiedAspect(nodePos, facing, 3);
    } catch (e) {
        oa = 0;
    }
    ctx.setDebugInfo("oa", oa);

    let mat = new Matrices();
    let h = 0.22;
    mat.translate(0, h / 2, 0);
    ctx.drawModel(state.z, mat);
    mat.translate(0, h, 0);
    let ls = [state.l2, state.l1, state.l0];
    for (let i = 1; i <= 3; i++) {
        ctx.drawModel(state.d0, mat);
        if (i != 3) ctx.drawModel((i == oa ? ls[i - 1] : state.m), mat);
        else ctx.drawModel(((i == oa || oa == 0) ? ls[2] : state.m), mat);
        //ctx.drawModel(ls[i-1], mat);
        mat.translate(0, h, 0);
    }
}

function uploadPartedModels(rawModels) {
    let result = {};
    for (it = rawModels.entrySet().iterator(); it.hasNext(); ) {
      entry = it.next();
      entry.getValue().applyUVMirror(false, true);
      result[entry.getKey()] = ModelManager.uploadVertArrays(entry.getValue());
    }
    return result;
}

function setColor(rm, color) {
    for (let [mat, ml] of rm.meshList) {
        mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
    }
}