const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;
const GT = GraphicsTexture;
const TM = Timing;
const SH = SoundHelper;
const PH = ParticleHelper;
const TS = TickableSound;
const DM = DynamicModelHolder;
const MS = Matrices;
const M4 = Matrix4f;
const V3 = Vector3f;
const RB = RawMeshBuilder;
//https://gitee.com/anecansaitin/HitboxApi/tree/master
let bur = RU.grabFrame(RU.id("mtrsteamloco:eyecandies/test/k.mp4"), 1);

function render(ctx, state, entity) {
    ctx.setDebugInfo("i", bur)
}