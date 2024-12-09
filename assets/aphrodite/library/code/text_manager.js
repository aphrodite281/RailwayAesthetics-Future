importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);

/**
 * 本类意在方便管理文字内容，实现自动滚动
 * @param {Number} w 宽度
 * @param {Number} h 高度
 */
function TextManager(w, h) {
    const map = new Map();
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

    const smooth = (k, value) => {// 平滑变化
        if (value > k) return k;
        if (k < 0) return 0;
        return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
    }

    function Text(str, font, style, x, y, w, h, start, alpha) {
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
     * @param {Number} x x坐标
     * @param {Number} y y坐标
     * @param {Number} w 最大宽度
     * @param {Number} start 开始时间
     * @param {Number | String} id
     */
    this.drawMiddle = (str, font, style, x, y, w, h, start, alpha, id) => {
        if (map.has(id)) map.get(id).dispose();
        else map.set(id, new Text(str, font, style, x, y, w, h, start, alpha));
    }

    /**
     * 获取文字内容的纹理
     * @returns {BufferedImage}
     */
    this.getTexture = () => {
        g0.setComposite(AlphaComposite.CLEAR);
        g0.fillRect(0, 0, w, h);
        g0.setComposite(AlphaComposite.SRC_OVER);
        for (let [id, text] of map) {
            text.draw();
        }
        return tex0;
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