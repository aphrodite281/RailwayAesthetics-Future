importPackage (java.awt);

include(Resources.id("aphrodite:library/code/util/text_u.js"));
include(Resources.id("aphrodite:library/code/util/tostring.js"));
include(Resources.id("aphrodite:library/code/graphic/text_manager.js"));

const keyBackgroundColor = "background_color";
const keyTextColor = "text_color";
const keyPlatformDistance = "platform_distance";
const keyScale = "scale";

const res1 = new ConfigResponder.TextField(keyBackgroundColor, ComponentUtil.translatable("name.raf.background_color"), "0xffffff");
const res2 = new ConfigResponder.TextField(keyTextColor, ComponentUtil.translatable("name.raf.text_color"), "0x000000");
const res3 = new ConfigResponder.TextField(keyPlatformDistance, ComponentUtil.translatable("name.raf.platform_distance"), "5");
const res4 = new ConfigResponder.TextField(keyScale, ComponentUtil.translatable("name.raf.scale"), "1");

const rms = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/stop_signc/main.obj"), null);
const ms = uploadPartedModels(rms);

const font = Resources.getSystemFont("Noto Serif");


function create(ctx, state, entity) {
    entity.registerCustomConfig(res1);
    entity.registerCustomConfig(res2);
    entity.registerCustomConfig(res3);
    entity.registerCustomConfig(res4);
    entity.sendUpdateC2S();
    state.dyn = new DynamicModelHolder();
    state.info = genInfo(entity);
    state.tex = genTexture(state.info);
    state.model = genModel(state.tex, state.info);
    ctx.drawCalls.put(0, new DrawCall({
        commit: function(drawScheduler, base, world, light) {
            let b = base.copy();
            b.scale(state.info.scale, state.info.scale, state.info.scale);
            drawScheduler.enqueue(state.model.d, b, light);
            drawScheduler.enqueue(state.model.f, b, light);
        }
    }));
}

function render(ctx, state, entity) {
    let info = genInfo(entity);
    if (toString(info) != toString(state.info)) {
        state.info = info;
        state.tex.close();
        state.tex = genTexture(info);
        state.model = genModel(state.tex, state.info);
    }
}

function dispose(ctx, state, entity) {
    state.tex.close();
    state.dyn.close();
}

function genInfo(entity) {
    let bgc = parseInt(entity.getCustomConfig(keyBackgroundColor));
    let txc = parseInt(entity.getCustomConfig(keyTextColor));
    let pd = parseInt(entity.getCustomConfig(keyPlatformDistance));
    let scale = parseFloat(entity.getCustomConfig(keyScale));
    let station = MinecraftClient.getStationAt(entity.getWorldPosVector3f());
    let staName = "无车站|No Station";
    let pla = null;
    if (station != null) {
        staName = station.name;
        pla = MinecraftClient.getPlatformAt(entity.getWorldPosVector3f(), pd, 4, 5);
    }
    let routes = [];
    if (pla != null) {
        for (let ro of MTRClientData.ROUTES) {
            if (ro.isHidden) continue;
            for (let i = 0; i < ro.platformIds.length; i++) {
                let rpf = ro.platformIds[i];
                if (rpf.platformId == pla.id) {
                    // cs.push(ro.color);
                    let ind = i + 1;
                    if (ind < ro.platformIds.length) {
                        let pid = ro.platformIds[ind].platformId;
                        let s = "未知|Unknown";
                        let st = MTRClientData.DATA_CACHE.platformIdToStation.get(java.lang.Long.valueOf(pid));
                        if (st != null) s = st.name;
                        routes.push({ name: s, color: ro.color });
                    } else {
                        routes.push({ name: null, color: ro.color });
                    }
                    break;
                }
            }
        }
    }
    if (routes.length == 0) routes.push({ name: "无线路|No Route", color: 0xbfffda });
    return {
        bgc: bgc,
        txc: txc,
        scale: scale,
        staName: staName,
        routes: routes
    }
}

function genTexture(info) {
    const w = 400, h = 320;
    let tex = new GraphicsTexture(w, h);
    let g = tex.graphics;
    
    let textManager = new TextManager.Buffered();
    let drawMiddle = textManager.drawMiddle;

    function drawSuit(cp, np, midx, midy, w, h) {
        drawMiddle(cp, font, Font.PLAIN, info.txc, midx, midy - h / 2 + h * 0.3, w, h * 0.6, 0, 2);
        drawMiddle(np, font, Font.PLAIN, info.txc, midx, midy + h / 2 - h * 0.2, w, h * 0.4, 0, 2);
    }

    g.setColor(new Color(info.bgc));
    g.fillRect(0, 0, w, h);

    let p = w / 40;
    let w1 = (w + p) / info.routes.length, h0 = h / 16, x = 0, y = h * 0.56;

    let names = [];
    for (let route of info.routes) {
        g.setColor(new Color(route.color));
        let path = new Path2D.Float();
        path.moveTo(x - p, y);
        path.lineTo(x + w1 - p, y);
        path.lineTo(x + w1, y + h0);
        path.lineTo(x, y + h0);
        path.closePath();
        g.fill(path);
        x += w1;

        if (route.name != null) {
            names.push(route.name);
        }
    }

    drawSuit(TextU.CP(info.staName), TextU.NP(info.staName), w / 2, h * 0.26, w * 0.8, h * 0.4);

    if (names.length > 0) {
        drawSuit("下一站", "Next  Station", w * 0.15, h * 0.8, w * 0.18, h * 0.2);
        let x = w * 0.65, w1 = w * 0.68, h1 = h * 0.35;
        let h2 = h1 / names.length;
        let y = h * 0.8 - h1 / 2 + h2 / 2;
        for (let i = 0; i < names.length; i++) {
            let name = names[i];
            drawSuit(TextU.CP(name), TextU.NP(name), x, y, w1, h2);
            y += h2;
        }
    } else drawSuit("终点站", "Terminus", w / 2, h * 0.8, w * 0.8, h * 0.3);

    textManager.draw(g);
    textManager.dispose();

    tex.upload();

    return tex;
}

function genModel(tex, info) {
    let d = ms["d"].copyForMaterialChanges();
    let f = ms["f"].copyForMaterialChanges();
    f.replaceAllTexture(tex.identifier);
    setColor(d, info.bgc);

    return {d: d, f: f};
}

function setColor(mc, c) {
    let color = c << 8 | 0xff;
    let vs = [mc.uploadedOpaqueParts, mc.uploadedTranslucentParts];
    for (let v of vs) {
        for (let vr of v.meshList) {
            let mat = vr.materialProp;
            mat.attrState.setColor(color >> 24 & 0xff, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff);
        }
    }
}

function uploadPartedModels(rawModels) {
    let result = {};
    for (it = rawModels.entrySet().iterator(); it.hasNext(); ) {
      entry = it.next();
      // entry.getValue().applyUVMirror(false, false);
      result[entry.getKey()] = ModelManager.uploadVertArrays(entry.getValue());
    }
    return result;
}