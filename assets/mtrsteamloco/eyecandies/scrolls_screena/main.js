importPackage (java.lang);
importPackage (java.awt);
importPackage (java.awt.image);
include(Resources.id("aphrodite:library/code/scrolls_screen.js"));
include(Resources.id("aphrodite:library/code/board.js"));
include(Resources.id("aphrodite:library/code/face.js"));
include(Resources.id("aphrodite:library/code/color_int_base.js"));

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

const colors = [["colorA", 0x3d3d3d], ["colorB", 0xffffff], ["colorC", 0]];
const font = RU.readFont(RU.id("aphrodite:library/font/zhdh.ttf"));

function create(ctx, state, entity) {
    state.i = "";
    state.b = new Board({matrices: [new MS()], interval: 0.002});
}

function render(ctx, state, entity) {
    try {state.b.tick();} catch (e) {}
    let k = CIB.tick(ctx, state, entity, colors);
    let [nu, changed] = k;
    let i = gi(ctx, state, entity);
    nu = nu || i[1];
    if (i[0].toString() != state.i.toString() || changed) {
        state.b.close();
        state.i = i[0];
        state.b = nb(ctx, state);
    }
    if (nu) entity.sendUpdateC2S();
}

function dispose(ctx, state, entity) {
    state.b.close();
}

function gS(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
}

function gi(ctx, state, entity) {
    let nu = false;
    var ts = [], ss = [], sp = [], fnum = 0, sy = 0, hg = false;
    rs = () => {
        entity.data.put("uvSize", "200/20");
        ts = [200,20];
        nu = true;
    }
    rss = () => {
        nu = true;
        ss = [10, 1];
        entity.data.put("screenSize", "10/1");
    }
    rsp = () => {
        nu = true;
        sp = [10, 0];
        entity.data.put("speed", "10/0");
    }
    rsf = () => {
        nu = true;
        fnum = 16;
        entity.data.put("fontSize", "16");
    }
    rsy = () => {
        nu = true;
        sy = 0;
        entity.data.put("shiftY", "0");
    }
    pi = (str) => {
        let num = parseInt(str);
        return [num, isNaN(num)];
    }
    pf = (str) => {
        let num = parseFloat(str);
        return [num, isNaN(num)];
    }
    {
        let tes = entity.data.get("uvSize") + "";
        let sps = tes.split("/");
        if (sps.length != 2) rs();
        let k0 = pi(sps[0]);
        let k1 = pi(sps[1]);
        ts = [k0[0], k1[0]];
        if (k0[1] || k1[1]) rs();
    }
    {
        let scs = entity.data.get("screenSize") + "";
        let sps = scs.split("/");
        if (sps.length != 2) rss();
        let k0 = pf(sps[0]);
        let k1 = pf(sps[1]);
        ss = [k0[0], k1[0]];
        if (k0[1] || k1[1]) rss();
    }
    if (!entity.data.containsKey("text")) {
        entity.data.put("text", "Hello World!");
        nu = true;
    }
    {
        let sps = entity.data.get("speed") + "";
        let spd = sps.split("/");
        if (spd.length != 2) rsp();
        let k0 = pf(spd[0]);
        let k1 = pf(spd[1]);
        sp = [k0[0], k1[0]];
        if (k0[1] || k1[1]) rsp();
    }
    {
        let ff = entity.data.get("fontSize");
        let f = pi(ff);
        fnum = f[0];
        if (f[1]) rsf();
    }
    {
        let ssy = entity.data.get("shiftY");
        let k = pi(ssy);
        sy = k[0];
        if (k[1]) rsy();
    }
    {
        let hg0 = entity.data.get("hasGrid") + "";
        switch (hg0) {
            case "true":
                hg = true;
                break;
            case "false":
                hg = false;
                break;
            default:
                hg = true;
                entity.data.put("hasGrid", "true");
                nu = true;
                break;
        }
    }
    let text = entity.data.get("text") + "";
    return [[ts, ss, sp, fnum, sy, hg, text], nu];
}

function nb(ctx, state) {
    let cls = [state.colorA, state.colorB, state.colorC];
    let [ts, ss, sp, fnum, sy, hg, text] = state.i;
    let font0 = font.deriveFont(fnum);
    let [w, h] = gS(text, font0);
    let w0 = w;
    h = ts[1];
    if (w < ts[0]) {
        w = ts[0];
    }
    let mat = new MS();
    mat.translate(0, .5, 0);
    let bb = new Board({matrices: [mat], interval: 0.002});
    let info = {
        ctx: ctx,
        uvSpeed: sp,
        isTrain: false,
        matrices: [new MS()],
        running: true,
        texture: [w, h],
        model: {
            size: ss,
            renderType: "light",
            uvSize: ts
        },
        pixel: [1, 1]
    }
    bb.addBoard("def").addLayer();
    let s = new SS(info);
    let tex = s.texture;
    let g = tex.graphics;
    g.setFont(font0);
    g.setColor(new Color(cls[0]));
    g.fillRect(0, 0, w, h);
    g.setColor(new Color(cls[1]));
    g.drawString(text, w / 2 - w0 / 2, h + sy - fnum / 6);
    tex.upload();
    bb.addItem(s);
    if (hg) {
        d = () => {
            try {
                let grid = new BufferedImage(15, 15, BufferedImage.TYPE_INT_ARGB);
                let g;
                let ps = 15, k = 3;
                g = grid.createGraphics();
                g.setColor(new Color(cls[2]));
                g.fillRect(0, 0, ps, ps);
                g.setComposite(AlphaComposite.Src);
                g.setColor(new Color(0, 0, 0, 0));
                g.fillOval(k, k, ps - k, ps - k);
                
                let kx = w * ps, ky = h * ps;
                let nt = new GT(kx, ky);
                g = nt.graphics;
                g.drawImage(tex.bufferedImage, 0, 0, kx, ky, null);
                for (let i = 0; i < w; i++) {
                    for (let j = 0; j < h; j++) {
                        g.drawImage(grid, i * ps, j * ps, null);
                    }
                }
                nt.upload();
                s.setTexture(nt);
                ctx.setDebugInfo("Grid", "Done");
            } catch (e) {
                ctx.setDebugInfo("Grid", e.toString());
            }
        }
        ctx.setDebugInfo("Grid", "Start");
        let t = new Thread(d, "GridThread");
        t.start();
        state.t = t;
    }
    
    return bb;
}