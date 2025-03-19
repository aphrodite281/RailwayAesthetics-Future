importPackage(java.awt);
importPackage(java.util.concurrent);
importPackage(java.awt.image);
importPackage(java.awt.geom);
importPackage(java.awt.font);
importPackage(java.lang);

include(Resources.id("aphrodite:library/code/util/text_u.js"));
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/graphic/text_manager.js"));
include(Resources.id("aphrodite:library/code/util/tostring.js"));

// TextManager.processString = (str, font, w, getW) => str;

const backgroundColorKey = "background_color";
const textColorKey = "text_color";
const stopCheckingColorKey = "stop_checking_color";
const checkingColorKey = "checking_color";
const waitingColorKey = "waiting_color";
const runKey = "run";
const sloganKey = "slogan";
const modeKey = "mode";
const limitsKey = "limits";
const scaleKey = "scale";
const fontKey = "pida_font";
const defaultFont = "Serif";

let newColorRes = (key, value) => new ConfigResponder.TextField(key, ComponentUtil.translatable("name.raf." + key), value).setErrorSupplier(ErrorSupplier.Color);

const res0 = newColorRes(backgroundColorKey, "0x3936ff");
const res1 = newColorRes(textColorKey, "0xffffff");
const res2 = newColorRes(stopCheckingColorKey, "0xff0000");
const res3 = newColorRes(checkingColorKey, "0x00ff00");
const res4 = newColorRes(waitingColorKey, "0xffffff");
const res5 = new ConfigResponder.TextField(runKey, ComponentUtil.translatable("name.raf.run"), "true").setErrorSupplier(ErrorSupplier.only(["true", "false"]));
const res6 = new ConfigResponder.TextField(sloganKey, ComponentUtil.translatable("name.raf.slogan"), "开车前5分钟停止检票");
const res7 = new ConfigResponder.TextField(modeKey, ComponentUtil.translatable("name.raf.mode"), "0").setErrorSupplier(ErrorSupplier.only(["0", "1"])).setTooltipSupplier(str => java.util.Optional.of(asJavaArray([ComponentUtil.translatable("tip.raf.pida.mode")], Component)));
const res8 = new ConfigResponder.TextField(limitsKey, ComponentUtil.translatable("name.raf.limit"), "5/15").setErrorSupplier(str => {
    let arr = str.split("/");
    if (arr.length != 2) {
        return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
    }
    let num1 = parseFloat(arr[0]);
    let num2 = parseFloat(arr[1]);
    if (isNaN(num1) || isNaN(num2) || num1 < 0 || num2 < 0) {
        return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
    }
    return java.util.Optional.empty();
});
const res9 = new ConfigResponder.TextField(fontKey, ComponentUtil.translatable("name.raf.pida_font"), defaultFont, str => str, ErrorSupplier.Font, str => {}, str => java.util.Optional.of(asJavaArray([ComponentUtil.translatable("tip.raf.font"), ComponentUtil.translatable("tip.aph.reload_resourcepack")], Component)), false);
ClientConfig.register(res9);
const res10 = new ConfigResponder.TextField(scaleKey, ComponentUtil.translatable("name.raf.scale"), "1.0").setErrorSupplier(ErrorSupplier.Float);

const nowFont = ClientConfig.get(fontKey) + "";
let fontz;
if (nowFont.endsWith(".ttf") || nowFont.endsWith(".otf")) {
    fontz = Resources.readFont(Resources.id(nowFont));
} else {
    fontz = Resources.getSystemFont(nowFont);
}

const font0 = fontz;

const rawModels = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/pida/main.obj"), null);
const screenRaw = rawModels.get("screen");
screenRaw.setAllRenderType("light");
const screenModel = ModelManager.uploadVertArrays(screenRaw);
const dModel = ModelManager.uploadVertArrays(rawModels.get("d"));

const get = (entity, key) => entity.getCustomConfig(key);
const getColor = (entity, key) => new Color(Number(get(entity, key)));

const dateFormatter = new java.text.SimpleDateFormat("HH:mm");

const screenSize = [1460, 660];

const screenKey = "screen";
const dKey = "d";

function create(ctx, state, entity) {
    print (ctx.hashCode() + " create");
    let screen = screenModel.copyForMaterialChanges();
    let d = dModel.copyForMaterialChanges();
    let tex = new GraphicsTexture(screenSize[0], screenSize[1]);
    let g = tex.graphics;
    g.setColor(Color.BLACK);
    g.fillRect(0, 0, 1460, 660);
    tex.upload();
    ctx.setDebugInfo("tex", tex);
    screen.replaceAllTexture(tex.identifier);
    function getCall(model) {
        return new DrawCall({commit: (d, b, w, l) => {
            let mat = b.copy();
            let num = get(entity, scaleKey);
            num = parseFloat(num);
            mat.translate(0, 0.5, 0);
            mat.scale(num, num, num);
            d.enqueue(model, mat, l);
        }});
    }
    ctx.drawCalls.put(screenKey, getCall(screen));
    ctx.drawCalls.put(dKey, getCall(d));

    let drawCalls = [];
    if (get(entity, runKey) + "" == "true") {
        drawCalls.push(new DR(entity, true));
    } else {
        drawCalls.push(new BLACK(entity, true));
    }
    state.running = true;
    let st = lt => {
        let num = 1000 / 20 - (Date.now() - lt);
        return Math.max(0, num);
    }
    state.t1 = new Thread(() => {
        let last = Date.now();
        while (state.running) {
            try {
                let start = Date.now();

                let img = new BufferedImage(screenSize[0], screenSize[1], BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                // let g = tex.graphics
                setComp(g, 1);
                g.setColor(Color.BLACK);
                g.fillRect(0, 0, screenSize[0], screenSize[1]);

                let calls = drawCalls;

                for (let i = 0; i < calls.length; i++) {
                    calls[i].draw(g);
                }
                
                tex.upload(img);
                g.dispose();
                ctx.setDebugInfo("draw", Date.now() - start, "ins", Date.now() - last);
                let ll = last;
                last = Date.now();
                Thread.sleep(st(ll));
            } catch (e) {
                ctx.setDebugInfo("error1", e.toString(), e.stack);
            }
        }
        print ("1456")

        Thread.sleep(60000);

        tex.close();
        // ctx.drawCalls.remove(screenKey);
        // ctx.drawCalls.remove(dKey);
        print("done-draw");
    }, ctx.hashCode() + "draw");
    state.t2 = new Thread(() => {
        let last = Date.now();
        while (state.running) {
            try {
                let start = Date.now();
                let run = get(entity, runKey) + "";
                let le = drawCalls[drawCalls.length - 1];
                if (run == "true") {
                    if (le.TYPE == "BLACK") {
                        drawCalls.push(new DR(entity, false));
                    } else {
                        let result =le.outdated();
                        if (result != null) {
                            drawCalls.push(new DR(entity, false, result));
                        }
                    }
                } else {
                    if (le.TYPE != "BLACK") {
                        drawCalls.push(new BLACK(entity, false));
                    }
                }
                if (drawCalls.length > 1 && drawCalls[drawCalls.length - 1].isGrown()) {
                    let newDrawCalls = [drawCalls[drawCalls.length - 1]];
                    drawCalls = newDrawCalls;
                }
                ctx.setDebugInfo("update", Date.now() - start, "ins", Date.now() - last);
                ctx.setDebugInfo("drawcalls", drawCalls.toString());
                let ll = last;
                last = Date.now();
                Thread.sleep(st(ll));
            } catch (e) {
                ctx.setDebugInfo("error2", e.toString(), e.stack);
            }
        }
        print("done-update");
    }, ctx.hashCode() + "update");
    state.t1.start();
    state.t2.start();
    state.tex = tex;
}

let tn = 0;
let fn = 0;

function render(ctx, state, entity) {
    let ress = [res0, res1, res2, res3, res4, res5, res6, res7, res8, res10];
    for (let res of ress) {
        entity.registerCustomConfig(res);
    }

}

function dispose(ctx, state, entity) {
    state.running = false;
    print(ctx.hashCode() + " dispose");
}

const setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};

function BLACK(entity, isFirst) {
    const start = Date.now();
    const smooth = (k, value) => {// 平滑变化
        if (value > k) return k;
        if (k < 0) return 0;
        return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
    }
    const getAlpha = () => {
        if (isFirst) return 1;
        else return smooth(1, (Date.now() - start) / 1000 * 0.8);
    }

    this.draw = g => {
        setComp(g, getAlpha());
        g.setColor(Color.BLACK);
        g.fillRect(0, 0, screenSize[0], screenSize[1]);
    }

    this.outdated = () => null;
    this.isGrown = () => getAlpha() >= 1;
    this.TYPE = "BLACK";
    this.toString = () => "BLACK" + getAlpha();
}

function DR(entity, isFirst, info) {
    if (info == undefined) info = getInfo(entity)
    const list = info.list;
    const bc = info.bc;
    const tc = info.tc;
    const slogan = info.slogan;

    const textManager = new TextManager.Buffered();
    const drawMiddle = textManager.drawMiddle;

    const w = screenSize[0], h = screenSize[1];
    const w0 = w / 6, h0 = h / 20;
    let y = h0 / 2;
    for (let i = 0; i < list.length && i < 19; i++) {
        let x = w0 / 2;
        for (let j = 0; j < 6; j++) {
            drawMiddle(list[i][1][j], font0, Font.PLAIN, list[i][0], x, y, w0, h0, 0);
            x += w0;
        }
        y += h0; 
    }
    drawMiddle(slogan, font0, Font.PLAIN, tc, w / 2, h - h0 / 2, w, h0, 0);

    let start = Date.now();
    const smooth = (k, value) => {// 平滑变化
        if (value > k) return k;
        if (k < 0) return 0;
        return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
    }
    let getAlpha = () => {
        if (isFirst) return 1;
        else return smooth(1, (Date.now() - start) / 1000 * 0.8);
    }

    this.draw = g0 => {
        let img = new BufferedImage(screenSize[0], screenSize[1], BufferedImage.TYPE_INT_ARGB);
        let g = img.createGraphics();
        g.setColor(bc);
        g.fillRect(0, 0, w, h);
        g.setColor(tc);
        g.setStroke(new BasicStroke(3));
        for (let i = 0; i <= 6; i++) g.drawLine(w0 * i, 0, w0 * i, h - h0);
        for (let i = 0; i < 20; i++) g.drawLine(0, h0 * i, w, h0 * i);
        textManager.draw(g);
        g.dispose();
        setComp(g0, getAlpha());
        g0.drawImage(img, 0, 0, null);
    }

    this.outdated = () => {
        let newInfo = getInfo(entity);
        if (toString(info) != toString(newInfo)) return newInfo;
        else return null;
    }

    this.isGrown = () => getAlpha() >= 1;
    this.TYPE = "DR";
    this.toString = () => "DR" + getAlpha();
}

function isChinese() {
    return (Date.now() / 1000 % 20) < 10;
}

function getInfo(entity) {
    let station = MinecraftClient.getStationAt(entity.getWorldPosVector3f());
    if (station == null) {
        station = new Packages.mtr.data.Station();
    }
    const bc = getColor(entity, backgroundColorKey);
    const tc = getColor(entity, textColorKey);
    const scc = getColor(entity, stopCheckingColorKey);
    const cc = getColor(entity, checkingColorKey);
    const wc = getColor(entity, waitingColorKey);
    const run = get(entity, runKey);
    const slogan = get(entity, sloganKey);
    const mode = parseInt(get(entity, modeKey));
    const _isChinese = isChinese();
    const limits = [];
    let limitsStr = get(entity, limitsKey);
    let arr = limitsStr.split("/");
    if (arr.length != 2) {
        throw new Error("Invalid limits value: " + limitsStr);
    }
    limits[0] = parseFloat(arr[0]);
    limits[1] = parseFloat(arr[1]);

    const data = MTRClientData
    const cache = data.DATA_CACHE;
    const ud = "undefined";
    const staId = station.id;

    const plaIds = [];
    for (let [plaId, sta] of cache.platformIdToStation) {
        if (staId == sta.id) {
            plaIds.push(plaId);
        }
    }

    const plas = [];
    for (let plaId of plaIds) {
        for (let pla of data.PLATFORMS) {
            if (pla.id == plaId) {
                plas.push(pla);
                break;
            }
        }
    }

    let swp = [];//schesWithPlas
    for (let pla of plas) {
        let res = data.SCHEDULES_FOR_PLATFORM.get(java.lang.Long.valueOf(pla.id));
        if (res == null) continue;
        for (let sche of res) {
            swp.push([sche, pla]);
        }
    }
    swp.sort((a, b) => a[0].arrivalMillis - b[0].arrivalMillis);

    const list = [];
    if (_isChinese) list.push([tc, ["车次", "始发站", "终到站", "开点", mode ? "检票口" : "站台", "状态"]]);
    else list.push([tc, ["Train", "From", "To", "Departure", mode ? "Check-in" : "Platform", "Status"]]);

    const getName = _isChinese? (str => TextU.CP(str)) : (str => TextU.NP(str));
    function getTime(millis) {
        let date = new java.util.Date(Date.now() + millis);
        return dateFormatter.format(date);
    }

    for (let [sche, pla] of swp) {
        if (list.length >= 19) break;
        let rn = ud, sf = ud, zd = ud, kd = ud, jpk = ud, zt = ud, color = tc;//车次 始发站 终到站 开点 检票口 状态 颜色
        for (let rot of data.ROUTES) {
            if (rot.id == sche.routeId) {
                let pids = rot.platformIds;
                let get = (index) => {
                    let p = pids[index];
                    let pid = p.platformId;
                    let st = new Packages.mtr.data.Station();
                    for (let [key, value] of cache.platformIdToStation) {
                        if (key == pid) {
                            st = value;
                            break;
                        }
                    }
                    return getName(st.name);
                }
                rn = getName(rot.name);
                sf = get(0);
                zd = get(pids.size() - 1);
                break;
            }
        }
        kd = getTime(sche.arrivalMillis);
        let num = parseInt(pla.name);
        if (mode) {
            if (!isNaN(num)) {
                if (num % 2 == 0) {
                    jpk = sche.trainCars > 8 ? ((num - 1) + "A·" + (num - 1) + "B·" + num + "A·" + num + "B") : ((num - 1 ) + "A·" + num + "B");
                }else {
                    jpk = sche.trainCars > 8 ? (num + "A·" + num + "B·" + (num + 1) + "A·" + (num + 1) + "B") : (num + "A·" + (num + 1) + "B");
                }
            }else {
                jpk = pla.name;
            }
        }else {
            jpk = pla.name;
        }
        let time = sche.arrivalMillis - Date.now() + pla.dwellTime / 2 * 1000;
        let minus = time / 60 / 1000
        if (minus <= limits[0]) {
            zt = getName("停止检票|Stop Checking");
            color = scc;
        } else if (minus > limits[0] && minus <= limits[1]) {
            zt = getName("正在检票|Checking");
            color = cc;
        } else if (minus > limits[1]) {
            zt = getName("正在候车|Waiting");
            color = wc;
        }
        list.push([color, [rn, sf, zd, kd, jpk, zt]]);
    }
    return {list: list, run: run, slogan: slogan, bc: bc, tc: tc};
}