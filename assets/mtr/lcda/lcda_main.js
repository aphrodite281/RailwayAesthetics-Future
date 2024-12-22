/**
 * @author: Aphrodite281 QQ: 3435494979
 */

importPackage(java.lang);
importPackage(java.awt);
importPackage(java.awt.image);
importPackage(java.awt.geom);
importPackage(java.awt.font);
importPackage(java.util.concurrent);

include(Resources.id("aphrodite:library/code/model/face.js"));
include(Resources.id("aphrodite:library/code/util/text_u.js"));
include(Resources.id("aphrodite:library/code/util/map_tostring.js"));
include(Resources.id("aphrodite:library/code/util/array_tostring.js"));
include(Resources.id("aphrodite:library/code/util/value.js"));
include(Resources.id("aphrodite:library/code/graphic/color_u.js"));
include(Resources.id("aphrodite:library/code/graphic/text_manager.js"));
include(Resources.id("aphrodite:library/code/graphic/canvas.js"));
include(Resources.id("aphrodite:library/code/graphic/upload_manager.js"));
include(Resources.id("mtr:lcda/icon/hc.js")); //换乘
include(Resources.id("mtr:lcda/icon/zd.js")); //站点
include(Resources.id("mtr:lcda/icon/bz.js")); //爆炸
include(Resources.id("mtr:lcda/icon/xr.js")); //小人
include(Resources.id("mtr:lcda/icon/zwfh.js")); //站稳扶好
include(Resources.id("mtr:lcda/icon/jt.js")); //箭头
include(Resources.id("mtr:lcda/icon/hcjt.js")); //换成箭头
include(Resources.id("mtr:lcda/icon/xjjt.js")); //行进箭头
include(Resources.id("mtr:lcda/icon/logo.js")); //图标

let defaultScreenTextureSize = [1600, 350];
let defaultScreenModelSize = [1600 / 2000, 350 / 2000];

let textureSize = defaultScreenTextureSize;
let modelSize = defaultScreenModelSize;
let doorZPositions = [0, 5, -5, 10, -10];
let doorPosition = [1.3, 1.9];// x、y
let rotateX = 15 / 180 * Math.PI;// YX(Z)欧拉的X
let rightMatrices = getMatrices(false);
let leftMatrices = getMatrices(true);

let fontA = Resources.getSystemFont("Noto Sans");
let fontB = Resources.readFont(Resources.id("aphrodite:library/font/zhdh.ttf"));
let fontC = Resources.getSystemFont("Noto Serif");
let cu = ColorU;

function create(ctx, state, train) {
    state.running = true;
    state.lastTime = Date.now();
    let infoArray = [];
    let tickList = [];
    let disposeList = [];
    let first = true;
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
    
        let rightThread = new LCDThread(rightFace, true, ctx, state, train, i + 1, first);
        first = false;
        let leftThread = new LCDThread(leftFace, false, ctx, state, train, i + 1);

        let sr = () => {
            if(!rightThread.isAlive()) rightThread.start();
        };
        let sl = () => {
            if(!leftThread.isAlive()) leftThread.start();
        };
        sr(); sl();
        tickList.push(() => {rightFace.tick(); leftFace.tick();});
        disposeList.push(() => {rightFace.close(); leftFace.close();});
        infoArray.push([rightFace, leftFace, rightThread, leftThread]);
    }
    state.tickList = tickList;
    state.infoArray = infoArray;
    state.disposeList = disposeList;
}

let model = ModelManager.uploadVertArrays(ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/main.obj"), null));

let acc = Date.now();

function render(ctx, state, train) {
    state.lastTime = Date.now();
    for (let entry of state.tickList) {
        entry();
    }
    ctx.setDebugInfo("mc", model.getClass());
}

function dispose(ctx, state, train) {
    state.running = false;
    state.lastTime = -10000;
    for (let entry of state.disposeList) {
        entry();
    }
}

function getMatrices(isRight) {
    let result = [];
    let matrices = new Matrices();
    let k = isRight? -1 : 1;
    matrices.translate(- k * doorPosition[0], doorPosition[1], 0);
    let execute = (translateZ) => {
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

let smooth = (k, value) => {// 平滑变化
    if (value > k) return k;
    if (k < 0) return 0;
    return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
}

/* let route0 = [];
{
    let getColor = (color) => {
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

function LCDThread(face, isRight, ctx, state, train, carIndex, ttf) {
    let uid = "LCDThread-" + "Car" + carIndex + '-' + (isRight ? "Right " : "Left  ");;
    let thread = new Thread(() => {
        let disposeList = [];
        try {
            print(uid + " Start");
            ctx.setDebugInfo(uid + " Start", PlacementOrder.DOWNSIDE, Date.now().toString());

            let tf = ttf;
            let font0 = fontA.deriveFont(Font.PLAIN, 45);
            let font1 = fontB.deriveFont(Font.PLAIN, 45);
            let font2 = fontC.deriveFont(Font.PLAIN, 45);
            
            let tex = face.texture;
            let uploadManager = new UploadManager(tex);
            let upload = uploadManager.upload;
            let w = tex.width, h = tex.height;
            disposeList.push(() => {
                uploadManager.dispose();
            });

            let planPool = Executors.newScheduledThreadPool(4);
            let plan = (fun, time) => planPool.schedule(new Runnable({run: fun}), time, TimeUnit.MILLISECONDS);
            disposeList.push(() => planPool.shutdown());

            let now = () => Date.now();
            let SDrawCalls = [];// [旧图, [新渐变的, 新alpha]] 渐变绘制
            let DDrawCalls = [];// [对象1, 对象2] 动态绘制
            let mainAlpha = new Value(0, 1, 0, 1.2, 0, 0);// 主渐变alpha
            let info = [-1];// 信息
            // let fps = 24;// 帧率
            // let frameTime = 1000 / fps;// 帧时间
            let outAlpha = new Value(0, 1, 0, 1.5, -1, 2);// 门里的指示的透明度
            var icolor, icolor1, icdest, icname, iename, itime0, itime1, iis, it1, it2, it3, it4, iisArrive, iopen, ihuancheng = new Map(), ixlt0 = [], ixlt1 = [];// info 数据
            let DStyle = 0;
            
            /**
             * 添加动态绘制
             * @param {Object} obj 绘制对象
             */
            let addDrawCallD = (obj) => {
                for (let object of DDrawCalls) object.stop();
                if (obj != undefined) DDrawCalls.push(obj);
            }

            /**
             * 删除已经结束的动态绘制
             */
            let refreshD = () => {
                let newDDC = [];
                for (let obj of DDrawCalls) {
                    if (obj.isStopped(now() - 1000)) obj.dispose();
                    else newDDC.push(obj); 
                }
                DDrawCalls = newDDC;
            }

            let refreshS = () => {
                if (SDrawCalls.length > 1) {
                    if (SDrawCalls[SDrawCalls.length - 1].isFull()) {
                        for (let i = 0; i < SDrawCalls.length - 1; i++) SDrawCalls[i].dispose();
                        SDrawCalls = [SDrawCalls[SDrawCalls.length - 1]];
                    }
                }
            }

            /**
             * 添加静态绘制
             * @param {Object} obj 绘制对象
             */
            let addDrawCallS = (obj) => {
                SDrawCalls.push(obj);
            }

            let getInfo = () => {// 获取/更新信息，并通过toString方法判断是否应该更新
                let color = 0x00ffff, color1 = 0xffffff, cname = "无线路", ename = "No Route", cdest = "无线路", edest = "No Route", time0 , time1, is = true, t1 = "非运营列车  Non-operating train", t2 = "", t3 = "", t4 = "", isArrive = false, open = -1, huancheng = new Map(), xlt0 = [], xlt1 = [];
                let date = new Date();
                let year = date.getFullYear();
                let month = (date.getMonth() + 1).toString().padStart(2, '0');
                let day = date.getDate().toString().padStart(2, '0');
                let hour = date.getHours().toString().padStart(2, '0');
                let minute = date.getMinutes().toString().padStart(2, '0');
                time0 = year + "-" + month + "-" + day;
                time1 = hour + ":" + minute;
                let getColor = (color) => {
                    let rr = color >> 16 & 0xff;
                    let g = color >> 8 & 0xff;
                    let b = color & 0xff;
                    let luminance  = 0.299 * rr + 0.587 * g + 0.114 * b;
                    return luminance > 255 / 2 ? 0 : 0xffffff;
                }
                while(1) {
                    let plas = train.getThisRoutePlatforms();
                    let ind = train.getThisRoutePlatformsNextIndex();
                    if (plas.length == 0) break;
                    if (plas == null) break;
                    if (plas.length <= ind) break;
                    if (ind < 0) break;
                    let pla = plas[ind];
                    let station = pla.destinationStation;
                    let ss = () => {
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

                    if (isOnRoute()) {
                        for (let i = 0; i < plas.length; i++) {
                            let pla = plas[i];
                            let station = pla.station;
                            let plass = dataCache.requestStationIdToPlatforms(station.id);
                            let huan = new Map();
                            for (let [id, platform] of plass) {
                                for (let route of MTRClientData.ROUTES) {
                                    if (route.isHidden) continue;
                                    if (route.containsPlatformId(id)) {
                                        let name = route.name;
                                        let color = route.color;
                                        huan.set(TU.CP(name) + "|" + TU.NP(name), [TU.CP(name), TU.NP(name), color, getColor(color)]);
                                        continue;
                                    }
                                }
                                huan.delete(TU.CP(route.name) + "|" + TU.NP(route.name));
                            }
                            let name = station.name;
                            xlt1.push([TU.CP(name), TU.NP(name), huan, ind > i ? true : false]);
                        }
                    }
                    break;
                }
                color1 = getColor(color);
                icolor = color, icolor1 = color1, icname = cname, iename = ename, icdest = cdest, idest = edest, itime0 = time0, itime1 = time1, iis = is, it1 = t1, it2 = t2, it3 = t3, it4 = t4, iisArrive = isArrive, iopen = open, ihuancheng = huancheng, ixlt0 = xlt0, ixlt1 = xlt1;
                return [color, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open, huancheng, xlt0, DStyle, xlt1];
            }

            let setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
            let isOnRoute = () => train.isOnRoute();
            let getWH = (g, str, font) => {
                g.setFont(font);
                // let frc = g.getFontRenderContext();
                // bounds = font.getStringBounds(str, frc);
                // let width = bounds.getWidth(), height = bounds.getHeight();
                let fm = g.getFontMetrics(font);
                let width = fm.stringWidth(str), height = fm.getHeight();
                return [width, height];
            }

            let drawMiddle = (g, str, font, x, y) => {
                let [ww, hh] = getWH(g, str, font);
                g.drawString(str, x - ww / 2, y);
            }

            let drawMiddle0 = drawMiddle;// 防重名

            function S1() {
                let isArrive = iisArrive;
                let w0 = w * 110 / 500, h0 = h * 0.75;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();

                if (isArrive) {
                    let dx = (v) => w0 * v;
                    let dy = (v) => h0 * v;
                    let ox = 0.28, oy = 0.43, sx = 0.6, sy = 0.6, wi = 1100, hi = 900;
                    let fx = (v) => dx(sx * v / wi + ox);
                    let fy = (v) => dy(sy * v / hi + oy);
    
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
                    drawMiddle(g, isArrive ? "请小心站台间隙" : "请站稳扶好", font, dx(0.5), dy(0.88));
                    font = font0.deriveFont(Font.PLAIN, dy(0.04));
                    drawMiddle(g, isArrive ? "Please mind the gap" : "Please stand firm and hold yourself steady", font, dx(0.5), dy(0.96));
                } else {
                    let dx = (ax) => w0 * ax;
                    let dy = (ay) => h0 * ay;
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
                }
                
                g.dispose();

                this.img = () => img;
                this.draw = (g, x, y) => {};
                this.dispose = () => {};
            }
            
            function S2() {
                let isArrive = iisArrive;
                let w0 = w * 110 / 500, h0 = h * 0.75;
                let img = new BufferedImage(w0, h0, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                let textManager = new TextManager.Buffered(w0, h0);
                let drawMiddle = textManager.drawMiddle;
                let dx = (ax) => w0 * ax / 440;
                let dy = (ay) => h0 * ay / 375;
                g.setColor(new Color(0xefefef));
                let ww = h0 * 0.1;
                g.fillRoundRect(0, 0, w0, h0, ww, ww);
                let scale = dy(80) / 52, x = dx(120), y = dy(70);
                let canvas = Canvas.createWithCenterAndScale(g, x, y, scale, 52, 52);
                hc(canvas, g, ctx);
                let p = Font.PLAIN;
                drawMiddle("可 换 乘", font0, p, 0xa0a0a0, dx(280), dy(51), dx(300), dy(65));
                drawMiddle("Transfer To", font0, p, 0xa0a0a0, dx(280), dy(105), dx(300), dy(40));

                let draw = (x, y, w1, h1, color0, color1, c, n) => {
                    g.setColor(new Color(color0));
                    g.fillRoundRect(x, y, w1, h1, dy(10), dy(10));
                    drawMiddle(c, font0, p, color1, x + w1 / 2, y + h1 * 0.3, w1, h1 * 0.55);
                    drawMiddle(n, font0, p, color1, x + w1 / 2, y + h1 * 0.8, w1, h1 * 0.35);
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
                drawMiddle(isArrive ? "请小心站台间隙" : "请站稳扶好", font0, p, 0, dx(220), dy(300), w0, dy(40));
                drawMiddle(isArrive ? "Please mind the gap" : "Please stand firm and hold yourself steady", font0, p, 0, dx(220), dy(340), w0, dy(25));
                g.dispose();
                
                this.img = () => img;
                this.draw = (g, x, y, time) => {
                    textManager.draw(g, x, y, time);
                }

                this.dispose = () => plan(() => textManager.dispose(), 2000);
            }

            function SGround() {
                let start = now();
                let fill = (g, width, x1, y1, x2, y2) => {
                    g.fillRoundRect(x1 - width / 2, y1 - width / 2, x2 - x1 + width, y2 - y1 + width, width, width);
                }
                let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                let g = tex.createGraphics();
                let textManager = new TextManager.Buffered(w, h);
                let drawMiddle = textManager.drawMiddle;
                let p = Font.PLAIN;
                let [color0, color1, cname, ename, cdest, edest, time0, time1, is, t1, t2, t3, t4, isArrive, open] = info;
                let dx = (ax) => w * ax / 500;
                let dy = (ay) => h * ay;
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
                let dy1 = (ay) => h1 * ay;
                let dy2 = (ay) => y1 * ay;
                g.fillRoundRect(x, y, w1, h1, w1 * 0.1, w1 * 0.1);
                x = (x + x1) / 2;
                drawMiddle(cname, font0, p, color1, x, y + dy1(0.3), w1, dy1(0.55));
                drawMiddle(ename, font0, p, color1, x, y + dy1(0.725), w1, dy1(0.35));

                x = w * 5 / 500, w1 = h1;
                let canvas = Canvas.createWithCenterAndScale(g, x + w1 / 2, y + h1 / 2, w1 / 2500, 2500, 2500);
                logo(canvas);
                x = dx(52);
                drawMiddle("北武工艺", font0, p, 0, x, dy2(0.35), dx(58), dy2(0.5));
                drawMiddle("HOKUBUCRAFT", font0, p, 0, x, dy2(0.75), dx(58), dy2(0.3));

                let color = 0x606060;
                drawMiddle(" 终 点 站:", font0, p, color, dx(340), dy2(0.33), dx(40), dy2(0.45));
                drawMiddle("Terminus", font0, p, color, dx(340), dy2(0.7), dx(40), dy2(0.3));
                color = 0;
                drawMiddle(cdest, font0, p, color, dx(385), dy2(0.4), dx(48), dy2(0.55));
                drawMiddle(edest, font0, p, color, dx(385), dy2(0.8), dx(48), dy2(0.3));

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
                drawMiddle0(g, carIndex, font, x, y);
                k = y1 * 0.35;
                font = font0.deriveFont(Font.PLAIN, k);
                x = x1 + w1 / 2 - wh[0] / 2, y = y1 * 0.5;
                drawMiddle0(g, "车厢", font, x, y);
                k = y1 * 0.23;
                font = font0.deriveFont(Font.PLAIN, k);
                y = y1 * 0.78;
                drawMiddle0(g, "Car " + carIndex, font, x, y);

                g.setColor(new Color(0));
                x = w * (450 + 500) / 2 / 500;
                y = y1 * 0.37;
                k = y1 * 0.3;
                font = font0.deriveFont(Font.PLAIN, k);
                drawMiddle0(g, time0, font, x, y);
                y = y1 * 0.83;
                k = y1 * 0.5;
                font = font0.deriveFont(Font.PLAIN, k);
                drawMiddle0(g, time1, font, x, y);

                g.setColor(new Color(0x606060));
                if (is) {
                    x = w * (120 + 320) / 2 / 500;
                    y = y1 * 0.7;
                    k = y1 * 0.5;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle0(g, t1, font, x, y);
                } else {
                    x = w * 145 / 500, y = y1 * 0.5;
                    k = y1 * 0.35;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle0(g, t1, font, x, y);
                    y = y1 * 0.85;
                    k = y1 * 0.25;
                    font = font0.deriveFont(Font.PLAIN, k);
                    drawMiddle0(g, t2, font, x, y);
                    
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
                drawMiddle0(g, str, font, x, y);
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
                drawMiddle0(g, str, font, x, y);

                if (isArrive) {
                    g.setColor(new Color(color0));
                    str = "到达 " + t3;
                    k = h * 0.2;
                    font = font0.deriveFont(Font.BOLD, k);
                    x = w * (120 + 320) / 2 / 500, y = h * 0.6;
                    drawMiddle0(g, str, font, x, y);
                    str = "Arrived: " + t4;
                    k = h * 0.1;
                    font = font0.deriveFont(Font.PLAIN, k);
                    y = h * 0.75;
                    drawMiddle0(g, str, font, x, y);
                    
                    g.setColor(new Color(0xe0e0e0));
                    
                } else {
                    // acc = -1000;
                }
                let tp = ihuancheng.size > 0 ? new S2() : new S1();
                x = w * (500 - 110 - 4) / 500, y = h * 0.23;
                let style = DStyle;
                if (style == 0) g.drawImage(tp.img(), x, y, null);
                g.dispose();
                let disposed = false;

                this.stop = () => {if(et == null) et = now();};
                this.draw = (g, time) => {
                    if (disposed) return;
                    setComp(g, smooth(1, (time - start) / 1000 * 0.8));
                    g.drawImage(tex, 0, 0, null);
                    textManager.draw(g, 0, 0);
                    if (style == 0) tp.draw(g, x, y);
                }
                
                this.isFull = () => (now() - start) / 1000 * 0.8 >= 1;

                this.dispose = () => {
                    disposed = true;
                    plan(() => {
                        textManager.dispose(); 
                        tp.dispose();
                    }, 2000);
                };
                this.toString = () => "SGround";
            }

            let d = [];
            let dWidth = w * 18 / 500 * 1.1;
            let drawDoor = () => {
                let x0 = 0, y0 = h * 0.4, w0 = dWidth, h0 = h * 0.4;
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
                w1 = dWidth, h1 = h * 0.4, ww = w1 * 0.3;
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

            let out = [];
            let drawOut = (isFill) => {
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
            let outWidth = w * 30 / 500;
            let DA0 = (g) => {
                let dop = iopen > 0 ? 1 : 0;
                let dv = smooth(1, iopen * train.doorValue() * 3 * iisArrive);
                setComp(g, 1);
                let x = w * 45 / 500, y = h * (0.7 - 0.4);
                let v = dv;
                let tx = v * w * 15 / 500;
                g.drawImage(d[0], x + tx, y, null);
                g.drawImage(d[1], x - dWidth - tx, y, null);
                if (dop == false) {
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
            
            function DR0() {
                let st = now();
                let et = null;
                let stopped = false;
                
                this.stop = () => {
                    if (et == null) et = now();
                }
                
                this.isStopped = () => stopped;

                let dx = ax => ax * w / 500;
                let dy = ay => ay * h / 50; 
                // let kf = num => Math.sqrt(num);
                // let dir = [[-1, 0], [-1 / kf(2), -1 / kf(2)], [0, -1], [1 / kf(2), -1 / kf(2)], [1, 0]];
                let dir = [[-0.5, 0], [-1.2, 0], [0, -1], [1.2, 0], [0.5, 0]];
                let strs = ixlt0;
                let hsv = cu.h2v(icolor);
                let f = k => {
                    let hs = new HSV(hsv);
                    hs.s *= k;
                    return cu.v2h(hs);
                }
                let colors = [f(0.1), f(0.2), cu.v2h(hsv), f(0.8), f(0.5)];
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
                let p = Font.PLAIN;
                let b = Font.BOLD;
                let color = icolor1;

                let disposed = false;

                this.draw = (g, time) => {
                    if (disposed) return;
                    let t = time - st;
                    t = t / 1000 * 0.8;
                    let a = 1 - smooth(1, t);
                    if (et != null) {
                        let t1 = time - et;
                        t1 = t1 / 1000 * 0.8;
                        let a1 = smooth(1, t1);
                        a = Math.max(a, a1);
                    }
                    let dn = a * dx(100);
                    setComp(g, 1 - a);
                    if (et != null && a == 1) stopped = true;
                    if (strs.length == 0) {
                        g.setColor(new Color(0));
                        drawMiddle0(g, "暂无信息", font0.deriveFont(Font.PLAIN, h * 0.3), dx(220) - dn, h * 0.6);
                        drawMiddle0(g, "No Information", font0.deriveFont(Font.PLAIN, h * 0.1), dx(220) + dn, h * 0.8);
                        textManager.draw(g, 0, 0);
                        return;
                    }
                    let textManager = new TextManager.Buffered(w, h);
                    let drawMiddle = textManager.drawMiddle;
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
                        if(i == 4) {
                            g.setColor(new Color(color));
                            let x = x1 - w2 * 0.35, y = y1 - h2 * 0.04;
                            let font = font0.deriveFont(Font.PLAIN, h2 * 0.13);
                            drawMiddle0(g, "下一站", font, x, y);
                            font = font0.deriveFont(Font.PLAIN, h2 * 0.06);
                            y += h2 * 0.1;
                            drawMiddle0(g, "Next Station", font, x, y);
                            x = x1 + w1 * 0.42;
                            y = y1;
                            drawMiddle(strs[j][0], font0, b, color, x, y - h2 * 0.25 / 2, w2 * 0.73, h2 * 0.36, 0);
                            drawMiddle(strs[j][1], font0, b, color, x, y + h2 * 0.15, w2 * 0.73, h2 * 0.2, 0);
                        } else {
                            drawMiddle(strs[j][0], font0, b, color, x1, y - h2 * 0.1, w2 * 0.8, h2 * 0.35, 0);
                            drawMiddle(strs[j][1], font0, b, color, x1, y1 + h2 * 0.25 - h2 * 0.07, w2 * 0.8, h2 * 0.2, 0);
                        }
                    }
                    let scale = dy(8) / 100;
                    let wx = 100 * scale;
                    let ys = [dy(20), 0, dy(17), 0, dy(20)];
                    for (let i = 0; i < 5; i+=2) {
                        let v = smooth(1, ((time / 1000) * 0.8) % 1);
                        let xx = dx(x[i] + txx[i]) - sizeX[i] / 2 + wx / 2 + v * (sizeX[i] - wx);
                        let canvas = Canvas.createWithCenterAndScale(g, xx, ys[i], scale, 100, 100, 1 - a, [0x00ff00, icolor]);
                        jt(canvas);
                    }
                    textManager.draw(g, 0, 0);
                    textManager.dispose();
                    return;
                }

                this.dispose = () => {
                    disposed = true;
                }
                this.toString = () => "DR0";
            }

            function DR1() {
                let xlt1 = ixlt1;
                let ind = train.getThisRoutePlatformsNextIndex();
                let dx = (ax) => ax * w / 500;
                let dy = (ay) => ay * h / 50;
                let hex = icolor;
                let color11 = icolor1;
                let hsv = cu.h2v(hex);
                hsv.s *= 0.6;
                let color = cu.v2h(hsv);
                hsv.s *= 0.2;
                let color1 = cu.v2h(hsv);
                let stopped = false;
                let st = now();
                let et = null;
                let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                let g = img.createGraphics();
                let textManager = new TextManager.Buffered(w, h);
                let drawMiddle = textManager.drawMiddle;
                let p = Font.PLAIN;
                let b = Font.BOLD;

                let l = xlt1.length;
                let xd = dx(280);
                let ins = (dx(440) - xd) * 2 / l;
                ins = Math.min(ins, dy(30));
                let wa = ins * (l - 1);
                let x = xd - wa / 2;
                let y0 = dy(28), h0 = dy(4);
                let rx;
                let newcm = () => new Canvas.Mobile(g, x, y0, h0 * 2 / 3, h0 * 2 / 3, 52, 52, 1, [0x00ff00, color11]);
                let cm = newcm();
                let kw = 0.9;
                let jnum = (ins - dy(7)) / (cm.w * kw);
                jnum *= 0.6;
                jnum = Math.ceil(jnum);
                let aw = (jnum - 1) * cm.w * kw;
                
                for (let i = 0; i < l; i++) {
                    let [cn, en, huan, guo] = xlt1[i];
                    if (i != l - 1) {
                        g.setColor(new Color(guo? color1 : color));
                        g.fillRect(x, y0 - h0 / 2, ins, h0);
                        
                        if (i == ind - 1) {
                            rx = x;
                        } else {
                            cm.x = x + (ins - aw) / 2;
                            for (let i = 0; i < jnum; i++) {
                                xjjt(cm);
                                cm.x += cm.w * kw;
                            } 
                        }
                    }

                    let array = [];
                    for (let [key, value] of huan) {
                        array.push(value);
                    }
                    array.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
                    let ll = array.length;
                    if (ll != 0) {
                        let es = "可换乘 ";
                        let ns = "Transfer To ";
                        let w1 = dy(3);
                        let h1 = dy(6);
                        let lx = x - w1 / 2;
                        let lw = w1 / ll;
                        let canvas = new Canvas.Mobile(g, x, y0 + dy(3), dy(3), dy(6), 52, 52, 1);
                        for (let [cna, ena, col] of array) {
                            es += cna + ' / ';
                            ns += ena + ' / ';
                            g.setClip(new Rectangle2D.Float(lx, y0, lw, y0 + h1));
                            lx += lw;
                            canvas.colorMap = Canvas.standardizationColorMap([0x00ff00, col]);
                            hcjt(canvas);
                        }
                        g.setClip(null);
                        es = es.slice(0, -2);
                        ns = ns.slice(0, -2);
                        drawMiddle(es, font0, p, 0, x, y0 + dy(8), ins * 0.8, dy(3));
                        drawMiddle(ns, font0, p, 0, x, y0 + dy(11), ins * 0.8, dy(2));
                    }

                    let canvas = Canvas.createWithCenterAndScale(g, x, y0, dy(5) / 52, 52, 52);
                    if (ll == 0) zd(canvas);
                    else hc(canvas);
                    drawMiddle(cn, font0, p, 0, x, y0 - dy(8), ins * 0.8, dy(5));
                    drawMiddle(en, font0, p, 0, x, y0 - dy(4), ins * 0.8, dy(3));
                    x += ins;
                }
                g.dispose();

                let disposed = false;

                this.draw = (g, time) => {
                    if (disposed) return;
                    let t = time - st;
                    t = t / 1000 * 0.8;
                    let a = 1 - smooth(1, t);
                    if (et != null) {
                        let t1 = time - et;
                        t1 = t1 / 1000 * 0.8;
                        let a1 = smooth(1, t1);
                        a = Math.max(a, a1);
                        if (a == 1) {
                            stopped = true;
                            return;
                        }
                    }
                    setComp(g, 1 - a);
                    if (xlt1.length == 0) {
                        g.setColor(new Color(0));
                        let dn = a * dy(20);
                        drawMiddle0(g, "暂无信息", font0.deriveFont(Font.PLAIN, h * 0.3), dx(220), h * 0.6 - dn);
                        drawMiddle0(g, "No Information", font0.deriveFont(Font.PLAIN, h * 0.1), dx(220), h * 0.8 + dn);
                        textManager.draw(g, 0, 0);
                        return;
                    }
                    g.drawImage(img, 0, 0, null);
                    textManager.draw(g, 0, 0);
                    let ta = ((now() - st) / 1000) % 1;
                    ta = smooth(1, ta);
                    ta = ta * (ins - aw - dy(7));
                    let x = rx + dy(4) + ta;
                    let cm = new Canvas.Mobile(g, x, y0, h0 * 2 / 3, h0 * 2 / 3, 52, 52, 1 - a, [0x00ff00, color11]);
                    for (let i = 0; i < jnum; i++) {
                        xjjt(cm);
                        cm.x += cm.w * kw;
                    }
                }

                this.dispose = () => {
                    disposed = true;
                    plan(() => {
                        textManager.dispose();
                    }, 2000);
                }

                this.isStopped = () => stopped;
                this.stop = () => {
                    if (et == null) et = now();
                }
                this.toString = () => "DR1";
            }

            let DS = [DR0, DR1];// 运行时的样式列表
            let DTime = -15000;
            let ctrlUsed;

            let ctrlPool = Executors.newScheduledThreadPool(1);
            disposeList.push(() => ctrlPool.shutdown());

            let ctrl = new Runnable({run: () => {
                try {
                    let start = now();
                    if (iisArrive || !isOnRoute()) {
                        DStyle = 0;
                        DTime = -100000;
                        addDrawCallD();
                    } else if (DTime + 5000 < now()){
                        if (DTime >= 0) {
                            DStyle = (DStyle + 1) % (DS.length);
                        }
                        addDrawCallD(new DS[DStyle]());
                        DTime = now();
                    }
    
                    let newInfo = getInfo();
                        if (info.toString() != newInfo.toString() && isOnRoute()) {
                            info = newInfo;
                            addDrawCallS(new SGround());
                    }
    
                    refreshS();
                    refreshD();
    
                    ctrlUsed = now() - start;
                } catch (e) {
                    ctx.setDebugInfo("Error", e.message, e.stack);
                }
            }});
            ctrl.run();
            ctrlPool.scheduleWithFixedDelay(ctrl, 0, 100, TimeUnit.MILLISECONDS);

            let submitPool = Executors.newScheduledThreadPool(2);
            let uoloadPool = Executors.newScheduledThreadPool(4);
            let executor = Executors.newFixedThreadPool(10);
            disposeList.push(() => submitPool.shutdown());
            disposeList.push(() => uoloadPool.shutdown());
            disposeList.push(() => executor.shutdown());
            let lastStart;
            let timeoutTimes = 0;

            let draw = new Runnable({run: () => {
                try {
                    let fps = -100;
                    if (lastStart != undefined) fps = 1000 / (now() - lastStart);
                    lastStart = now();
                    let used = [];
                    let last = now();
                    let ti = (prompt) => {
                        used.push(prompt + ": " + (now()- last).toString().padStart(2, '0'));
                        last = now();
                    }

                    mainAlpha.update();
                    if (mainAlpha.get() == 1 && !isOnRoute()) mainAlpha.turn(-1);
                    else if (mainAlpha.get() == 0 && isOnRoute()) mainAlpha.turn(1);
                    ti("Update");

                    if (mainAlpha.get() == 0 && !mainAlpha.isChanged()) {
                        ti("Skip Draw");
                    } else {
                        let done = false;
                        let time = now();
                        let a = mainAlpha.get();
                        let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                        let runUpload = new Runnable({run: () => {
                            if (done) upload(img, time);
                            else timeoutTimes++;
                        }});
                        uoloadPool.schedule(runUpload, 400, TimeUnit.MILLISECONDS);// 延迟1000ms执行上传

                        let g;
                        g = img.createGraphics();
                        g.setColor(new Color(0));
                        g.fillRect(0, 0, w, h);
    
                        let sdc = SDrawCalls, ddc = DDrawCalls;
    
                        if (a > 0) {

                            for (let i = 0; i < sdc.length; i++) sdc[i].draw(g, time);

                            DA0(g);

                            for (let i = 0; i < ddc.length; i++) ddc[i].draw(g, time);
    
                            if (a != 1) {
                                setComp(g, 1 - a);
                                g.setColor(new Color(0));
                                g.fillRect(0, 0, w, h);
                            }
                        }
                        g.dispose();
                        done = true;
                        ti("Draw");
                    }
                    used.push("Offside: " + uploadManager.getOffside());
                    let dd = new Date();
                    let ts = dd.getMinutes().toString().padStart(2, '0') + ":" + dd.getSeconds().toString().padStart(2, '0') + "::" + dd.getMilliseconds().toString().padStart(3, '0');
                    ctx.setDebugInfo(uid, ts, "Ctrl: " + ctrlUsed, "FPS:" + fps.toFixed(2).toString().padStart(5, '0'), "\n", 
                    "Pools: " + ["ctrl: " + ctrlPool.getActiveCount() + "/" + ctrlPool.getPoolSize(), "submit: " + submitPool.getActiveCount() + "/" + submitPool.getPoolSize(), "upload: " + uoloadPool.getActiveCount() + "/" + uoloadPool.getPoolSize(), "executor: " + executor.getActiveCount() + "/" + executor.getPoolSize()].toString(), "Timeout: " + timeoutTimes, "\n",
                    "D-Calls:" + DDrawCalls.toString(), "S-Calls:" + SDrawCalls.toString(), "Used: " + used.toString(), "DStyle: " + DStyle); 
                } catch (e) {
                    ctx.setDebugInfo(uid + " Error At: ", now().toString(), e.message, e.stack);
                    print(uid + " Error At: " + now().toString() + "     " + e.message + "      " + e.stack);
                    Thread.sleep(1000);
                }
            }});


            let submit = new Runnable({run: () => executor.submit(draw)});
            submitPool.scheduleAtFixedRate(submit, 0, 1000 / 40, TimeUnit.MILLISECONDS);

            while (state.running && state.lastTime + 60000 > now()) {
                if (tf) {
                    ctx.setDebugInfo(uid + "fps", PlacementOrder.UPSIDE, uploadManager.getAnalyse());
                } else {
                    Thread.sleep(1000);
                }
            }
            ctx.setDebugInfo(uid + "Exit", true);

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