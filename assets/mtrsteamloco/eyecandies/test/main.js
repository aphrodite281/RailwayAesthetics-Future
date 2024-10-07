const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

const abc = ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/1.obj"), null);
abc.applyUVMirror(false, true);
const def = ModelManager.uploadVertArrays(abc);

function create(ctx, state, entity) {

}

function render(ctx, state, entity) {
    ctx.drawModel(def, null);
}