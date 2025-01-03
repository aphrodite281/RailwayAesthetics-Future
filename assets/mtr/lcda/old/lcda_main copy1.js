/**
 * @author: Aphrodite281 QQ: 3435494979
 */

importPackage (java.lang);
importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);

include(Resources.id("aphrodite:library/code/model/face.js"));
include(Resources.id("aphrodite:library/code/util/text_u.js"));
include(Resources.id("aphrodite:library/code/util/map_tostring.js"));
include(Resources.id("aphrodite:library/code/util/array_tostring.js"));
include(Resources.id("aphrodite:library/code/util/value.js"));
include(Resources.id("aphrodite:library/code/graphic/color_u.js"));
include(Resources.id("aphrodite:library/code/graphic/text_manager.js"));
include(Resources.id("aphrodite:library/code/graphic/canvas.js"));
include(Resources.id("mtr:lcda/icon/hc.js"));
include(Resources.id("mtr:lcda/icon/bz.js"));
include(Resources.id("mtr:lcda/icon/xr.js"));
include(Resources.id("mtr:lcda/icon/zwfh.js"));
include(Resources.id("mtr:lcda/icon/jt.js"));

const logo = Resources.readBufferedImage(Resources.id("mtr:lcda/icon/logo.png"));

const defaultScreenTextureSize = [1600 * 5 / 4, 400 * 5 / 4];
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
const cu = ColorU;

function create(ctx, state, train) {
    state.running = true;
    state.lastTime = Date.now();
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
    
        let rightThread = new LCDThread(rightFace, true, ctx, state, train, i + 1);
        let leftThread = new LCDThread(leftFace, false, ctx, state, train, i + 1);

        let sr = () => {if(!rightThread.isAlive()) rightThread.start();};
        let sl = () => {if(!leftThread.isAlive()) leftThread.start();};
        tickList.push(() => {rightFace.tick(); leftFace.tick(); sr(); sl();});
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
    state.lastTime = Date.now();
    for (let entry of state.tickList) {
        entry();
    }
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

/* const route0 = [];
{
    const getColor = (color) => {
        let rr = color >> 16 & 0xff;
        let g = color >> 8 & 0xff;
        let b = color & 0xff;
        let luminance  = 0.299 * rr + 0.587 * g + 0.114 * b;
        return luminance > 255 / 2 ? 0 : 0xffffff;
    }
    for (let i = 1; i <= 100; i++) {
        let color = Math.random() * 0xffffff;
        route0.push([i + "号线", "Line " + i, color, getColor(color)]);
    }
}*/

function LCDThread(face, isRight, ctx, state, train, carIndex) {
    const uid = "ARAF-LCDThread-" + (isRight ? "Right" : "Left") + "-" + carIndex;
    let thread = new Thread(() => {
        const disposeList = [];
        try {
            print(uid + " Start");
            ctx.setDebugInfo(uid + " Start", System.currentTimeMillis().toString());

            const font0 = fontA.deriveFont(Font.PLAIN, 45);
            const font1 = fontB.deriveFont(Font.PLAIN, 45);
            const font2 = fontC.deriveFont(Font.PLAIN, 45);
            
            const tex = face.texture;
            const w = tex.width, h = tex.height;
            const img0 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);// 渐变现状
            const g0 = img0.createGraphics();
            const img1 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);// 合并
            const g1 = img1.createGraphics();
            disposeList.push(() => {g0.dispose(); g1.dispose();});

            const now = () => Date.now();
            const drawCalls = [];// [旧图, [新渐变的, 新alpha]] 渐变绘制
            let DDrawCalls = [];// [[fun, alpha, st, et, dispose], [fun, alpha, st, dispose]] 动态渐变绘制
            let mainAlpha = new Value(0, 1, 0, 1.2, 0, 0);// 主渐变alpha
            let needUpload = false;// 是否需要上传
            let lastFrameTime = 0;// 上一帧时间
            let startTime = 0;// 开始时间
            let info = [-1];// 信息
            let doorValue = train.doorValue();// 本侧门值
            let doorOpen = false;// 本侧门开关
            // const fps = 24;// 帧率
            // const frameTime = 1000 / fps;// 帧时间
            let outAlpha = new Value(0, 1, 0, 1.5, -1, 2);// 门里的指示的透明度
            let icolor, icolor1, icname, iename, icdest, iename1, icname1, iename2, icname2, iename3, icname3, iename4, icname4, itime0, itime1, iis, it1, it2, it3, it4, iisArrive, iopen, ihuancheng = new Map(), ixlt0;// info 数据
            
            /**
             * 添加动态绘制
             * @param {Function<Graphics2D, number, number>}fun1 绘制函数 传入Graphics, 开始时间，结束时间 返回是否删除此绘制
             */
            const addDrawCallD = (fun1) => {
                for (let i = 0; i < DDrawCalls.length; i++) {
                    if (DDrawCalls[i][2] == null) DDrawCalls[i][2] = now();
                }
                DDrawCalls.push([fun1, Date.now(), null, false]);
            }

            /**
             * 添加静态绘制
             * @param {Function<Graphics2D>} fun0 绘制函数
             */
            const addDrawCallS = (fun0) => {
                if (drawCalls.length == 0) {
                    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = img.createGraphics();
                    fun0(g);
                    g.dispose();
                    drawCalls[0] = img;
                } else {
                    let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = img.createGraphics();
                    g.drawImage(img0, 0, 0, null);
                    drawCalls[0] = img;
                    let newImg = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let newG = newImg.createGraphics();
                    fun0(newG);
                    g.dispose();
                    newG.dispose();
                    drawCalls[1] = [newImg, 0];
                }
            }

            const getInfo = () => {// 获取/更新信息，并通过toString方法判断是否应该更新
                let color = 0x00ffff, color1 = 0xffffff, cname = "无线路", ename = "No Route", cdest = "无线路", edest = "No Route", time0 , time1, is = true, t1 = "非运营列车  Non-operating train", t2 = "", t3 = "", t4 = "", isArrive = false, open = -1, huancheng = new Map(), xlt0 = [];
                let date = new Date();
                let year = date.getFullYear();
                let month = (date.getMonth() + 1).toString().padStart(2, '0');
                let day = date.getDate().toString().padStart(2, '0');
                let hour = date.getHours().toString().padStart(2, '0');
                let minute = date.getMinutes().toString().padStart(2, '0');
                time0 = year + "-" + month + "-" + day;
                time1 = hour + ":" + minute;
                const getColor = (color) => {
                    let rr = color >> 16 & 0xff;
                    let g = color >> 8 & 0xff;
                    let b = color & 0xff;
                    let luminance  = 0.299 * rr + 0.587 * g + 0.114 * b;
                    return luminance > 255 / 2 ? 0 : 0xffffff;
                }
                try {
                    let plas = train.getThisRoutePlatforms();
                    let ind = train.getThisRoutePlatformsNextIndex();
                    let pla = plas[ind];
                    let station = pla.destinationStation;
                    const ss = () => {
                        if (station == null) station = {name: "无车站|No Station", id: 0};
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
                    /* let k = acc / 1000 % 100;
                    for (let i = 0; i < k; i++) {
                        huancheng.set(route0[i][0] + "|" + route0[i][1], [route0[i][0], route0[i][1], route0[i][2], route0[i][3]]);
                    }
                    throw new Error(); */
                    let dataCache = MTRClientData.DATA_CACHE;
                    let plass = dataCache.requestStationIdToPlatforms(station.id);
                    for (let [id, platform] of plass) {
                        /* let platformRouteDetails = dataCache.requestPlatformIdToRoutes(id);
                        for (let platformRouteDetail of platformRouteDetails) {
                            let name = platformRouteDetail.routeName;
                            let color = platformRouteDetail.routeColor;
                            huancheng.set(TU.CP(name) + "|" + TU.NP(name), [TU.CP(name), TU.NP(name), color, getColor(color)]);
                        } */
                        for (let route of MTRClientData.ROUTES) {
                            if (route.isHidden) continue;
                            if (route.containsPlatformId(id)) {
                                let name = route.name;
                                let color = route.color;
                                huancheng.set(TU.CP(name) + "|" + TU.NP(name), [TU.CP(name), TU.NP(name), color, getColor(color)]);
                                continue;
                            }
                        }
                    }
                    huancheng.delete(TU.CP(route.name) + "|" + TU.NP(route.name));

                    if (isOnRoute()) {
                        for (let i = -2; i < 3; i++) {
                            try {
                                pla = plas[ind + i];
                                station = pla.station;
                                ss();
                                name = station.name;
                                xlt0.push([TU.CP(name), TU.NP(name)]);
                            } catch (e) {
                                xlt0.push(undefined);
                            }
                        }
                    }
                } catch (e) {
                    print("ARAF-LCD-getInfo Error: " + e.message);
                }
                color1 = getColor(color);
                icolor = color, icolor1 = color1, icname = cname, iename = ename, icdest = cdest, idest = edest, itime0 = time0, itime1 = time1, iis = is, it1 = t1, it2 = t2, it3 = t3, it4 = t4, iisArrive = isArrive, iopen = open, ihuancheng = huancheng, ixlt0 = xlt0;
                return [color, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open, huancheng, xlt0, DStyle];
            }

            const setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
            const isOnRoute = () => train.isOnRoute();

            const fill = (g, width, x1, y1, x2, y2) => {
                g.fillRoundRect(x1 - width / 2, y1 - width / 2, x2 - x1 + width, y2 - y1 + width, width, width);
            }
            const getWH = (g, str, font) => {
                g.setFont(font);
                // const frc = g.getFontRenderContext();
                // bounds = font.getStringBounds(str, frc);
                // const width = bounds.getWidth(), height = bounds.getHeight();
                const fm = g.getFontMetrics(font);
                const width = fm.stringWidth(str), height = fm.getHeight();
                return [width, height];
            }

            const drawMiddle = (g, str, font, x, y) => {
                let [ww, hh] = getWH(g, str, font);
                g.drawString(str, x - ww / 2, y);
            }

            function S1() {
                let w0 = w * 110 / 500, h0 = h * 0.75;
                const dx = (v) => w0 * v;
                const dy = (v) => h0 * v;
                let ox = 0.28, oy = 0.43, sx = 0.6, sy = 0.6, wi = 1100, hi = 900;
                const fx = (v) => dx(sx * v / wi + ox);
                const fy = (v) => dy(sy * v / hi + oy);
                const img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                const g = img.createGraphics();
                let x, y, w1, h1, path, x0, y0, line, ww, font;
                x0 = w0 * 0.6, y0 = dy(0.7);
                g.setColor(new Color(0xefefef));
                ww = h0 * 0.1;
                g.fillRoundRect(0, 0, w0, h0, ww, ww);


                let num = info[0];
                let rr = num >> 16 & 0xff, gr = num >> 8 & 0xff, b = num & 0xff;
                rr = (rr - 60), gr = (gr - 60), b = (b - 60);
                rr = rr < 0 ? 0 : rr, gr = gr < 0 ? 0 : gr, b = b < 0 ? 0 : b;
                rr = (255 - rr), gr = (255 - gr), b = (255 - b);
                g.setColor(new Color(rr << 16 | gr << 8 | b));
                g.fill(bz(fx, fy));

                
                ww = dy(0.02);
                g.setColor(new Color(num));
                g.fillRect(0, y0, dx(0.58), h0 * 0.03);
                g.fillRect(dx(0.6), y0, w0 * 0.45, h0 * 0.03);
                rr = num >> 16 & 0xff, gr = num >> 8 & 0xff, b = num & 0xff;
                rr = (rr - 60), gr = (gr - 60), b = (b - 60);
                rr = rr < 0 ? 0 : rr, gr = gr < 0 ? 0 : gr, b = b < 0 ? 0 : b;
                let color = rr << 16 | gr << 8 | b;
                g.setColor(new Color(color));
                g.fillRect(0, dy(0.73), dx(0.58), dy(0.02));
                path = new GeneralPath();
                path.moveTo(dx(1), dy(0.73) - 1);
                path.lineTo(dx(0.6), dy(0.73) - 1);
                path.quadTo(dx(0.6), dy(0.75), dx(0.63), dy(0.75));
                path.lineTo(dx(1), dy(0.75));
                path.lineTo(dx(1), dy(0.73) - 1);
                path.closePath();
                g.fill(path);
                g.draw(path);
                // g.fillRoundRect(dx(0.65), y0 + ww * 1.8, w0 * 0.45 + ww, h0 * 0.03, ww, ww);

                path = new GeneralPath();
                y = dy(0.08), x = dx(0.5);
                path.moveTo(0, dy(0.08));
                path.lineTo(dx(0.5), dy(0.08));
                path.quadTo(dx(0.57), dy(0.08), dx(0.57), dy(0.18));
                path.lineTo(dx(0.57), y0);
                path.lineTo(dx(0.54), y0);
                path.lineTo(dx(0.54), dy(0.18));
                path.quadTo(dx(0.54), dy(0.11), dx(0.45), dy(0.11));
                path.lineTo(0, dy(0.095));
                path.lineTo(0, dy(0.08));
                path.closePath();

                g.setColor(new Color(0x000040));
                g.fill(path);
                g.setColor(new Color(0xffffff));
                setComp(g, 0.8);
                ww = dy(0.02);
                g.fillRoundRect(dx(0.548), dy(0.2), dx(0.562) - dx(0.548), dy(0.49), ww, ww);

                g.setColor(new Color(0));
                
                setComp(g, 1);

                sx = 0.34, sy = 0.6;
                wi = 210, hi = 297;
                oy = 0.15, ox = 0.4;

                xr(g, fx, fy);

                let r = dy(0.08);
                g.fillRoundRect(dx(0.6), dy(0.22), r, r, r, r);

                setComp(g, 1);
                g.setColor(Color.black);
                font = font0.deriveFont(Font.PLAIN, dy(0.09));
                drawMiddle(g, "请小心站台间隙", font, dx(0.5), dy(0.88));
                font = font0.deriveFont(Font.PLAIN, dy(0.04));
                drawMiddle(g, "Please mind the gap", font, dx(0.5), dy(0.96));
                g.dispose();

                this.draw = (g, x, y) => g.drawImage(img, x, y, null);
                this.commit = (g, x, y) => {};
            }
            
            function S2() {
                let w0 = w * 110 / 500, h0 = h * 0.75;
                const img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                const g = img.createGraphics();
                const textManager = new TextManager(w0, h0, x => x, y => y);
                const drawMiddle = textManager.drawMiddle;
                const dx = (ax) => w0 * ax / 440;
                const dy = (ay) => h0 * ay / 375;
                g.setColor(new Color(0xefefef));
                let ww = h0 * 0.1;
                g.fillRoundRect(0, 0, w0, h0, ww, ww);
                let scale = dy(80) / 52, x = dx(120), y = dy(70);
                let canvas = Canvas.createWithCenterAndScale(g, x, y, scale, 52, 52);
                hc(canvas, g, ctx);
                const p = Font.PLAIN;
                drawMiddle("可 换 乘", font0, p, 0xa0a0a0, dx(280), dy(51), w0, dy(58), now(), 1);
                drawMiddle("Transfer To", font0, p, 0xa0a0a0, dx(280), dy(105), w0, dy(30), now(), 1);

                const draw = (x, y, w1, h1, color0, color1, c, n) => {
                    g.setColor(new Color(color0));
                    g.fillRoundRect(x, y, w1, h1, dy(10), dy(10));
                    g.setColor(new Color(color1));
                    drawMiddle(c, font, p, color, x + w1 / 2, y + h1 * 0.25, w1, h1 * 0.4, now(), 1);
                    drawMiddle(n, font, p, color, x + w1 / 2, y + h1 * 0.8, w1, h1 * 0.25, now(), 1);
                }

                let array = [];
                for (let [key, value] of ihuancheng) {
                    array.push(value);
                }
                array.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
                let y0 = dy(140), y1 = dy(280), h1 = dy(100), w1 = dx(180)
                let jx = dx(20), jy = dy(20), col = 1, row = 1;
                scale = 1;
                while (row * col < array.length) {
                    scale -= 0.05;
                    h1 = dy(100) * scale;
                    w1 = dx(180) * scale;
                    jx = dx(20) * scale;
                    jy = dy(20) * scale;
                    col = Math.floor(dx(440) / (w1 + jx));
                    row = Math.floor((y1 - y0) / (h1 + jy));
                }
                jx = (dx(440) - col * w1) / (col);
                jy = ((y1 - y0) - row * h1) / (row);
                col = Math.ceil(array.length / row);
                for (let i = 0; i < array.length; i++) {
                    let k = (row - 1) * col, a = i;
                    let colu = col;
                    if (a >= k) colu = array.length - (row - 1) * col;// 如果是最后一行 且有多行不一定是col列
                    a = a % col;
                    let rowt = Math.floor((i / col));
                    let startx = (dx(440) - colu * w1 - (colu - 1) * jx) / 2;
                    let x = startx + a * (w1 + jx);
                    let starty = y0 + ((y1 - y0) - (row * h1 + (row - 1) * jy)) / 2;
                    let y = starty + rowt * (h1 + jy);
                    draw(x, y, w1, h1, array[i][2], array[i][3], array[i][0], array[i][1]);
                }
                setComp(g, 1);
                g.setColor(Color.black);
                drawMiddle("请小心站台间隙", font, p, 0, dx(220), dy(345), w0, dy(40), now(), 1);
                font = font0.deriveFont(Font.PLAIN, dy(25));
                drawMiddle(g, "Please mind the gap", font, p, dx(220), dy(360 + 25 / 2), w0, dy(25), now(), 1);

                g.dispose();
                
                this.draw = (g, x, y) => g.drawImage(img, x, y, null);
                this.commit = (g, x, y) => textManager.commit(g, x, y);
            }

            function D1() {
                let w0 = w * 110 / 500, h0 = h * 0.75;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                const dx = (ax) => w0 * ax;
                const dy = (ay) => h0 * ay;
                g.setColor(new Color(0xefefef));
                let ww = h0 * 0.1;
                g.fillRoundRect(0, 0, w0, h0, ww, ww);
                let u = (r, g, b) => r << 16 | g << 8 | b;
                let h1 = dy(0.7);
                let s = h1 / 79;
                s = Math.min(s, w0 / 132);
                let canvas = Canvas.createWithCenterAndScale(g, w0 / 2, h1 / 2, s, 132, 79, 1, [[u(255, 255, 0), icolor], [u(86, 255, 0), 0xffffff], [u(49, 219, 255), icolor]]);
                zwfh(canvas);
                let font = font0.deriveFont(Font.PLAIN, dy(0.1));
                drawMiddle(g, "请站稳扶好", font, dx(0.5), dy(0.85));
                font = font0.deriveFont(Font.PLAIN, dy(0.05));
                drawMiddle(g, "Please stand firm and hold yourself steady", font, dx(0.5), dy(0.95));
                
                this.draw = (g, x, y) => g.drawImage(img, x, y, null);
                this.commit = (g, x, y) => {};
            }

            function D2() {
                let w0 = w * 110 / 500, h0 = h * 0.75;
                const img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                const g = img.createGraphics();
                const textManager = new TextManager(w0, h0, x => x, y => y);
                const drawMiddle = textManager.drawMiddle;
                const dx = (ax) => w0 * ax / 440;
                const dy = (ay) => h0 * ay / 375;
                g.setColor(new Color(0xefefef));
                let ww = h0 * 0.1;
                g.fillRoundRect(0, 0, w0, h0, ww, ww);
                let scale = dy(80) / 52, x = dx(120), y = dy(70);
                let canvas = Canvas.createWithCenterAndScale(g, x, y, scale, 52, 52);
                hc(canvas, g, ctx);
                const p = Font.PLAIN;
                drawMiddle("可 换 乘", font0, p, 0xa0a0a0, dx(280), dy(51), w0, dy(58), now(), 1);
                drawMiddle("Transfer To", font0, p, 0xa0a0a0, dx(280), dy(105), w0, dy(30), now(), 1);

                const draw = (x, y, w1, h1, color0, color1, c, n) => {
                    g.setColor(new Color(color0));
                    g.fillRoundRect(x, y, w1, h1, dy(10), dy(10));
                    g.setColor(new Color(color1));
                    drawMiddle(c, font, p, color, x + w1 / 2, y + h1 * 0.25, w1, h1 * 0.4, now(), 1);
                    drawMiddle(n, font, p, color, x + w1 / 2, y + h1 * 0.8, w1, h1 * 0.25, now(), 1);
                }

                let array = [];
                for (let [key, value] of ihuancheng) {
                    array.push(value);
                }
                array.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
                let y0 = dy(140), y1 = dy(280), h1 = dy(100), w1 = dx(180)
                let jx = dx(20), jy = dy(20), col = 1, row = 1;
                scale = 1;
                while (row * col < array.length) {
                    scale -= 0.05;
                    h1 = dy(100) * scale;
                    w1 = dx(180) * scale;
                    jx = dx(20) * scale;
                    jy = dy(20) * scale;
                    col = Math.floor(dx(440) / (w1 + jx));
                    row = Math.floor((y1 - y0) / (h1 + jy));
                }
                jx = (dx(440) - col * w1) / (col);
                jy = ((y1 - y0) - row * h1) / (row);
                col = Math.ceil(array.length / row);
                for (let i = 0; i < array.length; i++) {
                    let k = (row - 1) * col, a = i;
                    let colu = col;
                    if (a >= k) colu = array.length - (row - 1) * col;// 如果是最后一行 且有多行不一定是col列
                    a = a % col;
                    let rowt = Math.floor((i / col));
                    let startx = (dx(440) - colu * w1 - (colu - 1) * jx) / 2;
                    let x = startx + a * (w1 + jx);
                    let starty = y0 + ((y1 - y0) - (row * h1 + (row - 1) * jy)) / 2;
                    let y = starty + rowt * (h1 + jy);
                    draw(x, y, w1, h1, array[i][2], array[i][3], array[i][0], array[i][1]);
                }
                setComp(g, 1);
                g.setColor(Color.black);
                drawMiddle("请站稳扶好", font, p, 0, dx(220), dy(345), w0, dy(40), now(), 1);
                font = font0.deriveFont(Font.PLAIN, dy(25));
                drawMiddle(g, "Please stand firm and hold yourself steady", font, p, dx(220), dy(360 + 25 / 2), w0, dy(25), now(), 1);

                g.dispose();
                
                this.draw = (g, x, y) => g.drawImage(img, x, y, null);
                this.commit = (g, x, y) => textManager.commit(g, x, y);
            }

            function SGround() {
                const tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                const g = tex.createGraphics();
                const textManager = new TextManager(w, h, x => x, y => y);
                const drawMiddle = textManager.drawMiddle;
                const p = Font.PLAIN;
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open] = info;
                const dx = (ax) => w * ax / 500;
                const dy = (ay) => h * ay;
                g.setColor(new Color(0xffffff));
                g.fillRect(0, 0, w, h);
                g.setColor(new Color(0xd9d9d9));
                let x, y, x1, y1, w1, h1, wh, wh1, font, k, str, ww;
                x = w * 4 / 500, y = y1 = h * 0.2, ww = h / 100;
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
                x = w * 82 / 500, x1 = w * 115 / 500, y = h * 8 / 300, w1 = x1 - x, h1 = y1 - 2 * y;
                const dy1 = (ay) => h1 * ay;
                g.fillRoundRect(x, y, w1, h1, w1 * 0.2, w1 * 0.2);
                k = h1 * 0.45;
                font = font0.deriveFont(Font.PLAIN, k);
                g.setFont(font);
                g.setColor(new Color(color1));
                wh = getWH(g, cname, font);
                g.drawString(cname, x + (w1 - wh[0]) / 2, y + h1 * 0.5);
                k = h1 * 0.25;
                font = font0.deriveFont(Font.PLAIN, k);
                g.setFont(font);
                wh = getWH(g, ename, font);
                g.drawString(ename, x + (w1 - wh[0]) / 2, y + h1 * 0.82);

                x = w * 10 / 500, w1 = h1;
                g.drawImage(logo, x, y, w1, w1, null);
                g.setColor(new Color(0));
                k = h1 * 0.6;
                // font = font0.deriveFont(Font.PLAIN, k);
                // x = w * 56 / 500, y = h1 * 0.7;
                drawMiddle("北武工艺", font, p, 0, x, y, dx(100), dy1(0.7), now(), 1);
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
                wh1 = getWH(g, carIndex, font);
                w1 += wh1[0];
                k = y1 * 0.35;
                font = font0.deriveFont(Font.PLAIN, k);
                wh = getWH(g, "车厢", font);
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
                    x = w * 145 / 500, y = y1 * 0.5;
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
                    wh = getWH(g, t3, font);
                    w1 += wh[0];
                    k = y1 * 0.4;
                    font = font0.deriveFont(Font.BOLD, k);
                    wh1 = getWH(g, t4, font);
                    w1 += wh1[0];
                    x1 = w * 10 / 500;
                    w1 += x1;
                    x = w * 250 / 500 - w1 / 2;
                    y = y1 * 0.73;
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
                x = w * 45 / 500, y = h * 0.83;
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
                    k = h * 0.2;
                    font = font0.deriveFont(Font.BOLD, k);
                    x = w * (120 + 320) / 2 / 500, y = h * 0.6;
                    drawMiddle(g, str, font, x, y);
                    str = "Arrived: " + t4;
                    k = h * 0.1;
                    font = font0.deriveFont(Font.PLAIN, k);
                    y = h * 0.75;
                    drawMiddle(g, str, font, x, y);
                    
                    g.setColor(new Color(0xe0e0e0));
                    x = w * (500 - 110 - 4) / 500, y = h * 0.23;
                    g.drawImage((ihuancheng.size > 0 ? getS2() : getS1()), x, y, null);
                } else {
                    acc = -1000;
                    x = w * (500 - 110 - 4) / 500, y = h * 0.23;
                    g.drawImage((ihuancheng.size > 0 ? getD2() : getD1()), x, y, null)
                }
            }
            SGround.id = "SGround";

            const d = [];
            const drawDoor = () => {
                let x0 = 0, y0 = h * 0.4, w0 = w * 20 / 500 * 1.1, h0 = h * 0.4;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                let draw = (x, y, w1, h1, ww) => {
                    if (ww == 0) {
                        g.fillRect(x, y, w1, h1);
                        return;
                    }
                    g.fillRoundRect(x, y, w1, h1, ww, ww);
                }
                let x1, y1, w1, h1, w2, h2, ww, t;
                w1 = w * 20 / 500, h1 = h * 0.4, ww = w1 * 0.3;
                g.setColor(new Color(0x909090));
                h2 = h1 * 0.5;
                x1 = x0 + w1 / 2, y1 = y0 - h1 + (h1 - h2) / 2, w2 = w1 * 0.55;
                draw(x1, y1, w2, h2, ww);
                x1 = x0, y1 = y0 - h1, w2 = w1, h2 = h1;
                draw(x1, y1, w2, h2, ww);
                draw(x1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xd0d0d0));
                t = w1 * 0.03;
                x1 += t, y1 += t, w2 -= 2 * t, h2 -= 2 * t, ww -= t;
                draw(x1, y1, w2, h2, ww);
                draw(x1, y1, w1 - ww, h2, 0);
                g.setColor(new Color(0xc0c0c0));
                t = w1 * 0.12;
                x1 += t, y1 += t, w2 -= 2 * t, h2 = h1 * 0.5, ww -= t;
                draw(x1, y1, w2, h2, ww);
                d.push(img);
                g.dispose();
                {
                    let img = d[1] = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                    g = img.createGraphics();
                    let tx = new AffineTransform();
                    tx.scale(-1, 1);
                    tx.translate(-w0, 0);
                    g.setTransform(tx);
                    g.drawImage(d[0], 0, 0, null);
                    g.dispose();
                }
            }
            drawDoor();
            const dWidth = w * 20 / 500 * 1.1;

            const out = [];
            const drawOut = (isFill) => {
                let w0 = w * 30 / 500, h0 = h * 0.4;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                let h1 = h * 0.06, x = w * 15 / 500, y = h0;
                for (let i = 0; i < 3; i++) {
                    let xs = [];
                    let ys = [];
                    let add = (x, y) => {xs.push(x); ys.push(y)};
                    add((w0 - x) / 2, y);
                    add(w0 / 2, y - h1);
                    add((w0 + x) / 2, y);
                    add(w0 / 2, y - h1 * 0.3);
                    y -= h1 * 1.3;
                    h1 *= 0.75;
                    x *= 0.75;
                    g.setColor(new Color(0xff0000));
                    g.setStroke(new BasicStroke(h1 * 0.1));
                    let pol = new Polygon(xs, ys, 4);
                    if (isFill) g.fillPolygon(pol);
                    else g.drawPolygon(pol);
                }
                out.push(img);
                g.dispose();
            }
            drawOut(false);
            drawOut(true);
            const outWidth = w * 30 / 500;
            const DA0 = (g) => {
                setComp(g, 1);
                let x = w * 45 / 500, y = h * (0.7 - 0.4);
                let v = doorValue;
                let tx = v * w * 15 / 500;
                g.drawImage(d[0], x + tx, y, null);
                g.drawImage(d[1], x - dWidth - tx, y, null);
                if (doorOpen == false) {
                    let ww = w * 40 / 500 * 0.7;
                    y = h * (0.7 + 0.3) / 2 - h * 0.02 - ww / 2;
                    x = w * 45 / 500 - ww / 2;
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
                if (v == 1) {
                    x = w * 45 / 500 - outWidth / 2, y = h * (0.7 - 0.4);
                    g.drawImage(out[0], x, y, null);
                    setComp(g, smooth(1, outAlpha.get(true)));
                    g.drawImage(out[1], x, y, null);
                }
            }
            DA0.id = "DA0";
            
            const DR0 = (g, st, et) => {
                const dx = ax => ax * w / 500;
                const dy = ay => ay * h / 50; 
                let kf = num => Math.sqrt(num);
                let dir = [[-1, 0], [-kf(1), -kf(1)], [0, -1], [kf(1), -kf(1)], [1, 0]];
                let strs = ixlt0;
                let t = now() - st;
                t = t / 1000 * 0.5;
                let a = 1 - smooth(1, t);
                if (et != null) {
                    let t1 = now() - et;
                    t1 = t1 / 1000 * 0.5;
                    let a1 = smooth(1, t1);
                    a = Math.max(a, a1);
                }
                let dn = a * dx(100);
                setComp(g, 1 - a);
                if (strs.length == 0) {
                    g.setColor(new Color(0));
                    drawMiddle(g, "暂无信息", font0.deriveFont(Font.PLAIN, h * 0.3), dx(220) - dn, h * 0.6);
                    drawMiddle(g, "No Information", font0.deriveFont(Font.PLAIN, h * 0.1), dx(220) + dn, h * 0.8);
                    return false;
                }
                if (et != null && a == 1) return true;// 完全透明后退出
                let hsv = cu.h2v(icolor);
                let f = k => {
                    let hs = new HSV(hsv);
                    hs.s *= k;
                    return cu.v2h(hs);
                }
                let colors = [f(0.3), f(0.6), cu.v2h(hsv), f(0.8), f(0.5)];
                let ss = [0.5, 0.7, 1];
                let s = [ss[0], ss[1], ss[2], ss[1], ss[0]];

                let w1 = 90, h1 = dy(22);
                let m = 225;
                let sx = [0, 4, 1, 3, 2];
                let x = [], y = dy(35);
                x[2] = m;
                let idx = [[1, 3], [0, 4]];
                let tx = w1 / 2;
                let sss = [ss[1], ss[0]];
                for (let i = 0; i < 2; i++) {
                    let w2 = w1 * sss[i];
                    let is = idx[i];
                    tx += w2 / 2;
                    x[is[0]] = m - tx;
                    x[is[1]] = m + tx;
                    tx += w2 / 2;
                }
                let txx = [8, 4, 0, -4, -8];
                let sizeX = [];
                for (let i = 0; i < 5; i++) {
                    let j = sx[i];
                    let ss = s[j];
                    let w2 = dx(w1) * ss, h2 = h1 * (ss + 0.1);
                    sizeX[j] = w2;
                    if (strs[j] == undefined) continue;
                    if (i == 4) h2 = h1;
                    let x1 = dx(x[j] + txx[j]) + dn * dir[j][0], y1 = y + dn * dir[j][1];
                    g.setColor(new Color(colors[j]));
                    let r = h2 * 0.1;
                    g.fillRoundRect(x1 - w2 / 2, y1 - h2 / 2, w2, h2, r, r);
                    g.setColor(new Color(icolor1));
                    if(i == 4) {
                        let x = x1 - w2 * 0.35, y = y1 - h2 * 0.04;
                        let font = font0.deriveFont(Font.PLAIN, h2 * 0.13);
                        drawMiddle(g, "下一站", font, x, y);
                        font = font0.deriveFont(Font.PLAIN, h2 * 0.06);
                        y += h2 * 0.1;
                        drawMiddle(g, "Next Station", font, x, y);
                        x = x1 + w1 * 0.48;
                        y = y1;
                        font = font0.deriveFont(Font.BOLD, h2 * 0.23);
                        drawMiddle(g, strs[j][0], font, x, y);
                        font = font0.deriveFont(Font.BOLD, h2 * 0.12);
                        drawMiddle(g, strs[j][1], font, x, y + h2 * 0.2);
                    } else {
                        let font = font0.deriveFont(Font.BOLD, h2 * 0.25);
                        drawMiddle(g, strs[j][0], font, x1, y1);
                        font = font0.deriveFont(Font.BOLD, h2 * 0.14);
                        drawMiddle(g, strs[j][1], font, x1, y1 + h2 * 0.2);
                    }
                }
                let scale = dy(8) / 100;
                let wx = 100 * scale;
                let ys = [dy(20), 0, dy(17), 0, dy(20)];
                for (let i = 0; i < 5; i+=2) {
                    let v = smooth(1, ((now() / 1000) * 0.8) % 1);
                    let xx = dx(x[i] + txx[i]) - sizeX[i] / 2 + wx / 2 + v * (sizeX[i] - wx);
                    let canvas = Canvas.createWithCenterAndScale(g, xx, ys[i], scale, 100, 100, 1 - a, [0x00ff00, icolor]);
                    jt(canvas);
                }
                return false;
            }
            DR0.id = "DR0";

            let DStyle = 0;// 运行时的样式组合
            let DS = [DR0];// 运行时的样式列表
            let DTime = -15000;

            const ctrl = () => {
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open] = info;
                let newOpen = open > 0 ? 1 : 0;
                let newValue = smooth(1, newOpen * train.doorValue() * 3 * isArrive);
                let need = false;
                if (newValue < 1) {
                    outAlpha.set(0, 0);
                }else {
                    if (outAlpha.dir() == 0) outAlpha.set(0, 1);
                    need = true;
                }

                if (doorOpen != newOpen || doorValue != newValue) {
                    doorOpen = newOpen;
                    doorValue = newValue;
                    need = true;
                }

                if (isArrive || !isOnRoute()) {
                    DStyle = 0;
                    DTime = 0;
                    addDrawCallD(() => true);
                } else if (DTime + 8000 < now()){
                    DTime = now();
                    DStyle = (DStyle + 1) % DS.length;
                    addDrawCallD(DS[0]);
                }
                if (DDrawCalls.length > 0) need = true;
                return need;
            }

            let first = true;
            while (state.running && state.lastTime + 60000 > now()) {
                try {
                    if (first) {
                        info = getInfo();
                        addDrawCallS(SGround);
                        needUpload = true;
                        mainAlpha.set(isOnRoute() ? 1 : 0, 0);
                        first = false;
                    }
                    startTime = now();

                    if (info.toString() != getInfo().toString() && isOnRoute()) {
                        info = getInfo();
                        addDrawCallS(SGround);
                        needUpload = true;
                    }
                    mainAlpha.update();
                    if (mainAlpha.get() == 1 && !isOnRoute()) mainAlpha.turn(-1);
                    else if (mainAlpha.get() == 0 && isOnRoute()) mainAlpha.turn(1);
                    if (mainAlpha.isChanged()) needUpload = true;

                    needUpload = needUpload || ctrl();
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

                        if (mainAlpha.get() == 1) {
                            let g = tex.graphics;
                            setComp(g, 1);
                            g.drawImage(img0, 0, 0, null);
                            DA0(g);
                            for (let i = 0; i < DDrawCalls.length; i++) {
                                let [fun, st, et, dis] = DDrawCalls[i];
                                if (dis) continue;
                                DDrawCalls[i][3] = fun(g, st, et);
                            }
                        } else {
                            let g = tex.graphics;
                            setComp(g1, 1);
                            g1.drawImage(img0, 0, 0, null);
                            DA0(g1);
                            for (let i = 0; i < DDrawCalls.length; i++) {
                                let [fun, st, et, dis] = DDrawCalls[i];
                                if (dis) continue;
                                DDrawCalls[i][3] = fun(g1, st, et);
                            }
                            setComp(g, 1);
                            g.setColor(new Color(0));
                            g.fillRect(0, 0, w, h);
                            setComp(g, smooth(1, mainAlpha.get()));
                            g.drawImage(img1, 0, 0, null);
                        }
                        let ka = DDrawCalls.length
                        let newDDC = [];
                        for (let e of DDrawCalls) {
                            if (e[3] == false) newDDC.push(e);
                        }
                        DDrawCalls = newDDC;
                        tex.upload();
                        needUpload = false;
                    }

                    lastFrameTime = now() - startTime;
                    ctx.setDebugInfo(uid +  "  Used: ", lastFrameTime + "ms");
                    lastFrameTime = now() - startTime;
                } catch (e) {
                    ctx.setDebugInfo(uid + " Error At: ", now().toString(), e.message, e.stack);
                    print(uid + " Error At: " + now() + "     " + e.message + "      " + e.stack);
                    Thread.sleep(100);
                }
            }
            print(uid + " Exit");
        } catch (e) {
            ctx.setDebugInfo(uid +  " Error At: ", System.currentTimeMillis() + e.message , e.stack);
            print(uid + " Error At: " + System.currentTimeMillis() + e.message + e.stack);
        } finally {
            for (let fun of disposeList) {
                fun();
            }
        }
    } , "ARAF-LCD-Thread On Train " + ctx.hashCode() + " " + carIndex + " " + (isRight? "Right" : "Left"));
    return thread;
}