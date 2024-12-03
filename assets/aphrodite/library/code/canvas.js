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
 * @param {Function} fl - 用于转换长度的函数。
 */

function Canvas(g, fx, fy, fl) {
    /**
     * @param {Graphics2D} g - 图形上下文对象。
     */
    this.g = g;
    
    /**
     * @param {Function<Number, Number>} fx - 用于转换 x 坐标的函数。
     */
    this.fx = fx;

    /**
     * @param {Function<Number, Number>} fy - 用于转换 y 坐标的函数。
     */
    this.fy = fy;
    
    /**
     * @param {Function<Number, Number>} fl - 用于转换粗细的函数。
     */
    this.fl = fl;

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
     * @param {Number} lineWidth - 描边宽度。
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
     * @param {Number} fontPattern - 字体样式。如 Font.PLAIN、Font.BOLD、Font.ITALIC。
     */
    this.fontPattern = Font.PLAIN;

    /**
     * @param {String} font - 字体大小。如 "11.45px"。
     */
    this.font = "11.45px";

    /**
     * 开始路径。
     */
    this.beginPath = () => path = new GeneralPath();

    /**
     * @param {Number} x - x 坐标(使用 fx 函数)。
     * @param {Number} y - y 坐标(使用 fy 函数)。
     */
    this.moveTo = (x, y) => path.moveTo(fx(x), fy(y));

    /**
     * @param {Number} x - 终点的 x 坐标(使用 fx 函数)。
     * @param {Number} y - 终点的 y 坐标(使用 fy 函数)。
     */
    this.lineTo = (x, y) => path.lineTo(fx(x), fy(y));

    /**
     * @param {Number} x1 - 控制点 1 的 x 坐标(使用 fx 函数)。
     * @param {Number} y1 - 控制点 1 的 y 坐标(使用 fy 函数)。
     * @param {Number} x2 - 控制点 2 的 x 坐标(使用 fx 函数)。
     * @param {Number} y2 - 控制点 2 的 y 坐标(使用 fy 函数)。
     * @param {Number} x3 - 终点的 x 坐标(使用 fx 函数)。
     * @param {Number} y3 - 终点的 y 坐标(使用 fy 函数)。
     */
    this.bezierCurveTo = (x1, y1, x2, y2, x3, y3) => path.curveTo(fx(x1), fy(y1), fx(x2), fy(y2), fx(x3), fy(y3));

    /**
     * 结束路径。
     */
    this.closePath = () => path.closePath();
    
    const setColor = (str) => {
        str = str.substring(4, str.length-1);
        let arr = str.split(",");
        let r = parseInt(arr[0]), gr = parseInt(arr[1]), b = parseInt(arr[2]);
        let color = new Color(r << 16 | gr << 8 | b);
        this.g.setColor(color);
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
        this.g.setStroke(new BasicStroke(fl(this.lineWidth), cap, join)); 
        this.g.draw(path);
    }

    /**
     * @param {String} text - 要绘制的文本。
     * @param {Number} x - 文本左上角的 x 坐标(使用 fx 函数)。
     * @param {Number} y - 文本左上角的 y 坐标(使用 fy 函数)。
     */
    this.fillText = (text, x, y) => {
        this.g.setFont(this.font.deriveFont(this.fontPattern, fl(this.font)));
        this.g.setColor(this.fillStyle);
        this.g.drawString(text, fx(x), fy(y));
    }

    /**
     * @param {Number} x - 矩形左上角的 x 坐标(使用 fx 函数)。
     * @param {Number} y - 矩形左上角的 y 坐标(使用 fy 函数)。
     * @param {Number} w - 矩形的宽度(使用 fx 函数)。
     * @param {Number} h - 矩形的高度(使用 fy 函数)。
     */
    this.rect = (x, y, w, h) => {setColor(this.fillStyle); this.g.fillRect(fx(x), fy(y), fx(w), fy(h));};
    
    /**
     * @param {Number} x - 圆心的 x 坐标(使用 fx 函数)。
     * @param {Number} y - 圆心的 y 坐标(使用 fy 函数)。
     * @param {Number} r - 圆的半径(使用 fl 函数)。
     * @param {Number} start - 起始角度。(弧度制);
     * @param {Number} end - 终止角度。(弧度制)
     */
    this.drawArc = (x, y, r, start, end) => {setColor(this.srokeStyle); this.setStroke(); this.g.drawArc(fx(x - r), fy(y - r), fl(2 * r), fl(2 * r), start, end);};
    this.toString = () => "Canvas by Aphrodite281" + this.g.toString();
}

/** 
 * 使用中心点和大小缩放创建 Canvas 对象。
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {Number} x - 绘制中心点的 x 坐标。
 * @param {Number} y - 绘制中心点的 y 坐标。
 * @param {Number} s - 缩放比例。
 * @param {Number} w - 图像的相对宽度。
 * @param {Number} h - 图像的相对高度。
 * @returns {Canvas} - Canvas 对象。
 */
Canvas.createWithCenterAndScale = function(g, x, y, s, w, h) {
    let fx = (ax) => x - s * w / 2 + s * ax;
    let fy = (ay) => y - s * h / 2 + s * ay;
    let fl = (al) => s * al;
    return new Canvas(g, fx, fy, fl);
}