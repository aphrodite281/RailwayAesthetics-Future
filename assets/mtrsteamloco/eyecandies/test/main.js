const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

function create(ctx, state, entity) {

}

function render(ctx, state, entity) {
    ctx.setDebugInfo("pl", entity.platformId);
    ctx.setDebugInfo("size", entity.schedules.size());
    for(entry of entity.schedules) {
        ctx.setDebugInfo(entry.arrivalMillis);
    }
    ctx.setDebugInfo("ticks",entity.ticks);
}