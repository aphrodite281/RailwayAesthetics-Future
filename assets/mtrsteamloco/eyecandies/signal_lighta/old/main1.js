const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const rms = MM.loadPartedRawModel(RU.manager(), RU.id("mtrsteamloco:eyecandies/signal_lighta/main.obj"), null);

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
    state.ca = pi("colorA", 0x40ff40);
    state.cb = pi("colorC", 0xff4040);
    state.cm = pi("colorM", 0x808080);
    let l0 = rms.get("l").copy(); l0.sourceLocation = null; setColor(l0, state.ca); l0.setAllRenderType("light");
    let l1 = rms.get("l").copy(); l1.sourceLocation = null; setColor(l1, state.cb); l1.setAllRenderType("light");
    let m = rms.get("l").copy(); m.sourceLocation = null; setColor(m, state.cm); m.setAllRenderType("exterior");
    let d0 = rms.get("d").copy(); d0.sourceLocation = null; d0.setAllRenderType("exterior");
    let z = rms.get("z").copy(); z.sourceLocation = null; z.setAllRenderType("exterior");
    state.l0 = new DynamicModelHolder(); state.l0.uploadLater(l0);
    state.l1 = new DynamicModelHolder(); state.l1.uploadLater(l1);
    state.m = new DynamicModelHolder(); state.m.uploadLater(m);
    state.d0 = new DynamicModelHolder(); state.d0.uploadLater(d0);
    state.z = new DynamicModelHolder(); state.z.uploadLater(z); 
    let mode = entity.data.get("mode") + "";
    if (mode == null) mode = "000"; entity.data.put("mode", mode); nu = true;
    if (mode.length != 3) mode = "000"; entity.data.put("mode", mode); nu = true;
    for (let i = 0; i < 3; i++) {
        if (mode[i] == "0" || mode[i] == "1") ;
        else mode = "000"; entity.data.put("mode", mode); nu = true;
    }
    state.mode = mode;

    //if (nu) entity.sendUpdateC2S();
}

function render(ctx, state, entity) {
    let oa;
    try {
        let pos = entity.getWorldPosVector3f();
        let facing = entity.getBlockYRot() + entity.rotateY / Math.PI * 180 + 90;
        let nodePos = entity.getNodePos(pos, facing);
        oa = MCU.getOccupiedAspect(nodePos, facing, 3);
    } catch (e) {
        oa = -1;
    }
    ctx.setDebugInfo("oa", oa);

    let mode = entity.data.get("mode") + "";
    if (mode == null) mode = "000"; entity.data.put("mode", mode); entity.sendUpdateC2S();
    if (mode.length != 3) mode = "000"; entity.data.put("mode", mode); entity.sendUpdateC2S();
    for (let i = 0; i < 3; i++) {
        if (mode[i] == "0" || mode[i] == "1") ;
        else mode = "000"; entity.data.put("mode", mode); entity.sendUpdateC2S();
    }
    state.mode = mode;

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

    state.ca = pi("colorA", 0x40ff40);
    state.cb = pi("colorC", 0xff4040);
    state.cm = pi("colorM", 0x808080);

    setColor0(state.l0, state.ca);
    setColor0(state.l1, state.cb);
    setColor0(state.m, state.cm);

    let mat = new Matrices();
    let h = 0.22;
    mat.translate(0, h / 2, 0);
    ctx.drawModel(state.z, mat);
    mat.translate(0, h, 0);
    let ls = [state.l1, state.l0];
    for (let i = 1; i <= 2; i++) {
        ctx.drawModel(state.d0, mat);
        if (state.mode[0] == "0") {
            if (i != 2) ctx.drawModel((i == oa ? ls[i - 1] : state.m), mat);
            else ctx.drawModel(((i == oa || oa == 0) ? ls[1] : state.m), mat);
        }else {
            ctx.drawModel(state.mode[i] == 0 ? state.m : ls[i - 1], mat);
        }
        mat.translate(0, h, 0);
    }

    if (nu) entity.sendUpdateC2S();
}

function dispose(ctx, state, entity) {
    state.l0.close();
    state.l1.close();
    state.m.close();
    state.d0.close();
    state.z.close();
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