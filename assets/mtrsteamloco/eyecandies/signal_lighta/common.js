include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/gui/orderly_responder.js"));

const lights = CONFIG_INFO.lights;

const RMS = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/signal_lighta/main.obj"), null);

const BASE_CL = (function() {
    let rm = RMS.get("l");
    rm.setAllRenderType("light");
    return ModelManager.uploadVertArrays(rm);
})();
const BASE_CLM = (function() {
    let rm = RMS.get("l");
    rm.setAllRenderType("exterior");
    return ModelManager.uploadVertArrays(rm);
})()

const BASE_CD = ModelManager.uploadVertArrays(RMS.get("d"));
const BASE_CZ = ModelManager.uploadVertArrays(RMS.get("z"));

const modeKey = "mode";
const modeRes = new ConfigResponder.TextField(modeKey, ComponentUtil.translatable("name.raf.mode"), (function() {
    let s = "0";
    for (let i = 0; i < lights.length; i++) {
        s += '0';
    }
    return s;
})())
    .setErrorSupplier(str => {
        let wr = Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        str = str + '';
        if (str.length != lights.length + 1) return wr;
        if (str[0] != '0' && str[0] != '1') return wr;
        for (let i = 1; i < str.length; i++) {
            if (str[i] != '0' && str[i] != '1' && str[i] != '2') return wr;
        }
        return Optional.empty();
    })
    .setTooltipSupplier(str => Optional.of(asJavaArray([ComponentUtil.translatable("tip.raf.signal_lighta.mode")], Component)));

const RESS = (function() {
    let result = [modeRes];
    for (let i = lights.length - 1; i >= 0; i--) {
        let [key, color0] = lights[i];
        result.push(new ConfigResponder.TextField(key, ComponentUtil.translatable("name.raf." + key), color0).setErrorSupplier(ErrorSupplier.Color));
    }
    result.push(new ConfigResponder.TextField("color_m", ComponentUtil.translatable("name.raf." + "color_m"), "0x808080").setErrorSupplier(ErrorSupplier.Color));
    return orderlyResponder("ARAF", "made by Aphrodite281", result);
})()

function getColor(entity, key) {
    return Number(entity.getCustomConfig(key));
}

function create(ctx, state, entity) {
    entity.registerCustomConfig(RESS);
    entity.sendUpdateC2S();

    for (let [key, color0] of lights) {
        let color = getColor(entity, key);
        let model = BASE_CL.copyForMaterialChanges();
        setColor0(model, color);
        state[key] = color;
        state["model_" + key] = model;
    }
    state.m = BASE_CLM.copyForMaterialChanges();
    setColor0(state.m, getColor(entity, "color_m"));
    state.d = BASE_CD.copyForMaterialChanges();
    state.z = BASE_CZ.copyForMaterialChanges();


}

function render(ctx, state, entity) {
    setColor0(state.m, getColor(entity, "color_m"));
    let mode = entity.getCustomConfig(modeKey) + "";
    for (let [key, color0] of lights) {
        setColor0(state["model_" + key], getColor(entity, key));
    }

    let oa = -1;
    if (mode[0] == "0") {
        try {
            let pos = entity.getWorldPosVector3f();
            let facing = entity.getBlockYRot() + entity.rotateY / Math.PI * 180 + 90;
            let nodePos = MCU.getNodeAt(pos, facing);
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
        ls.push(state["model_" + key]);
    }
    for (let i = 1; i <= ls.length; i++) {
        ctx.drawModel(state.d, mat);
        if (mode[0] == '0') {
            if (i != ls.length) ctx.drawModel((i == oa ? ls[i - 1] : state.m), mat);
            else ctx.drawModel(((i == oa || oa == 0) ? ls[ls.length - 1] : state.m), mat);
        }else {
            let char = mode[1 + lights.length - i];
            if (char == '0') {
                ctx.drawModel(state.m, mat);
            } else if (char == '1') {
                ctx.drawModel(ls[i - 1], mat);
            } else {
                ctx.drawModel((Date.now() % 800) > 400 ? state.m : ls[i - 1], mat);
            }
        }
        mat.translate(0, h, 0);
    }
}

function setColor(rm, c) {
    let color = c << 8 | 0xff;
    for (let [mat, ml] of rm.meshList) {
        mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
    }
}

function setColor0(mc, color) {
    color = color << 8 | 0xff;
    let vs = [mc.uploadedOpaqueParts, mc.uploadedTranslucentParts];
    for (let v of vs) {
        for (let vr of v.meshList) {
            let mat = vr.materialProp;
            mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
        }
    }
}