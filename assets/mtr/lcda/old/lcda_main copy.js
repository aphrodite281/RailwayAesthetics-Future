importPackage (java.lang);
importPackage (java.awt);
importPackage (java.awt.image);

include(Resources.id("aphrodite:library/code/model/face.js"));
include(Resources.id("aphrodite:library/code/util/text_u.js"));

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
    acc += Timing.delta() * 1000 * 10;
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
    if (isRight) result.push(matt);
    return result;
}

function getThread(face, isRight, ctx, state, train, carIndex) {
    var font0 = fontA.deriveFont(Font.PLAIN, 45);
    var font1 = fontB.deriveFont(Font.PLAIN, 45);
    var font2 = fontC.deriveFont(Font.PLAIN, 45);
    var main = () => {
        try {
            print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Start");
            ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " Start", System.currentTimeMillis().toString());
            var tex = face.texture;
            tex.graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            var h = tex.height, w = tex.width;
            var drawCalls = []; //[[lu, ld, alpha],[lu, ld, alpha]]
            let needUpload = false;
            let isBlack = true;
            var inChanging = () => drawCalls.length == 2;
            var addDrawCall = (lup, ldown, isStatic) => {
                let ll;
                if (isStatic) {
                    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = img.createGraphics();
                    lup(g);
                    ll = (g) => {g.drawImage(img, 0, 0, null)};
                } else {
                    ll = lup, 0;
                }
                if (drawCalls.length == 0) {
                    drawCalls.push([ll, ldown,  0]);
                } else {
                    drawCalls[1] = [ll, ldown, 0];
                    let lastFrame = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let gg = lastFrame.createGraphics();
                    gg.drawImage(tex.bufferedImage, 0, 0, w, h, null);
                    drawCalls[0] = [(g) => {g.drawImage(lastFrame, 0, 0, null)}, 1];
                }
            }

            var now = () => System.currentTimeMillis();
            var setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
            var smooth = (k, value) => {// 平滑变化
                if (value > k) return k;
                if (k < 0) return 0;
                return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
            }
            var isOnRoute = () => train.isOnRoute();
    
            let startTime = now();
            let lastTime = now();
            let lastFrameTime = 0;
            let info = getInfo(train);
            var fps = 40;
            var frameTime = 1000 / fps;
            let mainAlpha = 1;
            var checkTime = v => v < 0 ? 0 : v;

            var fill = (g, width, x1, y1, x2, y2) => {
                g.fillRoundRect(x1 - width / 2, y1 - width / 2, x2 - x1 + width, y2 - y1 + width, width, width);
            }
            var getWH = (str, font) => {
                let frc = Resources.getFontRenderContext();
                bounds = font.getStringBounds(str, frc);
                return [Math.ceil(bounds.getWidth()), Math.ceil(bounds.getHeight())];
            }
            var drawMiddle = (g, str, font, x, y) => {
                let [ww, hh] = getWH(str, font);
                g.setFont(font);
                g.drawString(str, x - ww / 2, y);
            }
            
            var backGround = (g) => {
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive] = info;
                g.setColor(new Color(0xffffff));
                g.fillRect(0, 0, w, h);
                g.setColor(new Color(0xd9d9d9));
                let ww = h / 100;
                let x, y, x1, y1, w1, h1, wh, wh1, font, k;
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
                g.setColor(new Color(0x606060));
                h2 = h1 * 0.5;
                x1 = x0 + w1 / 2, y1 = y0 - h1 + (h1 - h2) / 2, w2 = w1 * 0.6;
                draw(x1, y1, w2, h2, ww);
                g.setColor(new Color(0xc0c0c0));
                x1 = x0, y1 = y0 - h1, w2 = w1, h2 = h1;
                draw(x1, y1, w2, h2, ww);
                draw(x1 - 1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xd0d0d0));
                t = w1 * 0.08;
                x1 += t, y1 += t, w2 -= 2 * t, h2 -= 2 * t, ww -= t;
                draw(x1, y1, w2, h2, ww);
                draw(x1 - 1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xc0c0c0));
                x1 += t, y1 += t, w2 -= 2 * t, h2 = h1 * 0.5, ww -= t;
                draw(x1, y1, w2, h2, ww);
                d.push(img);
            }
            var s0 = (g) => {
                backGround(g);
                let x = w * 50 / 500, y = h * 0.3;
                setComp(g, 1);
                g.setColor(new Color(0xffffff));
                g.fillRect(0, h * 0.201, w, h * 0.799);

                let v = smooth(1, train.doorValue() * 10);
                let tx = v * w * 15 / 500;
                g.drawImage(d[1], x + tx, y, null);
                g.drawImage(d[0], x - w * 20 / 500 - tx, y, null);
                setComp(g, mainAlpha);
                needUpload = true;
            }

            var clear = (g) => {
                g.setColor(new Color(0));
                g.fillRect(0, 0, w, h);
            }
            addDrawCall(clear, true);
            while (state.running && state.lastTime + 30000 > System.currentTimeMillis()) {
                try {
                    startTime = now();
                    needUpload = false;
                    
                    { // commit DrawCalls
                        if (isOnRoute()) {
                            if (info.toString() != getInfo(train).toString() || isBlack) {
                                lastInfo = info;
                                info = getInfo(train);
                                addDrawCall(s0, false);
                                isBlack = false;
                            }
                        } else {
                            if (!isBlack) {
                                isBlack = true;
                                addDrawCall(clear, true);
                            }
                        }
                        
                        {
                            let [lambda, alpha] = drawCalls[0];
                            let g = tex.graphics;
                            setComp(g, 1);
                            lambda(g);
                        }
                        
                        if (inChanging()) {
                            let [lambda, alpha] = drawCalls[1];
                            let g = tex.graphics;
                            mainAlpha = smooth(1, alpha);
                            setComp(g, mainAlpha);
                            lambda(g);
                            drawCalls[1][1] += (now() - lastTime) / 1000 * 1.2;
                            if (drawCalls[1][1] >= 1) {
                                drawCalls[0] = [];
                                drawCalls[0] = [drawCalls.pop()[0], 1];
                            }
                            needUpload = true;
                        }
                        lastTime = now();
                        if (needUpload) tex.upload();
                        try {ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " alpha", drawCalls[1][1]);}
                        catch (e) {ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " alpha", "null");}
                    }
    
                    lastFrameTime = now() - startTime;
                    ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " Used: ", lastFrameTime + "ms");
                    Thread.sleep(checkTime(frameTime - lastFrameTime));
                } catch (e) {
                    ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " Error At: ", System.currentTimeMillis() + e.message);
                    print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Error At: " + System.currentTimeMillis() + e.message);
                    Thread.sleep(3000);
                }
            }
            print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Exit");
        } catch (e) {
            ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + " Error At: ", System.currentTimeMillis() + e.message);
            print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Error At: " + System.currentTimeMillis() + e.message);
        } 
    } 
    return new Thread(main, "ARAF-LCD-Thread On Train" + ctx.hashCode() + (isRight? "Right" : "Left"));
}

function getInfo(train) {
    let color = 0x00ffff, color1 = 0xffffff, cname = "无线路", ename = "No Route", cdest = "无线路", edest = "No Route", time0 , time1, is = true, t1 = "非运营列车  Non-operating train", t2 = "", t3 = "", t4 = "", isArrive = false;
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
        let dest = station.name;
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
    } catch (e) {
        // throw e;
        print("ARAF-LCD-getInfo Error: " + e.message);
    }
    color1 = getColor(color);
    return [color, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive];
}