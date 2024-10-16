importPackage(java.awt);

include(Resources.id("mtrsteamloco:library/code/scrolls_screen.js"));
include(Resources.id("mtrsteamloco:library/code/text_u.js"));

const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const SS = ScrollsScreen;

const ras = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/pida/main.obj"), null);
const sc0 = ras.get("sc0");
//sc0.applyUVMirror(false, true);
const sc1 = ras.get("sc1");
//sc1.applyUVMirror(false, true);
const d = ras.get("d");
//d.applyUVMirror(false, true);

const mcs = uploadPartedModels(ras);

//const font0 = Resources.readFont(Resources.id("mtrsteamloco:library/font/zhdh.ttf")).deriveFont(Font.PLAIN, 56);
const font0 = RU.getSystemFont("Noto Serif").deriveFont(Font.PLAIN, 55);

const mrs = "0xffffff$欢迎来到 Railway Aesthetics - Future     我们的交流群: /0x19ffff$836291719/0xfbb8ff$        晴纱是男娘          ";

const kh = 0.02

const mls = "5.0/15.0";//默认限制（时间）

function create(ctx, state, entity) {
    let nu = false;//needUpdate

    let lts = getLimits(entity);
    if (lts[0]) nu = true;
    state.lts = lts[1];

    state.colors = [0x3936ff, 0xffffff, 0xff0000, 0x00ff00, 0xffffff];
    
    pn = (str, mnum) => {
        let num = parseInt(entity.data.get(str));
        if (isNaN(num)) {
            entity.data.put(str, mnum + "");
            num = mnum;
            nu = true;
        }
        return num;
    }

    pf = (str, mnum) => {
        let num = parseFloat(entity.data.get(str));
        if (isNaN(num)) {
            entity.data.put(str, mnum + "");
            num = mnum;
            nu = true;
        }
        return num;
    }

    let ac = pn("colorA", 0x3936ff);
    let bc = pn("colorB", 0xffffff);
    let cc = pn("colorC", 0xff0000);
    let dc = pn("colorD", 0x00ff00);
    let ec = pn("colorE", 0xffffff);

    state.colors = [ac, bc, cc, dc, ec];

    state.in = pn("interval", 5.0);

    let num;
    num = parseFloat(entity.data.get("scale"))
    if (isNaN(num)) {
        entity.data.put("scale", "1.0");
        num = 1.0;
        nu = true;
    }
    state.scale = num;

    let gs = getSlogan(entity);
    if (gs[0]) nu = true;
    state.sl = gs[1];

    state.d0 = new DynamicModelHolder(); state.d1 = new DynamicModelHolder(); state.d2 = new DynamicModelHolder();
    let osc0 = sc0.copy(); osc0.sourceLocation = null; osc0.applyScale(state.scale, state.scale, state.scale);
    let osc1 = sc0.copy(); osc0.sourceLocation = null; osc1.applyScale(state.scale, state.scale, state.scale);
    let od = d.copy(); od.sourceLocation = null; od.applyScale(state.scale, state.scale, state.scale);
    state.d0.uploadLater(osc0); state.d1.uploadLater(osc1); state.d2.uploadLater(od);

    const list = getList(entity, state.lts, state.colors);
    state.list = list;

    state.tex = drawTexture(list, state.colors);

    state.slo = drawSlogan(state.sl, state.colors);
    state.ss = newSS(state.slo, ctx, state.scale);

    state.lt = Timing.elapsed();

    state.tnum = 0;

    if (nu) entity.sendUpdateC2S();
}

function render(ctx, state, entity) {

    //ctx.setDebugInfo("0",state.tex[0]);
    //ctx.setDebugInfo("1",state.tex[1]);
    ctx.setDebugInfo("tnum",state.tnum);

    ctx.setDebugInfo("cp", TextU.CP("abc|edf"));

    gn = [(str) => {return TextU.CP(str)}, (str) => {return TextU.NP(str)}];
    ctx.setDebugInfo("cpp", gn[0]("abc|edf"));

    ctx.setDebugInfo("l10", state.list[0][0][0]);

    state.ss.tick();
    
    let list = state.list;

    let isC, nu = false;//isChanged, needUpdate

    isC = false;

    pn = (onum, str, mnum) => {
        let num = parseInt(entity.data.get(str));
        if (isNaN(num)) {
            entity.data.put(str, mnum + "");
            num = mnum;
            nu = true;
        }
        if (onum != num) isC = true;
        return num;
    }

    pf = (str, mnum) => {
        let num = parseFloat(entity.data.get(str));
        if (isNaN(num)) {
            entity.data.put(str, mnum + "");
            num = mnum;
            nu = true;
        }
        return num;
    }

    let ac = pn(state.colors[0], "colorA", 0x3936ff);
    let bc = pn(state.colors[1], "colorB", 0xffffff);
    let cc = pn(state.colors[2], "colorC", 0xff0000);
    let dc = pn(state.colors[3], "colorD", 0x00ff00);
    let ec = pn(state.colors[4], "colorE", 0xffffff);

    state.colors = [ac, bc, cc, dc, ec];

    state.in = pf("interval", 5.0);

    let gs = getSlogan(entity);
    if (gs[0]) nu = true;
    if (isChanged0(gs[1], state.sl)) {
        state.sl = gs[1];
        state.ss.close();
        state.slo = drawSlogan(state.sl, state.colors);
        state.ss = newSS(state.slo, ctx, state.scale);
    }

    let lts = getLimits(entity);
    if (lts[0]) nu = true;
    if (isChanged1(lts[1], state.lts)) {
        isC = true;
    }
    state.lts = lts[1];

    if (state.lt + state.in < Timing.elapsed()) {//每几秒更新一次
        list = getList(entity, state.lts, state.colors);
        if (isChanged(list, state.list)) {
            state.list = list;
            isC = true;
        }
        state.tnum = (state.tnum + 1) % 2;
        state.lt = Timing.elapsed();
    }

    if (isC) {
        state.lts = getLimits(entity)[1];
        list = getList(entity, state.lts, state.colors);
        state.list = list;
        state.tex[0].close();
        state.tex[1].close();
        state.tex = drawTexture(list, state.colors);
        state.ss.close();
        state.slo = drawSlogan(state.sl, state.colors);
        state.ss = newSS(state.slo, ctx, state.scale);
        state.list = list;
    }

    let num;
    num = parseFloat(entity.data.get("scale"))
    if (isNaN(num)) {
        entity.data.put("scale", "1.0");
        num = 1.0;
        nu = true;
    }
    if (state.scale != num) {
        state.scale = num;
        state.ss.close();
        state.slo = drawSlogan(state.sl, state.colors);
        state.ss = newSS(state.slo, ctx, state.scale);
        let osc0 = sc0.copy(); osc0.sourceLocation = null; osc0.applyScale(state.scale, state.scale, state.scale);
        let od = d.copy(); od.sourceLocation = null; od.applyScale(state.scale, state.scale, state.scale);
        state.d0.uploadLater(osc0); state.d2.uploadLater(od);
    }

    let msc0 = state.d0.getUploadedModel(); msc0.replaceAllTexture(state.tex[0].identifier);
    let msc1 = state.d1.getUploadedModel(); msc1.replaceAllTexture(state.tex[1].identifier);

    ctx.drawModel(state.tnum ? state.d0 : state.d1, null); ctx.drawModel(state.d2, null);

    if(nu) entity.sendUpdateC2S();
}

function disposes(ctx, state, entity) {
    state.tex[0].close();
    state.tex[1].close();
    state.ss.close();
    state.d0.close();
    state.d1.close();
    state.d2.close();
}

function getTime(time) {
    let hours = Math.ceil((time / 3600 / 1000  + 8) % 24);
    let minutes = Math.ceil(time / 60 / 1000 % 60);
    return hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
}

function isChanged1(l0, l1) {
    return (l0[0] != l1[0] || l0[1] != l1[1]);
}

function isChanged0(s0, s1) {
    if(s0.length != s1.length) return true;
    for (let i = 0; i < s0.length; i++) {
        if (s0[i][0].toString() != s1[i][0].toString() || s0[i][1] != s1[i][1]) return true;
    }
    return false;
}

function isChanged(list0, list1) {
    if (list0.length != list1.length) return true;
    for (let i = 0; i < list0.length; i++) {
        entry0 = list0[i]; entry1 = list1[i];
        if (entry0[0] != entry1[0] || entry0[1] != entry1[1] || entry0[2] != entry1[2] || entry0[3] != entry1[3] || entry0[4] != entry1[4] || entry0[5][0] != entry1[5][0] || entry0[5][1] != entry1[5][1]) return true;
    }
    return false;
}

function drawTexture(list, cs) {
    let x = 0, y = 0;
    const w = 500, h = 60, lw = 4;
    const sx = 3000, sy = 1200;
    const texs = [];
    for (let j = 0; j < 2; j++){
        let tex = new GraphicsTexture(sx, sy);
        let g = tex.graphics;
    
        x = 0, y = 0;
        g.setColor(new Color(cs[0]))
        g.fillRect(x, y, sx, sy);
        g.setColor(new Color(cs[1]));
        for (let i = 0; i < 7; i++) {
            g.fillRect(x - lw / 2, y, lw, sy);
            x += w;
        }
    
        x = 0, y = 0;
        for (let i = 0; i < 21; i++) {
            g.fillRect(x, y - lw / 2, sx, lw);
            y += h;
        }
    
        let list0 = list[j];
        x = 0, y = 50;
        g.setFont(font0);
        for (let i = 0; i < 20; i++) {
            g.setColor(new Color(cs[1]));
            if (list0[i] == null) break;
    
            let entry = list0[i];
            for (let i = 0; i < 5; i++) {
                g.drawString(entry[i], x + 500 / 2 - getW(entry[i], font0) / 2, y);
                x += w;
            }
            g.setColor(new Color(entry[5][0]));
            g.drawString(entry[5][1], x + 500 / 2 - getW(entry[5][1], font0) / 2, y);
            y += h;
            x = 0;
        }
        tex.upload();
        texs.push(tex);
    }
    
    return texs;
}

function drawSlogan(sl, cs) {
    let w0 = 0, w1 = 0, ws = [];
    let font = font0.deriveFont(Font.PLAIN, 75);
    for (let [color, text] of sl) {
        let ww = getW(text, font);
        w0 += ww;
        ws.push(ww);
    }
    let run = false;
    if (w0 < 2800) {
        run = false;
        w1 = 3000;
    } else {
        run = true;
        w1 = w0;
    }
    let tex = new GraphicsTexture(w1, 80);
    let g = tex.graphics;
    g.setColor(new Color(cs[0]));
    g.fillRect(0, 0, w1, 80);
    g.setFont(font);
    let x = w1 / 2 - w0 / 2;
    for (let i = 0; i < sl.length; i++) {
        let color = sl[i][0];
        let text = sl[i][1];
        g.setColor(color);
        g.drawString(text, x, 70);
        x += ws[i];
    }

    tex.upload();
    return [run, tex, w1];
}

function getW(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return Math.ceil(bounds.getWidth());
}

function getList(entity, limits, cs) {
    let station = MCU.getStationAt(entity.getWorldPosVector3f());

    let plaIds = []; 
    for (let [key, value] of MCD.DATA_CACHE.platformIdToStation) {
        if (station.id == value.id) {
            plaIds.push(key);
        }
    }

    let plas = [];
    for (let plaId of plaIds) {
        for (let pla of MCD.PLATFORMS) {
            if (pla.id == plaId) {
                plas.push(pla);
                break;
            }
        }
    }

    let swp = [];//schesWithPlas
    for (let pla of plas) {
        for (let [key, value] of MCD.SCHEDULES_FOR_PLATFORM) {
            if (key == pla.id) {
                for (let sche of value) {
                    swp.push([sche, pla]);
                }
                break;
            }
        }
    }
    swp.sort((a, b) => a[0].arrivalMillis - b[0].arrivalMillis);

    gn = [(str) => {return TextU.CP(str)}, (str) => {return TextU.NP(str)}];

    const lists = [];
    for (let j = 0; j < 2; j++) {
        let list = [];
        //list.push(["", "", "", "", "", [0xffffff, ""]])
        if (!j) list.push(["车次", "始发站", "终到站", "开点", "检票口", [cs[1], "状态"]]);//第一次中文
        if (j)  list.push(["Train", "From", "To", "Departure", "Check-in", [cs[1], "Status"]]);//第二次英文

        for (let [sche, pla] of swp) {
            let rn = "null", sf = "null", zd = "null", kd = "null", jpk = "null", zt = [0xffffff, "null"];//车次 始发站 终到站 开点 检票口 状态
            let ns = ["null", "null", "null"];
            for (let rot of MCD.ROUTES) {
                if (rot.id == sche.routeId) {
                    let pids = rot.platformIds;
                    for (let i = 0; i < 2; i++) {
                        let p = pids[i == 0 ? 0 : pids.size() - 1];
                        let pid = p.platformId;
                        let st;
                        for (let [key, value] of MCD.DATA_CACHE.platformIdToStation) {
                            if (key == pid) {
                                st = value;
                                break;
                            }
                        }
                        let n = "null";
                        if (st != null) {
                            n = st.name;
                        }
                        ns[i] = n;
                    }
                    ns[2] = rot.name;
                }
            }
            rn = gn[j](ns[2]), sf = gn[j](ns[0]), zd = gn[j](ns[1]);
            kd = getTime(sche.arrivalMillis);
            let num = parseInt(pla.name);
            if (!isNaN(num)) {
                if (num % 2 == 0) {
                    jpk = sche.trainCars > 8 ? ((num - 1) + "A·" + (num - 1) + "B·" + num + "A·" + num + "B") : ((num - 1 ) + "A·" + num + "B");
                }else {
                    jpk = sche.trainCars > 8 ? (num + "A·" + num + "B·" + (num + 1) + "A·" + (num + 1) + "B") : (num + "A·" + (num + 1) + "B");
                }
            }else {
                jpk = pla.name;
            }
            let time = sche.arrivalMillis - Date.now() + pla.dwellTime / 2 * 1000;
            let minus = time / 60 / 1000
            if (minus <= limits[0]) zt = [cs[2], gn[j]("停止检票|Stop Checking")];
            if (minus > limits[0] && minus <= limits[1]) zt = [cs[3], gn[j]("正在检票|Checking")];
            if (minus > limits[1]) zt = [cs[4], gn[j]("正在候车|Waiting")];
            list.push([rn, sf, zd, kd, jpk, zt]);
        }
        lists.push(list);
    }
    
    return lists;
}

function uploadPartedModels(rawModels) {
    let result = {};
    for (it = rawModels.entrySet().iterator(); it.hasNext(); ) {
      entry = it.next();
      entry.getValue().applyUVMirror(false, true);
      result[entry.getKey()] = ModelManager.uploadVertArrays(entry.getValue());
    }
    return result;
}

function getSlogan(entity) {
    let nu = false;
    let put = () => {entity.data.put("slogan", mrs); nu = true};
    
    for (let i = 0; i < 2; i++) {//尝试2次 防止格式错误
        let text = entity.data.get("slogan") + "";
        if (text == null) {
            put();
            continue;
        };
        let ts = text.split("/");
        try {
            let result = [];
            for (let text of ts) {
                let tt = text.split("$");
                if (tt.length != 2) {
                    put();
                    continue;
                }
                result.push([new Color(parseInt(tt[0])), tt[1]]);
            }
            return [nu, result];
        }catch (e) {
            put();
            continue;
        }
    }
    
    return [nu, [[new Color(0), "TNND 失败了"]]];
}

function getLimits(entity) {
    let nu = false;
    let put = () => {entity.data.put("limits", mls); nu = true};
    
    for (let i = 0; i < 2; i++) {
        let text = entity.data.get("limits") + "";
        if (text == null) {
            put();
            continue;
        };
        let ts = text.split("/");
        try {
            if (ts.length != 2) {
                put();
                continue;
            }
            for (let i = 0; i < 2; i++) {
                let num = parseInt(ts[i]);
                if (isNaN(num)) {
                    put();
                    continue;
                }
            }
            return [nu, [parseFloat(ts[0]), parseFloat(ts[1])]];
        }catch (e) {
            put();
            continue;
        }
    }
    return [nu, [-1, -1]];
}

function newSS(slo, ctx, scale) {
    let v = 3000 / slo[2];
    let rawModel = sc1.copy();
    rawModel.sourceLocation = null;
    for (let [key, value] of rawModel.meshList) {
        for (let vert of value.vertices) {
            if (vert.u == 1) {
                vert.u = v;
            }
        }
    }
    rawModel.applyScale(scale, scale, scale);
    rawModel.replaceAllTexture(slo[1].identifier);
    let info = {
        uvSpeed: [100, 0],
        running: slo[0],
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: slo[1],
        model: rawModel
    }
    return new SS(info);
}

function rn(n1, n2) {
    return Math.random() * (n2 - n1) + n1;
}