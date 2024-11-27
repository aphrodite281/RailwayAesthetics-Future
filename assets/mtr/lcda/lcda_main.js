/**
 * @author: Aphrodite281
 */

importPackage (java.lang);
importPackage (java.awt);
importPackage (java.awt.image);

include(Resources.id("aphrodite:library/code/face.js"));
include(Resources.id("aphrodite:library/code/text_u.js"));

const defaultScreenTextureSize = [1600 * 2, 400 * 2];
const defaultScreenModelSize = [1600 / 2000, 400 / 2000];

const textureSize = defaultScreenTextureSize;
const modelSize = defaultScreenModelSize;
const doorZPositions = [0, 5, -5, 10, -10];
const doorPosition = [1.3, 1.9];// x、y
const rotateX = 15 / 180 * Math.PI;// YX(Z)欧拉的X
const rightMatrices = getMatrices(false);
const leftMatrices = getMatrices(true);

const fontA = Resources.getSystemFont("Noto Sans");
const fontB = Resources.readFont(Resources.id("aphrodite:library/font/zhdh.ttf"));
const fontC = Resources.getSystemFont("Noto Serif");

const logo = Resources.readBufferedImage(Resources.idr("logo.png"));

function create(ctx, state, train) {
    state.running = true;
    state.lastTime = System.currentTimeMillis();
    let infoArray = [];
    let tickList = [];
    let disposeList = [];
    for (let i = 0; i < train.trainCars(); i++) {
        let info = {
            ctx: ctx,
            cars: [i],
            matrices: rightMatrices,
            texture: textureSize,
            model: {
                size: modelSize,
                renderType: "light",
                uvSize: [1, 1]
            }
        }
        let rightFace = new Face(info);
        info.matrices = leftMatrices;
        let leftFace = new Face(info);
    
        let rightThread = getThread(rightFace, true, ctx, state, train, i + 1);
        let leftThread = getThread(leftFace, false, ctx, state, train, i + 1);
        rightThread.start();
        leftThread.start();

        tickList.push(() => {rightFace.tick(); leftFace.tick();});
        disposeList.push(() => {rightFace.close(); leftFace.close();});
        infoArray.push([rightFace, leftFace, rightThread, leftThread]);
    }
    state.tickList = tickList;
    state.infoArray = infoArray;
    state.disposeList = disposeList;
}

// let model = ModelManager.uploadVertArrays(ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/main.obj"), null));

let acc = Date.now();

function render(ctx, state, train) {
    //ctx.drawCarModel(model, 0, null);
    state.lastTime = System.currentTimeMillis();
    for (let entry of state.tickList) {
        entry();
    }
    ctx.setDebugInfo("isOnRoute: ", train.isOnRoute());
    try {
        let plas = train.getThisRoutePlatforms();
        let station = plas[train.getThisRoutePlatformsNextIndex()].destinationStation;
        let dest = station.name;
    ctx.setDebugInfo("dest", dest);
    } catch (e) {
        ctx.setDebugInfo("dest", e);
    }
    acc += Timing.delta() * 1000 * 6;
    ctx.setDebugInfo("abc", train.mtrTrain().getIsOnRoute());
}

function dispose(ctx, state, train) {
    state.running = false;
    state.lastTime = -10000;
    for (let entry of state.disposeList) {
        entry();
    }
}

function getMatrices(isRight) {
    const result = [];
    let matrices = new Matrices();
    const k = isRight? -1 : 1;
    matrices.translate(- k * doorPosition[0], doorPosition[1], 0);
    const execute = (translateZ) => {
        matrices.translate(0, 0, translateZ);
        matrices.rotateY(k * Math.PI / 2);
        matrices.rotateX(rotateX);
    }
    for (let position of doorZPositions) {
        matrices.pushPose();
        execute(position);
        result.push(new Matrices(matrices.last()));
        matrices.popPose();
    }
    let matt = new Matrices();
    matt.translate(0, 1.7, 0);
    if (isRight) matt.rotateY(Math.PI);
    result.push(matt)
    return result;
}

const smooth = (k, value) => {// 平滑变化
    if (value > k) return k;
    if (k < 0) return 0;
    return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
}

function getThread(face, isRight, ctx, state, train, carIndex) {
    var font0 = fontA.deriveFont(Font.PLAIN, 45);
    var font1 = fontB.deriveFont(Font.PLAIN, 45);
    var font2 = fontC.deriveFont(Font.PLAIN, 45);
    var main = () => {
        try {
            print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Start");
            ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + " Start", System.currentTimeMillis().toString());
            
            const tex = face.texture;
            const w = tex.width, h = tex.height;
            const img0 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);// 渐变现状
            const g0 = img0.createGraphics();
            const img1 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);// 合并
            const g1 = img1.createGraphics();

            const drawCalls = [];// [旧图, [新渐变的, 新alpha]] 渐变绘制
            let dynLambda = (g) => {};// 动态绘制函数
            let ctrlLambda = () => false;// 控制是否upload
            let mainAlpha = 0;// 主渐变alpha
            let newAlpha = 0;// 新渐变alpha
            let needUpload = false;// 是否需要上传
            let lastFrameTime = 0;// 上一帧时间
            let startTime = 0;// 开始时间
            let info = [-1];// 信息
            let doorValue = 0;// 本侧门值
            let doorOpen = false;// 本侧门开关
            // const fps = 24;// 帧率
            // const frameTime = 1000 / fps;// 帧时间
            const now = () => Date.now();
            const getInfo = () => {
                let color = 0x00ffff, color1 = 0xffffff, cname = "无线路", ename = "No Route", cdest = "无线路", edest = "No Route", time0 , time1, is = true, t1 = "非运营列车  Non-operating train", t2 = "", t3 = "", t4 = "", isArrive = false, open = -1;
                let date = new Date(acc);
                let year = date.getFullYear();
                let month = (date.getMonth() + 1).toString().padStart(2, '0');
                let day = date.getDate().toString().padStart(2, '0');
                let hour = date.getHours().toString().padStart(2, '0');
                let minute = date.getMinutes().toString().padStart(2, '0');
                time0 = year + "-" + month + "-" + day;
                time1 = hour + ":" + minute;
                const getColor = (color) => {
                    let r = color >> 16 & 0xff;
                    let g = color >> 8 & 0xff;
                    let b = color & 0xff;
                    let luminance  = 0.299 * r + 0.587 * g + 0.114 * b;
                    return luminance > 255 / 2 ? 0 : 0xffffff;
                }
                try {
                    let plas = train.getThisRoutePlatforms();
                    let pla = plas[train.getThisRoutePlatformsNextIndex()];
                    let station = pla.destinationStation;
                    const ss = () => {
                        if (station == null) station = {name: "无车站|No Station"};
                    }
                    ss();
                    let dest = pla.destinationName;
                    let route = pla.route;
                    color = route.color;
                    let name = route.name;
                    cname = TU.CP(name);
                    ename = TU.NP(name);
                    cdest = TU.CP(dest);
                    edest = TU.NP(dest);
                    station = pla.station;
                    ss();
                    let pro = train.getRailProgress(0);
                    let index = train.getRailIndex(pro, true);
                    let pd = train.path()[index];
                    let rail = pd.rail;
                    let p0 = new Vector3f(rail.getPosition(0)), p1 = new Vector3f(rail.getPosition(rail.getLength() + 100));
                    let plat = pla.platform;
                    
                    if (! (plat.containsPos(p0.toBlockPos()) && plat.containsPos(p1.toBlockPos()))) {
                        t1 = "下一站", t2 = "Next Station";
                    } else {
                        t1 = "到达", t2 = "Arrive";
                        isArrive = true;
                    }
                    name = station.name;
                    t3 = TU.CP(name), t4 = TU.NP(name);
                    is = false;
            
                    let paths = train.path();
                    let dsub = [];
                    dsub.push(0);
                    for (let i = 1; i <= paths.length; i++) {
                        dsub[i] = dsub[i - 1] + paths[i - 1].rail.getLength();
                    }
            
                    let d = pla.distance;
                    let s = train.spacing();
                    let rv1 = d - s * carIndex;
                    let rv2 = d - s * (carIndex - 1);
                    let po1 = train.getRailIndex(rv1, true);
                    let po2 = train.getRailIndex(rv2, true);
                    let r1 = paths[po1].rail;
                    let r2 = paths[po2].rail;
                    let v1 = rv1 - dsub[po1];
                    let v2 = rv2 - dsub[po2];
                    let pp1 = r1.getPosition(v1);
                    let pp2 = r2.getPosition(v2);
                    let p01 = new Vector3f(pp1), p02 = new Vector3f(pp2);
                    let bos = MinecraftClient.canOpenDoorsAt(p02, p01);
                    let o1 = bos[0];
                    let o2 = bos[1];
                    if (isRight && o1) open = 0;
                    if (!isRight && o2) open = 0;
                    if (isRight && o2) open = 1;
                    if (!isRight && o1) open = 1;
                    if (o1 && o2) open = 2;
                    // ctx.setDebugInfo(isRight + " " + carIndex, p01, p02, po1, rv1, po2, rv2);
                } catch (e) {
                    // throw e;
                    print("ARAF-LCD-getInfo Error: " + e.message);
                }
                color1 = getColor(color);
                return [color, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open];
            }

            const addDrawCall0 = (lambda0) => {
                if (drawCalls.length == 0) {
                    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = img.createGraphics();
                    lambda0(g);
                    drawCalls[0] = img;
                } else {
                    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = img.createGraphics();
                    g.drawImage(img0, 0, 0, null);
                    drawCalls[0] = img;
                    let newImg = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let newG = newImg.createGraphics();
                    lambda0(newG);
                    drawCalls[1] = [newImg, 0];
                }
            }
            const addDrawCall1 = (lambda1, lambda2) => {
                dynLambda = lambda1;
                ctrlLambda = lambda2;// 控制是否upload
            }
            const addDrawCall = (lambda0, lambda1, lambda2) => {
                addDrawCall0(lambda0);
                addDrawCall1(lambda1, lambda2);
            }
            const setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
            const checkTime = v => v < 0 ? 0 : v;
            const isOnRoute = () => train.isOnRoute();

            const fill = (g, width, x1, y1, x2, y2) => {
                g.fillRoundRect(x1 - width / 2, y1 - width / 2, x2 - x1 + width, y2 - y1 + width, width, width);
            }
            const getWH = (str, font) => {
                let frc = Resources.getFontRenderContext();
                bounds = font.getStringBounds(str, frc);
                return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
            }
            const drawMiddle = (g, str, font, x, y) => {
                let [ww, hh] = getWH(str, font);
                g.setFont(font);
                g.drawString(str, x - ww / 2, y);
            }
            
            const backGround = (g) => {
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open] = info;
                g.setColor(new Color(0xffffff));
                g.fillRect(0, 0, w, h);
                g.setColor(new Color(0xd9d9d9));
                let ww = h / 100;
                let x, y, x1, y1, w1, h1, wh, wh1, font, k, str;
                x = w * 4 / 500, y = y1 = h * 0.2;
                fill(g, ww, x, y, w - x, y);
                x = w * 120 / 500, y = h * 4 / 300;
                fill(g, ww, x, y, x, y1 - y);
                x = w * 320 / 500;
                fill(g, ww, x, y, x, y1 - y);
                x = w * 410 / 500;
                fill(g, ww, x, y, x, y1 - y);
                x = w * 450 / 500;
                fill(g, ww, x, y, x, y1 - y);

                g.setColor(new Color(color0));
                x = w * 85 / 500, x1 = w * 115 / 500, y = h * 8 / 300, w1 = x1 - x, h1 = y1 - 2 * y;
                g.fillRoundRect(x, y, w1, h1, w1 * 0.2, h1 * 0.3);
                k = h1 * 0.45;
                font = font0.deriveFont(Font.PLAIN, k);
                g.setFont(font);
                g.setColor(new Color(color1));
                wh = getWH(cname, font);
                g.drawString(cname, x + (w1 - wh[0]) / 2, y + k);
                k = h1 * 0.3;
                font = font0.deriveFont(Font.PLAIN, k);
                g.setFont(font);
                wh = getWH(ename, font);
                g.drawString(ename, x + (w1 - wh[0]) / 2, y + h1 * 0.85);

                x = w * 10 / 500, w1 = h1;
                g.drawImage(logo, x, y, w1, w1, null);
                g.setColor(new Color(0));
                k = h1 * 0.6;
                font = font0.deriveFont(Font.PLAIN, k);
                x = w * 56 / 500, y = h1 * 0.7;
                drawMiddle(g, "北武工艺", font, x, y);
                k = h1 * 0.28;
                font = font0.deriveFont(Font.PLAIN, k);
                y = h1 * 1.1;
                drawMiddle(g, "HOKUBUCRAFT", font, x, y);

                g.setColor(new Color(0x606060));
                k = y1 * 0.35;
                font = font0.deriveFont(Font.PLAIN, k);
                x = w * 340 / 500, y = y1 * 0.5;
                drawMiddle(g, " 终 点 站:", font, x, y);
                k = y1 * 0.23;
                font = font0.deriveFont(Font.PLAIN, k);
                y = y1 * 0.82;
                drawMiddle(g, "Terminus", font, x, y);
                g.setColor(new Color(0));
                k = y1 * 0.42;
                font = font0.deriveFont(Font.BOLD, k);
                x = w * 385 / 500, y = y1 * 0.5;
                drawMiddle(g, cdest, font, x, y);
                k = y1 * 0.28;
                font = font0.deriveFont(Font.PLAIN, k);
                y = y1 * 0.87;
                drawMiddle(g, edest, font, x, y);

                g.setColor(new Color(0x606060));
                w1 = 0;
                k = y1 * 0.7;
                font = font0.deriveFont(Font.PLAIN, k);
                wh1 = getWH(carIndex, font);
                w1 += wh1[0];
                k = y1 * 0.35;
                font = font0.deriveFont(Font.PLAIN, k);
                wh = getWH("车厢", font);
                w1 += wh[0];

                x1 = w * (410 + 450) / 2 / 500;
                k = y1 * 0.7;
                font = font0.deriveFont(Font.PLAIN, k);
                x = x1 - w1 / 2 + wh1[0] / 2, y = y1 * 0.75;
                drawMiddle(g, carIndex, font, x, y);
                k = y1 * 0.35;
                font = font0.deriveFont(Font.PLAIN, k);
                x = x1 + w1 / 2 - wh[0] / 2, y = y1 * 0.5;
                drawMiddle(g, "车厢", font, x, y);
                k = y1 * 0.23;
                font = font0.deriveFont(Font.PLAIN, k);
                y = y1 * 0.78;
                drawMiddle(g, "Car " + carIndex, font, x, y);

                g.setColor(new Color(0));
                x = w * (450 + 500) / 2 / 500;
                y = y1 * 0.37;
                k = y1 * 0.3;
                font = font0.deriveFont(Font.PLAIN, k);
                drawMiddle(g, time0, font, x, y);
                y = y1 * 0.83;
                k = y1 * 0.5;
                font = font0.deriveFont(Font.PLAIN, k);
                drawMiddle(g, time1, font, x, y);

                g.setColor(new Color(0x606060));
                if (is) {
                    x = w * (120 + 320) / 2 / 500;
                    y = y1 * 0.7;
                    k = y1 * 0.5;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle(g, t1, font, x, y);
                } else {
                    x = w * 140 / 500, y = y1 * 0.5;
                    k = y1 * 0.35;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle(g, t1, font, x, y);
                    y = y1 * 0.85;
                    k = y1 * 0.25;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle(g, t2, font, x, y);
                    
                    g.setColor(new Color(0));
                    k = y1 * 0.6;
                    w1 = 0;
                    font = font0.deriveFont(Font.BOLD, k);
                    wh = getWH(t3, font);
                    w1 += wh[0];
                    k = y1 * 0.4;
                    font = font0.deriveFont(Font.BOLD, k);
                    wh1 = getWH(t4, font);
                    w1 += wh1[0];
                    x1 = w * 10 / 500;
                    w1 += x1;
                    x = w * 250 / 500 - w1 / 2;
                    y = y1 * 0.72;
                    k = y1 * 0.6;
                    font = font0.deriveFont(Font.BOLD, k);
                    g.setFont(font);
                    g.drawString(t3, x, y);
                    k = y1 * 0.4;
                    x = x + wh[0] + x1;
                    k = y1 * 0.3;
                    font = font0.deriveFont(Font.BOLD, k);
                    g.setFont(font);
                    g.drawString(t4, x, y);
                }

                g.setColor(new Color(0));
                x = w * 50 / 500, y = h * 0.83;
                k = h * 0.08;
                font = font0.deriveFont(Font.PLAIN, k);
                str = "";
                switch (open) {
                    case -1: str = "不开门"; break;
                    case 0: str = "对侧开门"; break;
                    case 1: str = "本侧开门"; break;
                    case 2: str = "双侧开门"; break;
                }
                drawMiddle(g, str, font, x, y);
                y = h * 0.9;
                k = h * 0.05;
                font = font0.deriveFont(Font.PLAIN, k);
                str = "";
                switch (open) {
                    case -1: str = "Do Not Open"; break;
                    case 0: str = "Open The Other Side"; break;
                    case 1: str = "Exit This Side"; break;
                    case 2: str = "Open Both Sides"; break;
                }
                drawMiddle(g, str, font, x, y);

                if (isArrive) {
                    g.setColor(new Color(color0));
                    str = "到达 " + t3;
                    k = h * 0.16;
                    font = font0.deriveFont(Font.PLAIN, k);
                    x = w * 200 / 500, y = h * 0.6;
                    drawMiddle(g, str, font, x, y);
                    str = "Arrived: " + t4;
                    k = h * 0.12;
                    font = font0.deriveFont(Font.PLAIN, k);
                    y = h * 0.8;
                    drawMiddle(g, str, font, x, y);
                }
            }

            const d = [];
            for (let i = -1; i < 2; i += 2) {
                let x0 = 0, y0 = h * 0.4, w0 = w * 20 / 500 * 1.1, h0 = h * 0.4;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                let draw = (x, y, w1, h1, ww) => {
                    if (ww == 0) {
                        if (i > 0) {
                            g.fillRect(x, y, w1, h1);
                        } else {
                            g.fillRect(w0 - x - w1, y, w1, h1);
                        }
                        return;
                    }
                    if (i > 0) {
                        g.fillRoundRect(x, y, w1, h1, ww, ww);
                    } else {
                        g.fillRoundRect(w0 - x - w1, y, w1, h1, ww, ww);
                    }
                }
                let x1, y1, w1, h1, w2, h2, ww, t;
                w1 = w * 20 / 500, h1 = h * 0.4, ww = w1 * 0.3;
                g.setColor(new Color(0x909090));
                h2 = h1 * 0.5;
                x1 = x0 + w1 / 2, y1 = y0 - h1 + (h1 - h2) / 2, w2 = w1 * 0.55;
                draw(x1, y1, w2, h2, ww);
                x1 = x0, y1 = y0 - h1, w2 = w1, h2 = h1;
                draw(x1, y1, w2, h2, ww);
                draw(x1 - 1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xd0d0d0));
                t = w1 * 0.03;
                x1 += t, y1 += t, w2 -= 2 * t, h2 -= 2 * t, ww -= t;
                draw(x1, y1, w2, h2, ww);
                draw(x1 - 1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xc0c0c0));
                t = w1 * 0.12;
                x1 += t, y1 += t, w2 -= 2 * t, h2 = h1 * 0.5, ww -= t;
                draw(x1, y1, w2, h2, ww);
                d.push(img);
            }
            const dWidth = w * 20 / 500 * 1.1;
            const d0 = (g) => {
                let x = w * 50 / 500, y = h * (0.7 - 0.4);
                let v = smooth(1, doorValue * 3);
                let tx = v * w * 20 / 500;
                g.drawImage(d[1], x + tx - 1, y, null);
                g.drawImage(d[0], x - dWidth - tx + 1, y, null);
                if (doorOpen == false) {
                    let ww = w * 40 / 500 * 0.7;
                    y = h * (0.7 + 0.3) / 2 - h * 0.02 - ww / 2;
                    x = w * 50 / 500 - ww / 2;
                    setComp(g, 0.6);
                    g.setColor(new Color(0xff0000));
                    g.fillRoundRect(x, y, ww, ww, ww, ww);
                    let w1 = ww * 0.8, h1 = ww * 0.14;
                    y += (ww - h1) / 2;
                    x += (ww - w1) / 2;
                    setComp(g, 1);
                    g.setColor(new Color(0xffffff));
                    g.fillRect(x, y, w1, h1);
                }
            }
            
            const ctrl = () => {
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open] = info;
                let newOpen = open > 0 ? 1 : 0;
                let newValue = train.doorValue() * newOpen;
                if (doorOpen != newOpen || doorValue != newValue) {
                    doorOpen = newOpen;
                    doorValue = newValue;
                    return true;
                }
                return false;
            }

            let first = true;
            while (state.running && state.lastTime + 30000 > now()) {
                try {
                    if (first) {
                        info = getInfo();
                        addDrawCall(backGround, d0, ctrl);
                        needUpload = true;
                        mainAlpha = isOnRoute() ? 1 : 0;
                        newAlpha = mainAlpha;
                        first = false;
                    }
                    startTime = now();

                    if (info.toString() != getInfo().toString() && isOnRoute()) {
                        info = getInfo();
                        addDrawCall0(backGround);
                        needUpload = true;
                    }
                    newAlpha = mainAlpha + lastFrameTime * (isOnRoute() ? 1 : -1) / 1000 * 1.2;
                    newAlpha = Math.max(0, Math.min(1, newAlpha));
                    if (newAlpha != mainAlpha) {
                        needUpload = true;
                        mainAlpha = newAlpha;
                    }

                    // ctx.setDebugInfo("mainAlpha", mainAlpha, newAlpha);

                    needUpload = needUpload || ctrl();
                    // ctx.setDebugInfo("needUpload", needUpload);
                    if (drawCalls[1] != null) needUpload = true;

                    if (needUpload) {
                        if (drawCalls[0] != null) g0.drawImage(drawCalls[0], 0, 0, null);
                        if (drawCalls[1]!= null) {
                            setComp(g0, 1);
                            if (drawCalls[1] != null) {
                                let [img, value] = drawCalls[1];
                                setComp(g0, smooth(1, value));
                                g0.drawImage(img, 0, 0, null);
                                drawCalls[1][1] += lastFrameTime / 1000 * 1.2;
                                if (drawCalls[1][1] > 1) drawCalls[0] = drawCalls.pop()[0];
                            }
                        }

                        if (mainAlpha == 1) {
                            let g = tex.graphics;
                            setComp(g, 1);
                            g.drawImage(img0, 0, 0, null);
                            dynLambda(g);
                        } else {
                            let g = tex.graphics;
                            setComp(g1, 1);
                            g1.drawImage(img0, 0, 0, null);
                            dynLambda(g1);
                            setComp(g, 1);
                            g.setColor(new Color(0));
                            g.fillRect(0, 0, w, h);
                            setComp(g, smooth(1, mainAlpha));
                            // ctx.setDebugInfo("alphaa" + isRight, mainAlpha);
                            g.drawImage(img1, 0, 0, null);
                        }
                        
                        tex.upload();
                        needUpload = false;
                    }

                    lastFrameTime = now() - startTime;
                    ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + "  Used: ", lastFrameTime + "ms");
                    lastFrameTime = now() - startTime;
                } catch (e) {
                    ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + " Error At: ", now() + e.message);
                    print("ARAF-LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + " Error At: " + now() + e.message);
                    // Thread.sleep(3000);
                }
            }
            print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Exit");
        } catch (e) {
            ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + " Error At: ", System.currentTimeMillis() + e.message);
            print("ARAF-LCD-Thread " + (isRight ? "Right " : "Left ") + carIndex + " Error At: " + System.currentTimeMillis() + e.message);
        } 
    } 
    return new Thread(main, "ARAF-LCD-Thread On Train" + ctx.hashCode() + (isRight? "Right" : "Left"));
}