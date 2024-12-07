/**
 * @author: Aphrodite281 QQ: 3435494979
 */

importPackage(java.awt);
importPackage(java.awt.geom);
include(Resources.id("aphrodite:library/code/text_u.js"));

const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const rms = MM.loadPartedRawModel(RU.manager(), RU.id("mtrsteamloco:eyecandies/stop_signc/main.obj"), null);

//const zhdh = RU.readFont(RU.id("aphrodite:library/font/zhdh.ttf")).deriveFont(Font.PLAIN, 60);
const zhdh = RU.getSystemFont("Noto Serif");
const m = "0, 1.5, 15, 16, 14.5, 16";

function create(ctx, state, entity) {
    let nu = false;
    pi = (key, mnum) => {
        let num = parseInt(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    pf = (key, mnum) => {
        let num = parseFloat(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        return num;
    }
    state.ca = pi("colorA", 0xffffff);
    state.cb = pi("colorB", 0);
    state.sc = pf("scale", 1);
    state.list = getList(entity);
    state.tex = drawTex(state.ca, state.cb, state.list);
    let rmd = rms.get("d").copy(); rmd.sourceLocation = null; setColor(rmd, state.ca); apScale(rmd, state.sc);
    let rmf = rms.get("f").copy(); rmf.sourceLocation = null; apScale(rmf, state.sc); rmf.replaceAllTexture(state.tex.identifier);
    state.d0 = new DynamicModelHolder(); state.d0.uploadLater(rmd);
    state.d1 = new DynamicModelHolder(); state.d1.uploadLater(rmf);
}
function render(ctx, state, entity) {
    ctx.setDebugInfo("list", state.list[3].length)
    let nu = false, isC = false, isC0 = false;
    pi = (key, mnum) => {
        let num = parseInt(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        if (num != mnum) isC = true;
        return num;
    }
    pf = (key, mnum) => {
        let num = parseFloat(entity.data.get(key));
        if (isNaN(num)) {
            num = mnum;
            entity.data.put(key, mnum + "");
            nu = true;
        }
        if (num != mnum) isC0 = true;
        return num;
    }
    state.ca = pi("colorA", state.ca);
    state.cb = pi("colorB", state.cb);
    state.sc = pf("scale", state.sc);
    let list = getList(entity);
    if (isChanged(state.list, list)) isC = true;
    state.list = list;
    if (isC0) {
        let rmd = rms.get("d").copy(); rmd.sourceLocation = null; setColor(rmd, state.ca); apScale(rmd, state.sc);
        let rmf = rms.get("f").copy(); rmf.sourceLocation = null; apScale(rmf, state.sc);
        state.d0.uploadLater(rmd);
        state.d1.uploadLater(rmf);
    }
    if (isC) {
        state.tex.close();
        state.tex = drawTex(state.ca, state.cb, state.list);
        setColor0(state.d0, state.ca);
    }
    try {
        state.d1.getUploadedModel().replaceAllTexture(state.tex.identifier);
    } catch (e) {}

    ctx.drawModel(state.d0, null);
    ctx.drawModel(state.d1, null);
}

function dispose(ctx, state, entity) {
    state.d0.close();
    state.d1.close();
    state.tex.close();
}

function setColor(rm, c) {
    let color = c << 8 | 0xff;
    for (let [mat, ml] of rm.meshList) {
        mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
    }
}

function setColor0(dyn, c) {
    let color = c << 8 | 0xff;
    let mc = dyn.getUploadedModel();
    let vs = [mc.uploadedOpaqueParts, mc.uploadedTranslucentParts];
    for (let v of vs) {
        for (let vr of v.meshList) {
            let mat = vr.materialProp;
            mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
        }
    }
}

function apScale(rm, s) {
    rm.applyTranslation(0, -0.5, 0.475);
    rm.applyScale(s, s, s);
    rm.applyTranslation(0, 0.5, -0.5 + 0.025 * s);
}

function getList(entity) {
    let st = MCU.getStationAt(entity.getWorldPosVector3f());
    let name = st.name;
    let cp = TextU.CP(name);
    let np = TextU.NP(name);
    let pla = MCU.getPlatformAt(entity.getWorldPosVector3f(), 5, 3, 4);
    let cs = [], ns = [];
    for (let ro of MCD.ROUTES) {
        if (ro.isHidden) continue;
        for (let i = 0; i < ro.platformIds.length; i++) {
            let rpf = ro.platformIds[i];
            if (rpf.platformId == pla.id) {
                cs.push(ro.color);
                let ind = i + 1;
                if (ind < ro.platformIds.length) {
                    let pid = ro.platformIds[ind].platformId;
                    let s = "Null|null";
                    for (let [id, st] of MCD.DATA_CACHE.platformIdToStation) {
                        if (id == pid) {
                            s = st.name;
                            break;
                        }
                    }
                    ns.push(s);
                }
                break;
            }
        }
    }
    return [cp, np, cs, ns];
}

function isChanged(l0, l1) {
    if (l0.length!= l1.length) return true;
    for (let i = 0; i < l0.length; i++) {
        if (l0[i].toString() != l1[i].toString()) return true;
    }
    return false;
}

function drawTex(dc, tc, [cp, np, cs, ns]) {
    let tex = new GraphicsTexture(400, 320);

    let g = tex.graphics;
    let zh = (cp, np, s0, s1, x, y0, y1) => {
        let f0 = zhdh.deriveFont(Font.PLAIN, s0);
        g.setFont(f0);
        g.drawString(cp, x - getW(cp, f0) / 2, y0);
        let f1 = zhdh.deriveFont(Font.PLAIN, s1);
        g.setFont(f1);
        g.drawString(np, x - getW(np, f1) / 2, y1);
    }
    g.setColor(new Color(dc));
    g.fillRect(0, 0, 400, 320);
    let w = 410 / cs.length, h = 20, x = 0, y = 180;
    for (let c of cs) {
        g.setColor(new Color(c));
        let path = new Path2D.Float();
        path.moveTo(x - 10, y);
        path.lineTo(x + w - 10, y);
        path.lineTo(x + w, y + h);
        path.lineTo(x, y + h);
        path.closePath();
        g.fill(path);
        x += w;
    }
    g.setColor(new Color(tc));
    zh(cp, np, 80, 50, 200, 90, 150);
    if (ns.length > 0) {
        zh("下一站", "Next  Station", 40, 18, 80, 260, 280);
        let l = ns.length;
        let x = 300, s0 = 50 / l, s1 = 30 / l, y = 210;
        for (let n of ns) {
            zh(TextU.CP(n), TextU.NP(n) + "", s0, s1, x, y + s0, y + s0 + s1 + 10 / l);
            y += s0 + s1 + 10 / l * 2;
        }
    } else {
        zh("终点站", "Terminus", 50, 20, 200, 260, 290);
    }

    tex.upload();
    return tex;
}

function getW(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return Math.ceil(bounds.getWidth());
}