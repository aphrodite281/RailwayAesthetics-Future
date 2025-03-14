/** 
 * 本类仿照html5 canvas的API设计，意在方便绘制矢量图形。
 * 可以使用 Inkscape 软件制作矢量图形，导出为html5文件格式并稍加更改即可使用。
 * 
 * @author Aphrodite281 QQ: 3435494979
 */

importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);

/** 
 * 被包裹的 Graphics2D 上下文
 * 请注意，本类并未实现所有的Html5 Canvas API，仅提供了矢量图形常用的绘制方法。
 * 若非是需要使用由 Inkscape 等软件导出的 .html 文件，请直接使用 Graphics2D 。
 * 
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {Function} fx - 用于转换 x 坐标的函数。
 * @param {Function} fy - 用于转换 y 坐标的函数。
 * @param {Function} fw - 用于转换宽度的函数。
 * @param {Function} fh - 用于转换高度的函数。
 * @param {Function} fl - 用于转换长度的函数。
 * @param {number | Null} alpha - 透明度。(默认为1)
 * @param {Map<number, number> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 */

function Canvas(g, fx, fy, fw, fh, fl, alpha, colorMap) {
    /**
     * @param {Graphics2D} g - 图形上下文对象。
     */
    this.g = g;
    
    /**
     * @param {Function<number, number>} fx - 用于转换 x 坐标的函数。
     */
    this.fx = fx;
    fx = (x) => this.fx(x);

    /**
     * @param {Function<number, number>} fy - 用于转换 y 坐标的函数。
     */
    this.fy = fy;
    fy = (y) => this.fy(y);
    
    /**
     * @param {Function<number, number>} fw - 用于转换宽度的函数。
     */
    this.fw = fw;
    fw = (w) => this.fw(w);

    /**
     * @param {Function<number, number>} fh - 用于转换高度的函数。
     */
    this.fh = fh;
    fh = (h) => this.fh(h);

    /**
     * @param {Function<number, number>} fl - 用于转换粗细的函数。
     */
    this.fl = fl;
    fl = (l) => this.fl(l);

    if (alpha == null) alpha = 1;
    /**
     * @param {number} alpha - 透明度。
     */
    this.alpha = alpha;
    alpha = () => this.alpha;

    colorMap = Canvas.standardizationColorMap(colorMap);
    /**
     * @param {Map<number, number>} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
     */
    this.colorMap = colorMap;
    colorMap = () => this.colorMap;

    let path = new GeneralPath();
    
    /**
     * @param {String} fillStyle - 填充颜色。如 "rgb(255, 255, 255)"。
     */
    this.fillStyle = "rgb(255, 255, 255)";
    
    /**
     * @param {String} strokeStyle - 描边颜色。如 "rgb(0, 0, 0)"。
     */
    this.strokeStyle = "rgb(0, 0, 0)";
    
    /**
     * @param {number} lineWidth - 描边宽度。
     */
    this.lineWidth = 1;

    /**
     * @param {String} lineCap - 线端点样式。"butt"、"round"、"square"。
     */
    this.lineCap = "butt";

    /**
     * @param {String} lineJoin - 线连接样式。"round"、"bevel"、"miter"。
     */
    this.lineJoin = "round";

    /**
     * @param {Font} fontType - 使用的字体。
     */
    this.fontType = Resources.getSystemFont("Noto Sans");

    /**
     * @param {number} fontPattern - 字体样式。如 Font.PLAIN、Font.BOLD、Font.ITALIC。
     */
    this.fontPattern = Font.PLAIN;

    /**
     * @param {String} font - 字体大小。如 "11.45px"。
     */
    this.font = "11.45px";

    const stack = [];
    let transform = new AffineTransform();

    /**
     * 保存当前状态。
     */
    this.save = () => {
        stack.push([this.lineCap, this.lineJoin, this.fillStyle, this.strokeStyle, this.lineWidth, this.font, this.fontPattern, this.fontType, new AffineTransform(transform)]);
    }

    this.save();

    /**
     * 恢复上一次保存的状态。
     */
    this.restore = () => {
        let [lineCap, lineJoin, fillStyle, strokeStyle, lineWidth, font, fontPattern, fontType, oldTransform] = stack.pop();
        this.lineCap = lineCap;
        this.lineJoin = lineJoin;
        this.fillStyle = fillStyle;
        this.strokeStyle = strokeStyle;
        this.lineWidth = lineWidth;
        this.font = font;
        this.fontPattern = fontPattern;
        this.fontType = fontType;
        transform = oldTransform;
        this.g.setTransform(transform);
    }

    /** 
     * @param {number} a - 水平缩放比例。
     * @param {number} b - 水平倾斜比例。
     * @param {number} c - 垂直倾斜比例。
     * @param {number} d - 垂直缩放比例。
     * @param {number} e - 水平平移距离。
     * @param {number} f - 垂直平移距离。
     */
    this.transform = (a, b, c, d, e, f) => {
        transform.scale(a, d);
        transform.shear(b, c);
        transform.translate(fw(e), fh(f));
        this.g.setTransform(transform);
    }

    this.getTransform = () => transform;

    /**
     * 开始路径。
     */
    this.beginPath = () => path = new GeneralPath();

    /**
     * @param {number} x - x 坐标(使用 fx 函数)。
     * @param {number} y - y 坐标(使用 fy 函数)。
     */
    this.moveTo = (x, y) => path.moveTo(fx(x), fy(y));

    /**
     * @param {number} x - 终点的 x 坐标(使用 fx 函数)。
     * @param {number} y - 终点的 y 坐标(使用 fy 函数)。
     */
    this.lineTo = (x, y) => path.lineTo(fx(x), fy(y));

    /**
     * @param {number} x1 - 控制点 1 的 x 坐标(使用 fx 函数)。
     * @param {number} y1 - 控制点 1 的 y 坐标(使用 fy 函数)。
     * @param {number} x2 - 控制点 2 的 x 坐标(使用 fx 函数)。
     * @param {number} y2 - 控制点 2 的 y 坐标(使用 fy 函数)。
     * @param {number} x3 - 终点的 x 坐标(使用 fx 函数)。
     * @param {number} y3 - 终点的 y 坐标(使用 fy 函数)。
     */
    this.bezierCurveTo = (x1, y1, x2, y2, x3, y3) => path.curveTo(fx(x1), fy(y1), fx(x2), fy(y2), fx(x3), fy(y3));

    /**
     * @param {number} x1 - 控制点 1 的 x 坐标(使用 fx 函数)。
     * @param {number} y1 - 控制点 1 的 y 坐标(使用 fy 函数)。
     * @param {number} x2 - 终点的 x 坐标(使用 fx 函数)。
     * @param {number} y2 - 终点的 y 坐标(使用 fy 函数)。
     * @returns 
     */
    this.quadraticCurveTo = (x1, y1, x2, y2) => path.quadTo(fx(x1), fy(y1), fx(x2), fy(y2));

    /**
     * 结束路径。
     */
    this.closePath = () => path.closePath();
    
    const setColor = (str) => {
        let color, r, gr, b;
        try {
            if (str.startsWith("rgb(")) {
                str = str.substring(4, str.length-1);
                let arr = str.split(",");
                r = parseInt(arr[0]), gr = parseInt(arr[1]), b = parseInt(arr[2]);
                this.g.setComposite(AlphaComposite.SrcOver.derive(1 * alpha())); 
            } else if (str.startsWith("rgba(")) {
                str = str.substring(5, str.length-1);
                let arr = str.split(",");
                r = parseInt(arr[0]), gr = parseInt(arr[1]), b = parseInt(arr[2]);
                let a = parseFloat(arr[3]);
                this.g.setComposite(AlphaComposite.SrcOver.derive(a * alpha()));
            } else {
                throw new Error();
            }
        } catch (e) {
            print ("Canvas: invalid color string: " + str + e.message);
            throw new Error("Canvas: invalid color string: " + str + e.message);
        }

        color = r << 16 | gr << 8 | b;
        if (colorMap().has(color)) color = colorMap().get(color);
        this.g.setColor(new Color(color));
    };
    
    /**
     * 填充路径。
     */
    this.fill = () => {setColor(this.fillStyle); this.g.fill(path);};

    /**
     * 描边路径。
     */
    this.stroke = () => {
        let cap, join;
        switch (this.lineCap) {
            case "butt": cap = BasicStroke.CAP_BUTT; break;
            case "round": cap = BasicStroke.CAP_ROUND; break;
            case "square": cap = BasicStroke.CAP_SQUARE; break;
        }
        switch (this.lineJoin) {
            case "round": join = BasicStroke.JOIN_ROUND; break;
            case "bevel": join = BasicStroke.JOIN_BEVEL; break;
            case "miter": join = BasicStroke.JOIN_MITER; break;
        }
        setColor(this.strokeStyle); 
        this.g.setStroke(new BasicStroke(4 * fl(this.lineWidth), cap, join)); 
        this.g.draw(path);
    }

    /**
     * @param {String} text - 要绘制的文本。
     * @param {number} x - 文本左上角的 x 坐标(使用 fx 函数)。
     * @param {number} y - 文本左上角的 y 坐标(使用 fy 函数)。
     */
    this.fillText = (text, x, y) => {
        this.g.setFont(this.font.deriveFont(this.fontPattern, fl(this.font)));
        this.g.setColor(this.fillStyle);
        this.g.drawString(text, fx(x), fy(y));
    }

    /**
     * @param {number} x - 矩形左上角的 x 坐标(使用 fx 函数)。
     * @param {number} y - 矩形左上角的 y 坐标(使用 fy 函数)。
     * @param {number} w - 矩形的宽度(使用 fx 函数)。
     * @param {number} h - 矩形的高度(使用 fy 函数)。
     */
    this.rect = (x, y, w, h) => {setColor(this.fillStyle); this.g.fillRect(fx(x), fy(y), fw(w), fh(h));};
    
    /**
     * 暂时使用填充圆弧代替
     * @param {number} x - 圆心的 x 坐标(使用 fx 函数)。
     * @param {number} y - 圆心的 y 坐标(使用 fy 函数)。
     * @param {number} r - 圆的半径(使用 fl 函数)。
     * @param {number} start - 起始角度。(弧度制);
     * @param {number} end - 终止角度。(弧度制)
     */
    this.arc = (x, y, r, start, end) => {
        // let arc = new Arc2D.Double();
        setColor(this.fillStyle);
        this.g.fillRoundRect(fx(x - r), fy(y - r), fw(2 * r), fh(2 * r), fw(2 * r), fh(2 * r));
        // this.g.fillArc(fx(x - r), fy(y - r), fw(2 * r), fh(2 * r), 0, Math.PI);
        // path.append(arc, true);
    }

    this.toString = () => "Canvas by Aphrodite281: " + this.g.toString();
}

/** 
 * 使用中心点和缩放创建 Canvas 对象。
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {number} x - 绘制中心点的 x 坐标。
 * @param {number} y - 绘制中心点的 y 坐标。
 * @param {number} s - 缩放比例。
 * @param {number} w - 图像的相对宽度。
 * @param {number} h - 图像的相对高度。
 * @param {number | Null} alpha - 透明度。(默认为1)
 * @param {Map<number, number> | Array<number> | Array<Array<number>> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 * @returns {Canvas} - Canvas 对象。
 */
Canvas.createWithCenterAndScale = (g, x, y, s, w, h, alpha, colorMap) => {
    let fw = (aw) => s * aw;
    let fh = (ah) => s * ah;
    let fx = (ax) => x - s * w / 2 + fw(ax);
    let fy = (ay) => y - s * h / 2 + fh(ay);
    let fl = (al) => s * al;
    return new Canvas(g, fx, fy, fw, fh, fl, alpha, colorMap);
}

/** 
 * 使用中心点和宽高创建 Canvas 对象。
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {number} x - 绘制中心点的 x 坐标。
 * @param {number} y - 绘制中心点的 y 坐标。
 * @param {number} w - 目标宽度。
 * @param {number} h - 目标高度。
 * @param {number} wt - 图像的相对宽度。
 * @param {number} ht - 图像的相对高度。
 * @param {number | Null} alpha - 透明度。(默认为1)
 * @param {Map<number, number> | Array<number> | Array<Array<number>> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 * @returns {Canvas} - Canvas 对象。
 */
Canvas.createWithCenterAndSize = (g, x, y, w, h, wt, ht, alpha, colorMap) => {
    let fw = (aw) => w / wt * aw;
    let fh = (ah) => h / ht * ah;
    let fx = (ax) => x - w / 2 + fw(ax);
    let fy = (ay) => y - h / 2 + fh(ay);
    let fl = (al) => fh(al);
    return new Canvas(g, fx, fy, fw, fh, fl, alpha, colorMap);
}

/**
 * @param {Array<number> | Array<Array<number>> | Map<number, number>}  src - 颜色映射表。类似 [0, 0xff00ff, 0xff0000, 0xffffff]。两两一组
 * 或 [[0, 0xff00ff], [0xff0000, 0xffffff]]。
 * @returns {Map<number, number>} - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 */
Canvas.standardizationColorMap = (src) => {
    if (src instanceof Map) return src;
    if (src == undefined) return new Map();
    let map = new Map();
    for (let i = 0; i < src.length; i++) {
        let k0 = src[i], k1;
        if (k0 instanceof Array) k1 = k0[1], k0 = k0[0];
        else k1 = src[++i];
        map.set(k0, k1);
    }
    return map;
}

/**
 * 可移动的 Canvas 类。
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {number} x - 绘制中心点的 x 坐标。
 * @param {number} y - 绘制中心点的 y 坐标。
 * @param {number} w - 目标宽度。
 * @param {number} h - 目标高度。
 * @param {number} wt - 图像的相对宽度。
 * @param {number} ht - 图像的相对高度。
 * @param {number | Null} alpha - 透明度。(默认为1)
 * @param {Map<number, number> | Array<number> | Array<Array<number>> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 */
Canvas.Mobile = function(g, x, y, w, h, wt, ht, alpha, colorMap) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.wt = wt;
    this.ht = ht;

    let fw = (aw) => this.w / this.wt * aw;
    let fh = (ah) => this.h / this.ht * ah;
    let fx = (ax) => this.x - this.w / 2 + fw(ax);
    let fy = (ay) => this.y - this.h / 2 + fh(ay);
    let fl = (al) => fh(al);

    Canvas.call(this, g, fx, fy, fw, fh, fl, alpha, colorMap);

    /**
     * 设置 Canvas 的参数
     * @param {Graphics2D | Null} g - 图形上下文对象。
     * @param {number | Null} x - 绘制中心点的 x 坐标。
     * @param {number | Null} y - 绘制中心点的 y 坐标。
     * @param {number | Null} w - 目标宽度。
     * @param {number | Null} h - 目标高度。
     * @param {number | Null} wt - 图像的相对宽度。
     * @param {number | Null} ht - 图像的相对高度。
     * @param {Map<number, number> | Array<number> | Array<Array<number>> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
     */
    this.for = (g, x, y, w, h, wt, ht, colorMap) => {
        if (g != null) this.g = g;
        if (x != null) this.x = x;
        if (y != null) this.y = y;
        if (w != null) this.w = w;
        if (h != null) this.h = h;
        if (wt != null) this.wt = wt;
        if (ht != null) this.ht = ht;

        colorMap = Canvas.standardizationColorMap(colorMap);
        this.colorMap = colorMap;
    }
}

/**
 * 获得位图。
 * @param {Function<Canvas, Any>} ft - 绘制函数。
 * @param {number} s - 缩放比例。
 * @param {number} tw - 绘制函数的宽度。
 * @param {number} th - 绘制函数的高度。
 * @param {Map<number, number> | Array<number> | Array<Array<number>> | Null} colorMap - 颜色映射表。类似 {[0, 0xff00ff], [0xff0000, 0xffffff]}。
 * @returns {BufferedImage} - 位图。
 */
Canvas.getBitmap = (ft, s, tw, th, colorMap) => {
    let img = new BufferedImage(tw * s, th * s, BufferedImage.TYPE_INT_ARGB);
    let g = img.createGraphics();
    colorMap = Canvas.standardizationColorMap(colorMap);
    let canvas = Canvas.createWithCenterAndScale(g, img.getWidth() / 2, img.getHeight() / 2, s, tw, th, 1, colorMap);
    ft(canvas);
    g.dispose();
    return img;
}