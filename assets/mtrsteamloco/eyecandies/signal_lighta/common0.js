const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const rms = MM.loadPartedRawModel(RU.manager(), RU.id("mtrsteamloco:eyecandies/signal_lighta/main.obj"), null);
const cl = rms.get("l"); cl.sourceLocation = null;
const cd = rms.get("d"); cd.sourceLocation = null;
const cz = rms.get("z"); cz.sourceLocation = null;

function create(ctx, state, entity) {
    c(ctx, state, entity, lights);
}

function render(ctx, state, entity) {
    r(ctx, state, entity, lights);
}

function c(ctx, state, entity, lights) {
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
    for (let [key, color0] of lights) {
        let color = pi(key, color0);
        let model = cl.copy();
        setColor(model, color);
        model.setAllRenderType("light");
        let dyn = new DynamicModelHolder();
        dyn.uploadLater(model);
        state[key] = color;
        state["dl" + key] = dyn;
    }
    let m = cl.copy(); m.sourceLocation = null; m.setAllRenderType("exterior");
    state["colorM"] = pi("colorM", 0x808080);
    setColor(m, state["colorM"]);
    var dyn = new DynamicModelHolder();
    dyn.uploadLater(m);
    state.m = dyn;
    let d = cd.copy(); d.sourceLocation = null; d.setAllRenderType("exterior");
    let z = cz.copy(); z.sourceLocation = null; z.setAllRenderType("exterior");
    var dyn = new DynamicModelHolder();
    dyn.uploadLater(d);
    state.d = dyn;
    var dyn = new DynamicModelHolder();
    dyn.uploadLater(z);
    state.z = dyn;

    let lnum = lights.length;
    let mode = entity.data.get("mode") + "";
    sm = () => {
        mode = "".padStart(lnum + 1, '0');
        entity.data.put("mode", mode);
        nu = true;
    }
    if (mode == null) sm();
    if (mode.length != 4) sm();
    for (let i = 0; i < 4; i++) {
        if (mode[i] == "0" || mode[i] == "1") continue;
        sm();
        break;
    }
    state.mode = mode;

    if (nu) entity.sendUpdateC2S();
}

function r(ctx, state, entity, lights) {
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
    for (let [key, color0] of lights) {
        let color = pi(key, color0);
        setColor0(state["dl" + key], color);
    }
    let cm = pi("colorM", 0x808080);
    setColor0(state.m, cm);

    let lnum = lights.length;
    let mode = entity.data.get("mode") + "";
    sm = () => {
        mode = "".padStart(lnum + 1, '0');
        entity.data.put("mode", mode);
        nu = true;
    }
    if (mode == null) sm();
    if (mode.length != lnum + 1) sm();
    for (let i = 0; i < lnum + 1; i++) {
        if (mode[i] == "0" || mode[i] == "1") continue;
        sm();
        break;
    }
    state.mode = mode;

    let oa = -1;
    if (state.mode[0] == "0") {
        try {
            let pos = entity.getWorldPosVector3f();
            let facing = entity.getBlockYRot() + entity.rotateY / Math.PI * 180 + 90;
            let nodePos = MCU.getNodeAt(pos, facing);
            //ctx.setDebugInfo("node", nodePos);
            oa = MCU.getOccupiedAspect(nodePos, facing, lnum);
        } catch (e) {}
    }
    let mat = new Matrices();
    let h = 0.22;
    mat.translate(0, h / 2, 0);
    ctx.drawModel(state.z, mat);
    mat.translate(0, h, 0);
    let ls = [];
    for (let [key, color0] of lights) {
        ls.push(state["dl" + key]);
    }
    for (let i = 1; i <= ls.length; i++) {
        ctx.drawModel(state.d, mat);
        if (state.mode[0] == "0") {
            if (i != ls.length) ctx.drawModel((i == oa ? ls[i - 1] : state.m), mat);
            else ctx.drawModel(((i == oa || oa == 0) ? ls[ls.length - 1] : state.m), mat);
        }else {
            ctx.drawModel(state.mode[i] == 0 ? state.m : ls[i - 1], mat);
        }
        mat.translate(0, h, 0);
    }

    if (nu) entity.sendUpdateC2S();
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