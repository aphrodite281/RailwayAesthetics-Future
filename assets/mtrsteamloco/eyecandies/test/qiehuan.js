importPackage (java.lang);
importPackage (java.awt);
importPackage (java.io);
importPackage (java.awt.image);
importPackage (java.nio);
//importPackage (Package.fabric.cn.zbx1425.sowcer.vertex); 

include(Resources.id("aphrodite:library/code/face.js"));

const font0 = Resources.getSystemFont("Serif").deriveFont(Font.PLAIN, 80);
const rmm = ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/main.obj"), null);
//rmm.setMatixProcess(true);


function getW(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return Math.ceil(bounds.getWidth());
}

da = (g) => {//底图绘制
    g.setColor(Color.BLACK);
    g.fillRect(0, 0, 400, 400);
}

db = (g) => {//上层绘制
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, 400, 400);
    g.setColor(Color.RED);
    g.setFont(font0);
    let str = "晴纱是男娘";
    let ww = 400;
    let w = getW(str, font0);
    g.drawString(str, ww / 2 - w / 2, 200);
}

const mat = new Matrices();
mat.translate(0, 0.5, 0);

function create(ctx, state, entity) {
    let info = {
        ctx: ctx,
        isTrain: false,
        matrices: [mat],
        texture: [400, 400],
        model: rmm,
        model1: {
            renderType: "light",
            size: [1, 1],
            uvSize: [1, 1]
        },
        display: true
    }
    let f = new Face(info);
    state.f = f;


    let t = f.texture;
    let g = t.graphics;
    state.running = true;
    let fps = 24;
    da(g);//绘制底图
    t.upload();
    let k = 0;
    let ti = Date.now();
    let rt = 0;
    ck = v => v < 0 ? 0 : v;
    smooth = (k, v) => {// 平滑变化
        if (v > k) return k;
        if (k < 0) return 0;
        return (Math.cos(v / k * Math.PI + Math.PI) + 1) / 2 * k;
    }
    run = () => {// 新线程
        let id = Thread.currentThread().getId();
        print("Thread start:" + id);
        while (state.running) {
            try {
                k += (Date.now() - ti) / 1000 ;
                ti = Date.now();
                if (k > 1.5) {
                    k = 0;
                }
                setComp(g, 1);
                da(g);
                let kk = smooth(1, k);//平滑切换透明度
                setComp(g, kk);
                db(g);
                t.upload();
                ctx.setDebugInfo("rt" ,Date.now() - ti);
                ctx.setDebugInfo("k", k);
                ctx.setDebugInfo("sm", kk);
                rt = Date.now() - ti;
                Thread.sleep(ck(rt - 1000 / fps));
                ctx.setDebugInfo("error", 0)
            } catch (e) {
                ctx.setDebugInfo("error", e);
            }
        }
        print("Thread end:" + id);
    }
    //let th = new Thread(run, "qiehuan");
    //th.start();
    let matt = new Matrix4f();
    matt.translate(1, 2, 3);
    let m;
    ctx.setDebugInfo("xyz", matt.getEulerAnglesXYZ());
}

function render(ctx, state, entity) {
    state.f.tick();
    //ctx.drawModel(state.f.model, null);
}

function dispose(ctx, state, entity) {
    print("Dispose");
    state.running = false;
    state.f.close();
}

function setComp(g, value) {
    g.setComposite(AlphaComposite.SrcOver.derive(value));
}