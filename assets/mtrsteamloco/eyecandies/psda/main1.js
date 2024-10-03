const rm1 = ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/linea.obj"), null);
const mcr = ModelManager.uploadVertArrays(rm1);
alterAllRGBA(mcr, 255, 0, 0, 255);
const rm2 = rm1.copyForMaterialChanges();
rm2.sourceLocation = null;
const mcy = ModelManager.uploadVertArrays(rm2);
alterAllRGBA(mcy, 255, 255, 0, 255);

const interval = 0.28;
const minInt = 0.08;
const lineNum = 5;
const vMax = 1;

function create(ctx, state, entity) {
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