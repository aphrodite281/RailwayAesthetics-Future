importPackage (java.awt);
include(Resources.id("mtrsteamloco:library/code/scrolls_screen.js"));
include(Resources.id("mtrsteamloco:library/code/board.js"));
include(Resources.id("mtrsteamloco:library/code/face.js"));

const rms1 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/movea.obj"), null);
const mcs = uploadPartedModels(rms1);
const mcm = mcs["m"];
const mcd = [mcs["d1"],mcs["d2"]];
const rmsc = rms1.get("sc");
rmsc.sourceLocation = null;
rmsc.setAllRenderType("light");
const mcsc = mcs["sc"];

const rms2 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/lineb.obj"), null);
const mcs2 = uploadPartedModels(rms2);
const mcr = mcs2["lr"];
const mcy = mcs2["ly"];

const interval = 0.28;
const minInt = 0.08;
const lineNum = 5;
const vMax = 1;
const timeInt = 1;

const fSize = [700,1100];
const frc = Resources.getFontRenderContext();
const font0 = Resources.readFont(Resources.id("mtrsteamloco:library/font/hkh_sxt.ttf")).deriveFont(Font.PLAIN, 350)//Resources.getSystemFont("Noto Sans").deriveFont(Font.PLAIN, 70);

const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

function create(ctx, state, entity) {
    state.v = entity.doorValue;
    fu(entity);
    state.time = 0;

    info = {
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: [700,1100],
        /*model: {
            vertices: [
                [-0.35, 1.35, 0.13],
                [-0.35, 0.25, 0.13],
                [0.35, 0.25, 0.13],
                [0.35, 1.35, 0.13],
            ],
            uvPoints: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
            ],
            renderType: "light"
        }*/
        model: rmsc
    }
    let face = new Face(info);

    let min = entity.schedules.get(entity.platformId)[0];
    for (let sche of entity.schedules.get(entity.platformId)) {
        if (sche.arrivalDiffMillis < min.arrivalDiffMillis) {
            min = sche;
        }
    }
    state.names = getNames(min.routeId);

    let tex = texture(entity);
    face.texture = tex;
    face.path = tex.identifier;

    state.f = face;
}

function texture(entity) {
    let min = entity.schedules.get(entity.platformId)[0];
    for (let sche of entity.schedules.get(entity.platformId)) {
        if (sche.arrivalDiffMillis < min.arrivalDiffMillis) {
            min = sche;
        }
    }
    let names = getNames(min.routeId);
    let rn = names[2], sn = TextUtil.getCjkParts(names[0]), en = TextUtil.getCjkParts(names[1]);

    let tex = new GraphicsTexture(700, 1100);
    let g = tex.graphics;
    g.setColor(new Color(0x3936ff));
    g.fillRect(0, 0, 700, 1100);
    font1 = font0.deriveFont(Font.PLAIN, 140);
    g.setFont(font1);
    g.setColor(new Color(0xffffff));
    g.drawString(rn, 700/2 - getSize(rn, font1)[0]/2, 180);

    font2 = font0.deriveFont(Font.PLAIN, 110);
    g.setFont(font2);
    g.drawString(sn, 700/2 - getSize(sn, font2)[0]/2, 420);
    g.drawString(en, 700/2 - getSize(en, font2)[0]/2, 630);

    font3 = font0.deriveFont(Font.BOLD, 80);
    g.setFont(font3);
    g.setColor(new Color(0xfffa6e));
    let str = "< 往 >";
    g.drawString(str, 700/2 - getSize(str, font3)[0]/2, 510);

    font4 = font0.deriveFont(Font.PLAIN, 60);
    g.setFont(font4);
    g.setColor(new Color(0xffffff));
    str = "人人爱护铁路";
    g.drawString(str, 700/2 - getSize(str, font4)[0]/2, 900);

    str = "天天守望平安";
    g.drawString(str, 700/2 - getSize(str, font4)[0]/2, 1000);

    tex.upload();
    return tex;
}

function render(ctx, state, entity) {


    let min = entity.schedules.get(entity.platformId)[0];
    for (let sche of entity.schedules.get(entity.platformId)) {
        if (sche.arrivalDiffMillis < min.arrivalDiffMillis) {
            min = sche;
        }
    }
    let names = getNames(min.routeId);
    ctx.setDebugInfo("rid", min.routeId);
    ctx.setDebugInfo("rt", names[2])
    if (names[0] != state.names[0] || names[1] != state.names[1] || names[2] != state.names[2]) {
        state.f.texture.close();
        state.f.texture = texture(entity);
        state.f.path = state.f.texture.identifier;
        state.names = names;
        ctx.setDebugInfo("ch", names[2])
    }

    sches = entity.schedules.get(entity.platformId);
    rtid = sches[0].routeId;
    let rn;
    for (let rot of MCD.ROUTES) {
        if (rot.id == rtid) {
            rn = rot.name;
        }
    }

    //ctx.setDebugInfo("tex",scs.texture)

    let target = entity.doorTarget;
    state.v += (target? 1: -1) * Timing.delta() * 0.25;

    if (state.v > vMax) state.v = vMax;
    if (state.v < 0) state.v = 0;

    if (state.v != 0 && state.v != vMax) {
        if (Timing.elapsed() > state.time + timeInt) {
            let k = new TickableSound(target? Resources.id("mtrsteamloco:psda.open") : Resources.id("mtrsteamloco:psda.close"));
            k.setData(1, 1, entity.getWorldPosVector3f());
            SoundHelper.play(k);
            state.time = Timing.elapsed();
        }
    }

    let v = state.v;
    let mat = new Matrices();
    mat.translate(0, v, 0);
    mat.translate(0, interval, 0);
    for(let i = 0; i < lineNum; i++) {
        mat.pushPose();
        let vy = i * interval;
        let vd = v + i * minInt;
        mat.translate(0, Math.max(vd, vy), 0);
        ctx.drawModel((i == 0 || i == lineNum - 1)? mcr : mcy, mat);
        mat.rotateY(Math.PI);
        ctx.drawModel((i == 0 || i == lineNum - 1)? mcr : mcy, mat);
        mat.popPose();
    }

    ctx.drawModel(mcd[0], null);
    ctx.drawModel(mcd[1], null);
    mat = new Matrices();
    mat.translate(0, v * 1.1, 0);
    ctx.drawModel(mcm, mat);

    entity.sendUpdateC2S();
    state.f.tick();
}

function alterAllRGBA (modelCluster, red ,green , blue, alpha) {
    let vertarray = modelCluster.uploadedTranslucentParts.meshList;
    let vert = vertarray[0];
    for(let i = 0; i < vertarray.length; i++) {
        vert = vertarray[i];
        vert.materialProp.attrState.setColor(red , green , blue , alpha);
    }
    vertarray = modelCluster.uploadedOpaqueParts.meshList;
    vert = vertarray[0];
    for(let i = 0; i < vertarray.length; i++) {
        vert = vertarray[i];
        vert.materialProp.attrState.setColor(red , green , blue , alpha);
    }
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

function strBI(str, font, color) {
    let size = getSize(str, font);
    let gt = new GraphicsTexture(size[0], size[1]);
    let g = gt.graphics;
    g.setColor(new Color(color));
    g.setFont(font);
    g.drawString(str, 0, size[1]);
    return [gt.bufferedImage, size[0], size[1], gt];
} 

function getSize(str, font) {
    let frc = Resources.getFontRenderContext();
    bounds = font.getStringBounds(str, frc);
    return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
}

function fu(entity) {
    entity.minPosX = 0;
    entity.minPosY = 0;
    entity.minPosZ = 0;
    entity.maxPosX = 16;
    entity.maxPosY = 48;
    entity.maxPosZ = 16;
    entity.sendUpdateC2S();
}

function no(entity) {
    entity.minPosX = 0;
    entity.minPosY = 0;
    entity.minPosZ = 0;
    entity.maxPosX = 0;
    entity.maxPosY = 0;
    entity.maxPosZ = 0;
    entity.sendUpdateC2S();
}

function getNames(rtid) {
    for (let rot of MCD.ROUTES) {
        if (rot.id == rtid) {
            let ns = [];
            pids = rot.platformIds;
            for (let i = 0; i < 2; i++) {
                p = pids[i == 0 ? 0 : pids.size() - 1];
                pid = p.platformId;
                let st;
                for (let [key, value] of MCD.DATA_CACHE.platformIdToStation) {
                    if (key == pid) {
                        st = value;
                        break;
                    }
                }
                if (st != null) {
                    n = st.name;
                }
                ns[i] = n;
            }
            ns[2] = rot.name;
            return ns;
        }
    }
}

function getKTime(entity, int) {
    let schedules = entity.schedules.get(entity.platformId);
    if (schedules[0] != null) {

    }
}