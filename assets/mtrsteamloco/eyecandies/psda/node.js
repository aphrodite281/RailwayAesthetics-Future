importPackage (java.awt);

include(Resources.idr("common.js"));
include(Resources.id("aphrodite:library/code/graphic/text_manager.js"));
include(Resources.id("aphrodite:library/code/util/tostring.js"));
include(Resources.id("aphrodite:library/code/gui/orderly_responder.js"));
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));
include(Resources.id("aphrodite:library/code/util/text_u.js"));

var mcd = [], mcsc, mcm;

{
    function uploadPartedModels(rawModels) {
        let result = {};
        for (it = rawModels.entrySet().iterator(); it.hasNext(); ) {
          entry = it.next();
          entry.getValue().applyUVMirror(false, true);
          result[entry.getKey()] = ModelManager.uploadVertArrays(entry.getValue());
        }
        return result;
    }

    const rms1 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.idr("movea.obj"), null);
    const mcs = uploadPartedModels(rms1);
    mcd = [mcs["d1"],mcs["d2"]];
    mcm = mcs["m"];
    const rmsc = rms1.get("sc");
    rmsc.sourceLocation = null;
    rmsc.setAllRenderType("light");
    mcsc = ModelManager.uploadVertArrays(rmsc);


}

const fontb = Resources.readFont(Resources.id("aphrodite:library/font/hkh_sxt.ttf")).deriveFont(Font.PLAIN, 350);
const timeInt = 1000;

const keySloganA1 = "slogan_a1";
const keySloganA2 = "slogan_a2";
const keySloganB1 = "slogan_b1";
const keySloganB2 = "slogan_b2";
const keySlogan0 = "slogan0";
const keyFrequency = "frequency";
const keyBackgroundColor = "background_color";
const keyTextColor = "text_color";
const keyMidColor = "mid_color";
const keyPlatformDistance = "platform_distance";

const responder = (function() {
    function gen(key, dv) {
        return new ConfigResponder.TextField(key, ComponentUtil.translatable("name.raf." + key), dv);
    }
    let s0 = gen(keySlogan0, "1车 ← 2车 → 3车");
    let a1 = gen(keySloganA1, "人人爱护铁路");
    let a2 = gen(keySloganA2, "天天守望平安");
    let b1 = gen(keySloganB1, "爱护铁路光荣");
    let b2 = gen(keySloganB2, "破坏铁路犯罪");
    let freq = gen(keyFrequency, "10").setErrorSupplier(ErrorSupplier.numberRange(0, null, true, false));
    let bgc = gen(keyBackgroundColor, "0x3936ff").setErrorSupplier(ErrorSupplier.Color);
    let txc = gen(keyTextColor, "0xffffff").setErrorSupplier(ErrorSupplier.Color);
    let mdc = gen(keyMidColor, "0xffff00").setErrorSupplier(ErrorSupplier.Color);
    let pd = gen(keyPlatformDistance, "3").setErrorSupplier(ErrorSupplier.numberRange(0, null, true, false));
    return orderlyResponder("ARAF", "made by Aphrodite281", [s0, a1, a2, b1, b2, freq, bgc, txc, mdc, pd]);
})();

function genHalfLineModels(left, right) {
    const rms = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/lineb.obj"), null);
    let rmr = rms.get("lr");
    rmr.sourceLocation = null;
    let rmy = rms.get("ly");
    rmy.sourceLocation = null;
    rmr = rmr.copy();
    rmy = rmy.copy();
    let frmr = new RawModel();
    let frmy = new RawModel();
    if (right) {
        frmr.append(rmr);
        frmy.append(rmy);
    }
    if (left) {
        rmr = rmr.copy();
        rmy = rmy.copy();
        rmr.applyRotation(Vector3f.YP, 180);
        rmy.applyRotation(Vector3f.YP, 180);
        frmr.append(rmr);
        frmy.append(rmy);
    }
    mcr = ModelManager.uploadVertArrays(frmr);
    alterAllRGBA(mcr, 255, 0, 0, 255);
    mcy = ModelManager.uploadVertArrays(frmy);
    alterAllRGBA(mcy, 255, 255, 0, 255);
}

genHalfLineModels(CONFIG_INFO.flag[0], CONFIG_INFO.flag[1]);

const texSize = [700/2,1100/2];

function create(ctx, state, entity) {
    entity.registerCustomConfig(responder);
    entity.sendUpdateC2S();

    ctx.drawCalls.put(0, new ClusterDrawCall(mcd[0], new Matrix4f()));
    ctx.drawCalls.put(1, new ClusterDrawCall(mcd[1], new Matrix4f()));
    let imcsc = mcsc.copyForMaterialChanges();
    ctx.drawCalls.put(2, new ClusterDrawCall(imcsc, new Matrix4f()));
    state.running = true;
    state.lastRenderTime = Date.now();
    
    let gt = new GraphicsTexture(texSize[0], texSize[1]);
    state.gt = gt;
    imcsc.replaceAllTexture(gt.identifier);
    let array = [];

    state.draw = function() {
        if (array.length == 0) {
            array.push(new Element(genElementInfo(entity)));
        } else {
            let info = genElementInfo(entity);
            if (!array[array.length - 1].equals(info)) {
                array.push(new Element(info));
            }

            if (array[array.length - 1].alpha() >= 1 && array.length > 1) {
                let latest = array[array.length - 1];
                array = [latest];
            }
        }
        
        for (let e of array) e.draw(gt.graphics);
        gt.upload();
    }
    // state.thread = new java.lang.Thread(state.task, "PSDA Thread" + ctx.hashCode().toString(16));
    // state.thread.start();
    state.soundTime = -114514;
}

onRender = function(ctx, state, entity, v) {
    state.draw();
    state.lastRenderTime = Date.now();
    let mat = new Matrices();
    mat.translate(0, v, 0);
    ctx.drawModel(mcm, mat);

    if (entity.doorTarget != v) {
        if (Date.now() > state.soundTime + timeInt) {
            let k = new TickableSound(entity.doorTarget ? Resources.id("mtrsteamloco:psda.open") : Resources.id("mtrsteamloco:psda.close"));
            k.setData(1, 1, entity.getWorldPosVector3f());
            SoundHelper.play(k);
            state.soundTime = Date.now();
        }
    }
}

function dispose(ctx, state, entity) {
    state.running = false;
    state.gt.close();
}

function Element(info) {
    let [w, h] = texSize;
    let st = Date.now();

    let textManager = new TextManager.Buffered();

    let drawMiddle = textManager.drawMiddle;

    let p = Font.PLAIN;
    let w1 = w * 0.8, x = w / 2;
    drawMiddle(info.rn, fontb, p, info.txc, x, 50, w1, 70, 0);

    drawMiddle(info.slogan0, fontb, p, info.txc, x, 130, w1, 32, 0);

    let mid = 260, t = 60;
    drawMiddle(info.sn, fontb, p, info.txc, x, mid - t, w1, 55, 0, 2);
    drawMiddle("< 往 >", fontb, Font.BOLD, info.mdc, x, mid, w1, 40, 0, 2);
    drawMiddle(info.en, fontb, p, info.txc, x, mid + t, w1, 55, 0, 2);

    drawMiddle(info.dt + "到, " + info.ft + "开", fontb, p, info.txc, x, 390, w1, 32, 0, 2);

    drawMiddle(info.slogan1, fontb, p, info.txc, x, 450, w1, 30, 0, 2);
    drawMiddle(info.slogan2, fontb, p, info.txc, x, 490, w1, 30, 0, 2);

    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
    let g = img.createGraphics();
    g.setColor(new Color(Number(info.bgc)));
    g.fillRect(0, 0, w, h);
    textManager.draw(g, 0, 0, Date.now());
    g.dispose();

    this.alpha = function() {
        return Math.min(1, (Date.now() - st) / 1000 * 1.2);
    }
    
    this.draw = function(g0) {
        g0.setComposite(AlphaComposite.SrcOver.derive(this.alpha()));
        g0.drawImage(img, 0, 0, null);
    }

    this.equals = function(oinfo) {
        if (tostring(info) == tostring(oinfo)) return true;
        return false;
    }

    this.toString = function() {
        return "Element";
    }
}

function genElementInfo(entity) {
    let min = getMin(entity);
    let pla = MinecraftClient.getPlatformAt(entity.getWorldPosVector3f(), Number(entity.getCustomConfig(keyPlatformDistance)), 2, 2);
    
    let dt = "--:--", ft= "--:--", rn = "无线路", sn = "无线路", en = "无线路";

    if (pla != null && min != null) {
        let tt = pla.dwellTime;
        dt = handleTime(min.arrivalMillis);
        ft = handleTime(min.arrivalMillis + tt / 2 * 1000);
        names = getNames(min.routeId);
        rn = TextU.CP(names[2]), sn = TextU.CP(names[0]), en = TextU.CP(names[1]);
    }
    
    let sloganA1 = entity.getCustomConfig(keySloganA1);
    let sloganA2 = entity.getCustomConfig(keySloganA2);
    let sloganB1 = entity.getCustomConfig(keySloganB1);
    let sloganB2 = entity.getCustomConfig(keySloganB2);
    let slogan0 = entity.getCustomConfig(keySlogan0);
    let freq = Number(entity.getCustomConfig(keyFrequency));
    let bgc = entity.getCustomConfig(keyBackgroundColor);
    let txc = entity.getCustomConfig(keyTextColor);
    let mdc = entity.getCustomConfig(keyMidColor);

    let flag = Date.now() / 1000 % freq >= freq / 2;
    return {
        dt: dt,
        ft: ft,
        slogan0: slogan0,
        slogan1: flag ? sloganA1 : sloganB1,
        slogan2: flag ? sloganA2 : sloganB2,
        freq: freq,
        bgc: bgc,
        txc: txc,
        mdc: mdc,
        sn: sn,
        rn: rn,
        en: en
    }
}

function getNames(rtid) {
    for (let rot of MTRClientData.ROUTES) {
        if (rot.id == rtid) {
            let ns = ["0", "1", "2"];
            let pids = rot.platformIds;
            for (let i = 0; i < 2; i++) {
                let p = pids[i == 0 ? 0 : pids.size() - 1];
                let pid = p.platformId;
                let st;
                for (let [key, value] of MTRClientData.DATA_CACHE.platformIdToStation) {
                    if (key == pid) {
                        st = value;
                        break;
                    }
                }
                let n = "未知";
                if (st != null) {
                    n = st.name;
                }
                ns[i] = n;
            }
            ns[2] = rot.name;
            return ns;
        }
    }
    return ["无线路", "无线路", "无线路"];
}

function handleTime(time) {
    time = new Date(time);
    let m = time.getMinutes();
    let h = time.getHours();
    return h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0");
}

function getMin(entity) {
    let pla = MinecraftClient.getPlatformAt(entity.getWorldPosVector3f(), Number(entity.getCustomConfig(keyPlatformDistance)), 2, 2);
    if (pla == null) return {arrivalMillis: -1, routeId: -1, trainCars: -1, currentStationIndex: -1};
    let sches = [];
    for (let [key, value] of MTRClientData.SCHEDULES_FOR_PLATFORM) {
        if (key == pla.id) {
            for (let sche of value) {
                sches.push(sche);
            }
            break;
        }
    }
    if (sches.length == 0) return null;
    if (sches.length == 1) return sches[0];

    sches.sort((a, b) => {
        return a.arrivalMillis - b.arrivalMillis;
    });
    return sches[0];
}