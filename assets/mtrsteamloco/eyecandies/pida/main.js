importPackage(java.awt);

const MCU = MinecraftClient;
const MCD = MTRClientData;

const ra = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/pida/main.obj"), null);
const sc0 = ra.get("sc0");
sc0.applyUVMirror(false, true);
const sc1 = ra.get("sc1");
sc1.applyUVMirror(false, true);
const d = ra.get("d");
d.applyUVMirror(false, true);

const font0 = Resources.readFont(Resources.id("mtrsteamloco:library/font/zhdh.ttf")).deriveFont(Font.PLAIN, 56);

function create(ctx, state, entity) {
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

    state.d0 = new DynamicModelHolder(); state.d1 = new DynamicModelHolder(); state.d2 = new DynamicModelHolder();
    let osc0 = sc0.copy(); osc0.sourceLocation = null; osc0.applyScale(state.scale, state.scale, state.scale);
    let osc1 = sc1.copy(); osc1.sourceLocation = null; osc1.applyScale(state.scale, state.scale, state.scale);
    let od = d.copy(); od.sourceLocation = null; od.applyScale(state.scale, state.scale, state.scale);
    state.d0.uploadLater(osc0); state.d1.uploadLater(osc1); state.d2.uploadLater(od);

    state.tex = drawTexture(list, state.colors);
}

function render(ctx, state, entity) {
    entity.radius = 15;
    entity.sendUpdateC2S(true);
    //entity.sendUpdateC2S(false);

    ctx.setDebugInfo("tex", state.tex)
    const list = getList(entity);

    let isC;

    isC = false;
    let num;
    num = parseInt(entity.data.get("colorA"));
    if (isNaN(num)) {
        entity.data.put("colorA", "0x3936ff");
        num = 0x3936ff;
        entity.sendUpdateC2S(true);
    }
    if (state.colors[0] != num) {isC = true; state.colors[0] = num;}
    
    num = parseInt(entity.data.get("colorB"));
    if (isNaN(num)) {
        entity.data.put("colorB", "0xffffff");
        num = 0xffffff;
        entity.sendUpdateC2S(true);
    }
    if (state.colors[1] != num) {isC = true; state.colors[1] = num;}

    if (isC || isChanged(list, state.list)) {
        state.tex.close();
        state.tex = drawTexture(list, state.colors);
        state.list = list;
    }

    num = parseFloat(entity.data.get("scale"))
    if (isNaN(num)) {
        entity.data.put("scale", "1.0");
        num = 1.0;
        entity.sendUpdateC2S(true);
    }
    if (state.scale != num) {
        let osc0 = sc0.copy(); osc0.sourceLocation = null; osc0.applyScale(state.scale, state.scale, state.scale);
        let osc1 = sc1.copy(); osc1.sourceLocation = null; osc1.applyScale(state.scale, state.scale, state.scale);
        let od = d.copy(); od.sourceLocation = null; od.applyScale(state.scale, state.scale, state.scale);
        state.d0.uploadLater(osc0); state.d1.uploadLater(osc1); state.d2.uploadLater(od);
        state.scale = num;
    }

    let msc0 = state.d0.getUploadedModel(); msc0.replaceAllTexture(state.tex.identifier);

    ctx.drawModel(state.d0, null); ctx.drawModel(state.d1, null); ctx.drawModel(state.d2, null);

    ctx.setDebugInfo("list", state.list.length)

}

function getTime(time) {
    let hours = Math.ceil((time / 3600 / 1000  + 8) % 24);
    let minutes = Math.ceil(time / 60 / 1000 % 60);
    return hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
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
    const  w = 500, h = 60;
    const sx = 3000, sy = 1200;
    const texture = new GraphicsTexture(sx, sy);
    const g = texture.graphics;

    x = 0, y = 0;
    g.setColor(new Color(cs[0]))
    //g.fillRect(x, y, sx, sy);
    g.setColor(new Color(cs[1]));
    for (let i = 0; i < 7; i++) {
        g.fillRect(x - 2, y, 4, sy);
        x += w;
    }

    x = 0, y = 0;
    for (let i = 0; i < 21; i++) {
        g.fillRect(x, y - 2, sx, 4);
        y += h;
    }

    x = 0, y = 45;
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

function getW(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return Math.ceil(bounds.getWidth());
}

function getList(entity) {
    let swp = [];//schesWithPlas
    for (let key of entity.schedules.keySet()) {
        let pla;
        for (let pl of MCD.PLATFORMS) {
            if (pl.id == key) {
                pla = pl;
                break;
            }
        }
        let schess = entity.schedules.get(key);
        for (let sche of schess) {
            swp.push([sche, pla]);
        }
    }
    swp.sort((a, b) => a[0].arrivalMillis - b[0].arrivalMillis);

    const list = [];
    for (let [sche, pla] of swp) {
        let rn = "null", sf = "null", zd = "null", kd = "null", jpk = "null", zt = [new Color(0xff00ff), "null"];//线路名 始发站 终到站 开点 检票口 状态
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
                jpk = sche.trainCars > 8 ? (num + "A, " + num + "B" + (num - 1) + "A" + (num - 1) + "B") : (num + "A, " + (num - 1 ) + "A");
            }else {
                jpk = sche.trainCars > 8 ? (num + "B, " + num + "A" + (num + 1) + "B" + (num + 1) + "A") : (num + "B, " + (num + 1) + "B");
            }
        }else {
            jpk = pla.name;
        }
        let time = sche.arrivalDiffMillis + pla.dwellTime / 2 * 1000;
        let minus = time / 60 / 1000
        if (minus <= 5) zt = [0xff0000, "停止检票"];
        if (minus > 5 && minus <= 20) zt = [0x00ff00, "正在检票"];
        if (minus > 20) zt = [0xffffff, "预计正点"];//没什么好办法判断正点晚点
        list.push([rn, sf, zd, kd, jpk, zt]);
    }
    return list;
}

function getS(entity) {
    let st;
    for (let [key, value] of MCD.DATA_CACHE.platformIdToStation) {
        if (key == entity.platformId) {
            st  = value;
            break;
        }
    }
    return st;
}