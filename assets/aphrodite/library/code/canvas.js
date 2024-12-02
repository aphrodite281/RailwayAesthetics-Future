/** 
 * 本类为矢量图形的绘制提供了实现，仿照html5 canvas的API设计。
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
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {Function} fx - 用于转换 x 坐标的函数。
 * @param {Function} fy - 用于转换 y 坐标的函数。
 * @param {Function} fl - 用于转换长度的函数。
 */
function Canvas(g, fx, fy, fl) {
    this.g = g;
    this.fx = fx;
    this.fy = fy;
    this.fl = fl;
    this.path = new GeneralPath(); 
    this.fillStyle = "rgb(255, 255, 255)";
    this.strokeStyle = "rgb(0, 0, 0)";
    this.lineWidth = 1;
    this.lineCap = "butt";
    this.lineJoin = "round";
    this.fontType = Resources.getSystemFont("Noto Sans");
    this.fontPattern = Font.PLAIN;
    this.font = "11.45px";
    this.beginPath = () => this.path = new GeneralPath();
    this.moveTo = (x, y) => this.path.moveTo(fx(x), fy(y));
    this.lineTo = (x, y) => this.path.lineTo(fx(x), fy(y));
    this.bezierCurveTo = (x1, y1, x2, y2, x3, y3) => this.path.curveTo(fx(x1), fy(y1), fx(x2), fy(y2), fx(x3), fy(y3));
    this.closePath = () => this.path.closePath();
    this.setColor = (str) => {
        str = str.substring(4, str.length-1);
        let arr = str.split(",");
        let r = parseInt(arr[0]), gr = parseInt(arr[1]), b = parseInt(arr[2]);
        let color = new Color(r << 16 | gr << 8 | b);
        this.g.setColor(color);
    }
    this.fill = () => {this.setColor(this.fillStyle); this.g.fill(this.path);}
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
        this.setColor(this.strokeStyle); 
        this.g.setStroke(new BasicStroke(fl(this.lineWidth), cap, join)); 
        this.g.draw(this.path);
    }
    this.fillText = (text, x, y) => {
        this.g.setFont(this.font.deriveFont(this.fontPattern, fl(this.font)));
        this.g.setColor(this.fillStyle);
        this.g.drawString(text, fx(x), fy(y));
    }
    this.rect = (x, y, w, h) => {this.setColor(this.fillStyle); this.g.fillRect(fx(x), fy(y), fx(w), fy(h));};
    this.drawArc = (x, y, r, w, h, start, end) => {this.setColor(this.srokeStyle); this.setStroke(); this.g.drawArc(fx(x - r), fy(y - r), fx(2 * r), fx(2 * r), start, end);}
    this.toString = () => "Canvas by Aphrodite281";
}

/** 
 * 使用中心点和大小缩放创建 Canvas 对象。
 * @param {Graphics2D} g - 图形上下文对象。
 * @param {Number} x - 绘制中心点的 x 坐标。
 * @param {Number} y - 绘制中心点的 y 坐标。
 * @param {Number} s - 缩放比例。
 * @param {Number} w - 图像的相对宽度。
 * @param {Number} h - 图像的相对高度。
 */
Canvas.createWithCenterAndScale = function(g, x, y, s, w, h) {
    let fx = (ax) => x - s * w / 2 + s * ax;
    let fy = (ay) => y - s * h / 2 + s * ay;
    let fl = (al) => s * al;
    return new Canvas(g, fx, fy, fl);
}