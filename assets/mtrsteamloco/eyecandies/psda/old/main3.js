importPackage (java.awt);
include(Resources.id("aphrodite:library/code/model/scrolls_screen.js"));
include(Resources.id("aphrodite:library/code/model/board.js"));
include(Resources.id("aphrodite:library/code/model/face.js"));

const rms1 = ModelManager.loadPartedRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/psda/movea.obj"), null);
const mcs = uploadPartedModels(rms1);
const mcm = mcs["m"];
const mcd = [mcs["d1"],mcs["d2"]];
const rmsc = rms1.get("sc");
rmsc.sourceLocation = null;
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
const font0 = Resources.readFont(Resources.id("aphrodite:library/font/hkh_sxt.ttf")).deriveFont(Font.PLAIN, 350)//Resources.getSystemFont("Noto Sans").deriveFont(Font.PLAIN, 70);

const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

function create(ctx, state, entity) {
    state.v = entity.doorValue;
    fu(entity);
    state.time = 0;

    let str;
    try {
        str = MCU.getStationAt(entity.getWorldPosVector3f()).name;
    }catch(e) {
        str = "No Station";
    }
    let size = getSize(str, font0);

    let run;
    if (size[0] > 1400) {
        size[0] = size[0] + 1000;
        run = true;
    }else { 
        size[0] = 1400;
        run = false;
    }
    size[1] = 400;//0.2 //140 0.7 
    let h = size[1]/2000;
    let info = {
        ctx: ctx,
        uvSpeed: [600, 0],
        model: {
            vertices: [
                [-0.35, 1.35, 0.13 + 0.001],
                [-0.35, 1.35-h, 0.13 + 0.001],
                [0.35, 1.35-h, 0.13 + 0.001],
                [0.35, 1.35, 0.13 + 0.001],
            ],
            uvPoints: [
                [0, 0],
                [0, 1],
                [1400 / size[0], 1],
                [1400 / size[0], 0],
            ],
            renderType: "light"
        },
        texture: size,
        matrices: [new Matrices()],
        running: run,
        isTrain: false
    }
    scs = new ScrollsScreen(info);
    let g = scs.texture.graphics;
    g.setColor(new Color(0x9caaff));
    g.fillRect(0, 0, size[0], size[1]);
    g.setFont(font0);
    g.setColor(new Color(0xffffff));
    g.drawString(str, size[0]/2-getSize(str, font0)[0]/2, 350);
    scs.texture.upload();

    //ctx.setDebugInfo(1,scs.texture)
    //ctx.setDebugInfo("size", size[0] + "x" + size[1])

    info = {
        ctx: ctx,
        isTrain: false,
        matrices: [new Matrices()],
        texture: [1400,1800],
        model: {
            vertices: [
                [-0.35, 1.35 - h, 0.13],
                [-0.35, 0.25, 0.13],
                [0.35, 0.25, 0.13],
                [0.35, 1.35 - h, 0.13],
            ],
            uvPoints: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
            ],
            renderType: "light"
        }
    }
    let face = new Face(info);
    g = face.texture.graphics;
    g.setColor(new Color(0x6a7cde));
    g.fillRect(0, 0, 1400, 1800);
    g.setFont(font0.deriveFont(Font.PLAIN, 200));
    sche = entity.schedules.get(entity.platformId);
    rtid = sche.routeId;
    sches = entity.schedules.get(entity.platformId);
    rtid = sches[0].routeId;
    let rn;
    for (let rot of MCD.ROUTES) {
        if (rot.id == rtid) {
            rn = rot.name;
        }
    }
    g.setColor(new Color(0xffffff));
    g.drawString(rn + "阿弥诺斯", 20, 180);
    face.texture.upload();

    state.b = new Board({matrices: [new Matrices]});
    state.b.addBoard("p1").addLayer().addItem(face).addItem(scs);
    entity.sendUpdateC2S();
}

function render(ctx, state, entity) {
    entity.sendUpdateC2S();
    state.b.tick();

    sches = entity.schedules.get(entity.platformId);
    rtid = sches[0].routeId;
    let rn;
    for (let rot of MCD.ROUTES) {
        if (rot.id == rtid) {
            rn = rot.name;
        }
    }

    ctx.setDebugInfo("sch",entity.schedules);
    ctx.setDebugInfo("id", entity.platformId);
    ctx.setDebugInfo("rn", rn)

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
            ctx.setDebugInfo("p",1)
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