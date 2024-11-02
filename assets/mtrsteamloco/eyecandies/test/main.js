include(Resources.id("mtrsteamloco:library/code/board.js"));

const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

let rmb = new RawMeshBuilder(4, "light", RU.id("mtrsteamloco:eyecandies/psda/t1"));

rmb.vertex(-1, 1, 0).normal(0, 1, 0).uv(0, 0).endVertex().vertex(1, 1, 0).normal(0, 1, 0).uv(1, 0).endVertex().vertex(1, -1, 0).normal(0, 1, 0).uv(1, 1).endVertex().vertex(-1, -1, 0).normal(0, 1, 0).uv(0, 1).endVertex();

let mesh = rmb.getMesh();
//mesh.triangulate(); 

function create(ctx, state, entity) {
}

function render(ctx, state, entity) {
    ctx.setDebugInfo("getNTEVersion", RU.getNTEVersion())
    ctx.setDebugInfo("vnum", mesh.vertices.size());
    ctx.setDebugInfo("fnum", mesh.faces.size());
    ctx.setDebugInfo("e", entity.lightLevel);
    //entity.shape = "0, 0, 0, 16, 8, 16/0, 0, 0, 16, 24, 16";
    //entity.sendUpdateC2S();
}