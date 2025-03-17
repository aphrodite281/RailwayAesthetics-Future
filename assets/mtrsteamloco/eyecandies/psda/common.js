var mcr, mcy;

const interval = 0.28;
const minInt = 0.08;
const lineNum = 5;

function genLineModels(rm) {
    mcr = ModelManager.uploadVertArrays(rm);
    alterAllRGBA(mcr, 255, 0, 0, 255);
    mcy = mcr.copyForMaterialChanges();
    alterAllRGBA(mcy, 255, 255, 0, 255);
}

function render(ctx, state, entity) {
    let v = (Math.sin(Math.PI / -2 + Math.min(1, entity.doorValue * 1.2) * Math.PI) + 1) / 2;
    if (v == 0) fu(entity);
    else no(entity);
    let mat = new Matrices();
    mat.translate(0, v + lineNum * interval, 0);
    let vi = minInt + (1 - v) * (interval - minInt);
    for (let i = 0; i < lineNum; i++) {
        mat.pushPose();
        mat.translate(0, -i * vi, 0);
        ctx.drawModel((i == 0 || i == lineNum - 1)? mcr : mcy, mat);
        mat.popPose();
    }
    onRender(ctx, state, entity, v);
}

var onRender = function(ctx, state, entity, v) {

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

const sh = CONFIG_INFO.shape;
function fu(entity) {
    if (entity.getCollisionShape() + "" != sh) {
        entity.setCollisionShape(sh);
        entity.sendUpdateC2S();
    }
}

const non = CONFIG_INFO.leastCollisions;
function no(entity) {
    if (entity.getCollisionShape() + ""  != non) {
        entity.setCollisionShape(non);
        entity.sendUpdateC2S();
    }
}