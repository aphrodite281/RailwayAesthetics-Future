const rms1 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/movea.obj"), null);
const mcs = uploadPartedModels(rms1);
const mcm = mcs["m"];
const mcd = [mcs["d1"],mcs["d2"]];

const rms2 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/lineb.obj"), null);
const mcs2 = uploadPartedModels(rms2);
const mcr = mcs2["lr"];
const mcy = mcs2["ly"];

const interval = 0.28;
const minInt = 0.08;
const lineNum = 5;
const vMax = 1;
const timeInt = 1;

function create(ctx, state, entity) {
    state.time = 0;
    state.v = entity.doorValue;
}

function render(ctx, state, entity) {
    let target = entity.doorTarget;
    state.v += (target? 1: -1) * Timing.delta() * 0.25;

    if (state.v > vMax) state.v = vMax;
    if (state.v < 0) state.v = 0;

    if (state.v != 0) {
        no(entity);
    }else {
        fu(entity);
    }

    if (state.v != 0 && state.v != vMax) {
        if (Timing.elapsed() > state.time + timeInt) {
            let k = new TickableSound(target? Resources.id("mtrsteamloco:psda.open") : Resources.id("mtrsteamloco:psda.close"));
            k.setData(1, 1, entity.getWorldPosVector3f());
            SoundHelper.play(k);
            state.time = Timing.elapsed();
            ctx.setDebugInfo("p",1)
        }
    }
    
    let v = state.v;
    let mat = new Matrices();
    mat.translate(0, v, 0);
    mat.translate(0, interval, 0);
    for(let i = 0; i < lineNum; i++) {
        mat.pushPose();
        let vy = i * interval;
        let vd = v + i * minInt;
        mat.translate(0, Math.max(vd, vy), 0);
        ctx.drawModel((i == 0 || i == lineNum - 1)? mcr : mcy, mat);
        mat.popPose();
    }

    ctx.drawModel(mcd[0], null);
    ctx.drawModel(mcd[1], null);
    mat = new Matrices();
    mat.translate(0, v * 1.1, 0);
    ctx.drawModel(mcm, mat);
}

function alterAllRGBA (modelCluster, red ,green , blue, alpha) {
    let vertarray = modelCluster.uploadedTranslucentParts.meshList;
    let vert = vertarray[0];
    for(let i = 0; i < vertarray.length; i++) {
        vert = vertarray[i];
        vert.materialProp.attrState.setColor(red , green , blue , alpha);
    }
    vertarray = modelCluster.uploadedOpaqueParts.meshList;
    vert = vertarray[0];
    for(let i = 0; i < vertarray.length; i++) {
        vert = vertarray[i];
        vert.materialProp.attrState.setColor(red , green , blue , alpha);
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

function fu(entity) {
    entity.minPosX = 0;
    entity.minPosY = 0;
    entity.minPosZ = 0;
    entity.maxPosX = 16;
    entity.maxPosY = 48;
    entity.maxPosZ = 16;
    entity.sendUpdateC2S();
}

function no(entity) {
    entity.minPosX = 0;
    entity.minPosY = 0;
    entity.minPosZ = 0;
    entity.maxPosX = 0;
    entity.maxPosY = 0;
    entity.maxPosZ = 0;
    entity.sendUpdateC2S();
}