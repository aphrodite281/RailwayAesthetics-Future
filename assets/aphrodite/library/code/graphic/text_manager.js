/** 
 * 本类意在方便管理文字内容，实现自动处理滚动等。
 * 
 * @author Aphrodite281 QQ: 3435494979
 */

importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);

include(Resources.id("aphrodite:library/code/util/value.js"));

/**
 * 文本经理
 * @param {Number} w 图片宽度
 * @param {Number} h 图片高度
 * @param {Function<Number, Number>} fx 转换x坐标函数
 * @param {Function<Number, Number>} fy 转换y坐标函数
 */
function TextManager(w, h, fx, fy) {
    const map = new Map();
    const list = [];
    const tex0 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
    const g0 = tex0.createGraphics();

    const getW = (str, font) => {
        const fm = g0.getFontMetrics(font);
        const width = fm.stringWidth(str)
        return width;
    };

    const getH = (font) => {
        const fm = g0.getFontMetrics(font);
        const height = fm.getHeight();
        return height;
    }

    const getFont = (font, style, h) => {
        let h0 = getH(font.deriveFont(style,1000));
        let scale = 1000 / h0;
        return font.deriveFont(style, h * scale);
    }

    const getDescent = (font) => {
        const fm = g0.getFontMetrics(font);
        return fm.getDescent();
    }

    const smooth = (k, value) => {
        if (value > k) return k;
        if (k < 0) return 0;
        return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
    }

    function Text(str, font, style, color, x, y, w, h, start) {
        if (!(color instanceof Color)) color = new Color(color);
        font = getFont(font, style, h);
        let width = getW(str, font);
        let scroll = false;
        if (width > w) scroll = true;
        h = getH(font);
        let w0 = getW(str, font);
        let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        let g = tex.createGraphics();
        g.setFont(font);
        const descent = getDescent(font);
        if (!scroll) {
            g.setColor(new Color(0x0a0a0a));
            g.fillRect(0, 0, w, h);
            g.setColor(color);
            g.drawString(str, (w - w0) / 2, h - descent); // 居中绘制
            this.draw = () => g0.drawImage(tex, x - w / 2, y - h / 2, null);
        } else {
            let ins = h * 3; // 间隔
            this.draw = () => {
                g.setComposite(AlphaComposite.Clear);
                g.fillRect(0, 0, w, h);
                g.setColor(new Color(0x0a0a0a));
                g.fillRect(0, 0, w, h);
                g.setComposite(AlphaComposite.SrcOver);
                let tx = ((Date.now() - start) / 1000 * h) % w0;
                g.setColor(color);
                g.drawString(str, -tx - ins, h - descent);
                g.drawString(str, -tx + w0, h - descent);
                g0.drawImage(tex, x - w / 2, y - h / 2, null);
            }
        }
        this.dispose = () => g.dispose();
    }

    /**
     * 添加文字到队列
     * @param {String} str 文字内容
     * @param {Font} font 字体
     * @param {Number} style 字体样式
     * @param {Number | Color} color HEX颜色
     * @param {Number} x x坐标
     * @param {Number} y y坐标
     * @param {Number} w 最大宽度
     * @param {Number} h 最大高度
     * @param {Number} start 开始时间
     * @param {Any | Null} id
     */
    this.drawMiddle = (str, font, style, color, x, y, w, h, start, id) => {
        if (start == null) start = 0;
        if (id != null) if (map.has(id)) {map.get(id).dispose(); map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, start));}
        else list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, start));
    }

    this.map = () => map;
    this.list = () => list;
    
    /**
     * 清空文字队列
     */
    this.clear = () => {
        for (let [id, text] of map) text.dispose();
        map.clear();
        for (let text of list) text.dispose();
        list = [];
    }

    /**
     * 提交所有内容
     * @param {Graphics2D} g 画笔
     * @param {Number} x x坐标
     * @param {Number} y y坐标
     */
    this.get = () => {
        g0.setComposite(AlphaComposite.Clear);
        g0.fillRect(0, 0, w, h);
        g0.setComposite(AlphaComposite.SrcOver);
        for (let [id, text] of map) text.draw();
        for (let text of list) text.draw();
        return tex0;
    }

    /**
     * 释放资源
     */
    this.dispose = () => {
        g0.dispose();
        for (let [id, text] of map) text.dispose();
        for (let text of list) text.dispose();
    }
}