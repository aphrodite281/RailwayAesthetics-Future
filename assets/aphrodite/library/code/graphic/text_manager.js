/** 
 * 本类意在方便管理文字内容，实现自动处理滚动等。
 * 
 * @author Aphrodite281 QQ: 3435494979
 */

importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);

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
    const tex0 = new BufferedImage(w, h);
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
        let fm = g0.getFontMetrics(font.deriveFont(Font.PLAIN,1000));
        let h0 = fm.getHeight();
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

    function Text(str, font, style, color, x, y, w, h, start, alpha) {
        if (!(color instanceof Color)) color = new Color(color);
        font = getFont(font, style, h);
        let width = getW(str, font);
        let scroll = false;
        if (width > w) scroll = true;
        let h = getH(font);
        let w0 = getW(str, font);
        let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        let g = tex.createGraphics();
        g.setFont(font);
        if (scroll) {
            g.drawString(str, (w - w0) / 2, h - getDescent(font)); // 居中绘制
            this.draw = () => {
                g0.setComposite(AlphaComposite.SrcOver.derive(alpha));
                g0.setColor(color);
                g0.drawImage(tex, x - w, y - h, null);
            }
        } else {
            this.draw = () => {
                g.setComposite(AlphaComposite.CLEAR);
                g.fillRect(0, 0, w, h);
                g.setComposite(AlphaComposite.SRC_OVER);
                let v = ((Date.now() - start) / 1000 * 0.7) % 1;
                v = smooth(1, v);
                let tx = v * w;
                g.setColor(color);
                g.drawString(str, tx, h - getDescent(font));
                g.drawString(str, tx - w, h - getDescent(font));
                g0.setComposite(AlphaComposite.SrcOver.derive(alpha));
                g0.drawImage(tex, x - w, y - h, null);
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
     * @param {Number | Null} alpha 透明度
     * @param {Any | Null} id
     */
    this.drawMiddle = (str, font, style, color, x, y, w, h, start, alpha, id) => {
        if (alpha == null) alpha = 1;
        if (start == null) start = Date.now();
        if (id != null) if (map.has(id)) {map.get(id).dispose(); map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, start, alpha));}
        else list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, start, alpha));
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
        list.splice(0, list.length);
    }

    /**
     * 提交所有内容
     * @param {Graphics2D} g 画笔
     * @param {Number} x x坐标
     * @param {Number} y y坐标
     */
    this.commit = (g, x, y) => {
        g0.setComposite(AlphaComposite.CLEAR);
        g0.fillRect(0, 0, w, h);
        g0.setComposite(AlphaComposite.SRC_OVER);
        for (let [id, text] of map) text.draw();
        for (let text of list) text.draw();
        g.drawImage(tex0, x, y, null);
    }

    /**
     * 释放资源
     */
    this.dispose = () => {
        g.dispose();
        for (let [id, text] of map) {
            text.dispose();
        }
    }
}