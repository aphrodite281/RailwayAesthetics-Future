importPackage(java.awt);

include(Resources.id("mtrsteamloco:library/code/scrolls_screen.js"));

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

function create(ctx, state, entity) {
    let nu = false;//needUpdate

    const list = getList(entity);
    state.list = list;
    state.colors = [new Color(0x3936ff), new Color(0xffffff)];
    
    let num;
    num = parseInt(entity.data.get("colorA"));
    if (isNaN(num)) {
        entity.data.put("colorA", "0x3936ff");
        num = 0x3936ff;
    }
    state.colors[0] = num;
    num = parseInt(entity.data.get("colorB"));
    if (isNaN(num)) {
        entity.data.put("colorB", "0xffffff");
        num = 0xffffff;
    }
    state.colors[1] = num;
    num = parseFloat(entity.data.get("scale"))
    if (isNaN(num)) {
        entity.data.put("scale", "1.0");
        num = 1.0;
    }
    state.scale = num;

    let gs = getSlogan(entity);
    if (gs[0]) nu = true;
    state.sl = gs[1];
    
    state.d0 = new DynamicModelHolder(); state.d2 = new DynamicModelHolder();
    let osc0 = sc0.copy(); osc0.sourceLocation = null; osc0.applyScale(state.scale, state.scale, state.scale);
    let od = d.copy(); od.sourceLocation = null; od.applyScale(state.scale, state.scale, state.scale);
    state.d0.uploadLater(osc0); state.d2.uploadLater(od);

    state.tex = drawTexture(list, state.colors);

    state.slo = drawSlogan(state.sl, state.colors);
    state.ss = newSS(state.slo, ctx, state.scale);

    if (nu) entity.sendUpdateC2S();
    state.slc = 0;
}

function render(ctx, state, entity) {
    //ctx.clearDebugInfo();   

    state.ss.tick();


    
    const list = getList(entity);

    let isC, nu = false;//isChanged, needUpdate

    isC = false;
    let num;
    num = parseInt(entity.data.get("colorA"));
    if (isNaN(num)) {
        entity.data.put("colorA", "0x3936ff");
        num = 0x3936ff;
        nu = true;
    }
    if (state.colors[0] != num) {isC = true; state.colors[0] = num;}
    
    num = parseInt(entity.data.get("colorB"));
    if (isNaN(num)) {
        entity.data.put("colorB", "0xffffff");
        num = 0xffffff;
        nu = true;
    }
    if (state.colors[1] != num) {isC = true; state.colors[1] = num;}

    let gs = getSlogan(entity);
    if (gs[0]) nu = true;
    if (isChanged0(gs[1], state.sl)) {
        state.slc++;
        state.sl = gs[1];
        state.ss.close();
        state.slo = drawSlogan(state.sl, state.colors);
        state.ss = newSS(state.slo, ctx, state.scale);
    }

    if (isC || isChanged(list, state.list)) {
        state.tex.close();
        state.tex = drawTexture(list, state.colors);
        state.ss.close();
        state.slo = drawSlogan(state.sl, state.colors);
        state.ss = newSS(state.slo, ctx, state.scale);
        state.list = list;
    }

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

    let msc0 = state.d0.getUploadedModel(); msc0.replaceAllTexture(state.tex.identifier);

    ctx.drawModel(state.d0, null); ctx.drawModel(state.d2, null);

    if(nu) entity.sendUpdateC2S();
}

function disposes(ctx, state, entity) {
    state.tex.close();
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
    const  w = 500, h = 60, lw = 4;
    const sx = 3000, sy = 1200;
    const texture = new GraphicsTexture(sx, sy);
    const g = texture.graphics;

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

    x = 0, y = 50;
    g.setFont(font0);
    for (let i = 0; i < 20; i++) {
        g.setColor(new Color(cs[1]));
        if (list[i] == null) break;

        let entry = list[i];
        for (let i = 0; i < 5; i++) {
            g.drawString(entry[i], x + 500 / 2 - getW(entry[i], font0) / 2, y);
            x += w;
        }
        g.setColor(new Color(entry[5][0]));
        g.drawString(entry[5][1], x + 500 / 2 - getW(entry[5][1], font0) / 2, y);
        y += h;
        x = 0;
    }

    texture.upload();
    return texture;
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

function getList(entity) {
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

    const list = [];
    //list.push(["", "", "", "", "", [0xffffff, ""]])
    list.push(["车次", "始发站", "终到站", "开点", "检票口", [0xffffff, "状态"]])
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
        rn = ns[2], sf = ns[0], zd = ns[1];
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
        if (minus <= 2) zt = [0xff0000, "停止检票"];
        if (minus > 2 && minus <= 5) zt = [0x00ff00, "正在检票"];
        if (minus > 5) zt = [0xffffff, "预计正点"];//没什么好办法判断正点晚点
        list.push([rn, sf, zd, kd, jpk, zt]);
    }
    return list;
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
    
    for (let i = 0; i < 5; i++) {
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