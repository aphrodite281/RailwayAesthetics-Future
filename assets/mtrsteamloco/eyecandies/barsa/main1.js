include(Resources.idr("common0.js"));

const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const model = MM.loadRawModel(RU.mgr(), RU.idr("endr.obj"), null);

function create(ctx, state, entity) {
    c(ctx, state, entity, model);
}

function render(ctx, state, entity) {
    r(ctx, state, entity);
}