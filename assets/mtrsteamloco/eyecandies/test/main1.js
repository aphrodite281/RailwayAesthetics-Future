importPackage (java.lang);
importPackage (java.lang.management);
importPackage (java.awt);
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

const mat = new MS();
mat.translate(0, 0.5, 0);
let ts = [];

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

    let tex = f.texture;
    state.running = true;
    state.fps = 24;
    r = () => {
        try {
            let id = Thread.currentThread().getId();
            print("Start" + id);
            let tx = 0;
            let lt = System.currentTimeMillis();
            let g = tex.graphics;
            let k = 1;
            let cs = [];
            for (let i = 0; i < 16; i++) {
                cs.push(new Color(rn(0, 0xffffff)));
            }
            while (state.running) {
                let t = System.currentTimeMillis();
                let dt = t - lt;
                lt = t;
                tx += k * dt / 1000 * 50;
                let ft = 400 - tx - 20;
                if (tx + 20 >= 400) k = -1, tx = 400 - 20;
                if (tx <= 0) k = 1, tx = 0;
                g.setColor(new Color(0));
                g.fillRect(0, 0, 400, 400);
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        let c = cs[i * 4 + j];
                        g.setColor(c);
                        let p = [];
                        let k = [i, j];
                        for (let l = 0; l < 2; l++) {
                            switch (k[l]) {
                                case 0: p[l] = 0; break;
                                case 1: p[l] = tx; break;
                                case 2: p[l] = ft; break;
                                case 3: p[l] = 380; break;
                            }
                        }
                        g.fillRect(p[0], p[1], 20, 20);
                    }
                }
                tex.upload();
                let fps = state.fps;
                ctx.setDebugInfo("dt", dt + "/" + 1000 / fps);
                ctx.setDebugInfo("tx", tx);
                let st = 1000 / fps - (t - System.currentTimeMillis());
                Thread.sleep(st > 0 ? st : 0);
            }
            print("Done" + id);
        } catch (e) {
            ctx.setDebugInfo("e", e);
        }
    }
    state.t = new Thread(r, "dyn");
    state.t.start();
    ts.push(state.t);
}

function render(ctx, state, entity) {
    ctx.setDebugInfo("tid", state.t.getId());
    try {state.f.tick();} catch (e) {}
    ctx.setDebugInfo("t", state.t.isAlive());
}

function dispose(ctx, state, entity) {
    state.running = false;
}

function rn(a, b) {
    return Math.ceil(Math.random() * (b - a) + a);
}