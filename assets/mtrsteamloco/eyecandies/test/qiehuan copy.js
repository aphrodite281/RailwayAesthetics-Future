importPackage (java.lang);
importPackage (java.awt);
importPackage (java.io);
importPackage (java.awt.image);

include(Resources.id("aphrodite:library/code/model/face.js"));

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

const a = new BufferedImage(400, 400, BufferedImage.TYPE_INT_ARGB);
const b = new BufferedImage(400, 400, BufferedImage.TYPE_INT_ARGB);

let g;
g = a.createGraphics();
g.setColor(Color.WHITE);
g.fillRect(0, 0, 400, 400);

g = b.createGraphics();
g.setColor(Color.BLACK);
g.fillRect(0, 0, 400, 400);

const mat = new MS();
mat.translate(0, 0.5, 0);

function create(ctx, state, entity) {
    let info = {
        ctx: ctx,
        isTrain: false,
        matrices: [mat],
        texture: [400, 400],
        model: {
            renderType: "light",
            size: [1, 1],
            uvSize: [1, 1]
        }
    }
    let f = new Face(info);
    state.f = f;

    state.t = f.texture;
    state.g = state.t.graphics;
    state.running = true;
    state.fps = 24;
    state.g.drawImage(b, 0, 0, null);
    state.t.upload();
    state.k = TM.delta();
}

function render(ctx, state, entity) {
    state.f.tick();

    state.k += TM.delta() * 0.1;
    if (state.k > 1) {
        state.k = 0;
    }
    setComp(state.g, 1);
    state.g.drawImage(a, 0, 0, null);
    setComp(state.g, state.k);
    state.g.drawImage(b, 0, 0, null);
    state.t.upload();
}

function setComp(g, value) {
    g.setComposite(AlphaComposite.SrcOver.derive(value));
}

function dispose(ctx, state, entity) {
    state.running = false;
    state.f.close();
}