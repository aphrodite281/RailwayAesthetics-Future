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
include(Resources.id("aphrodite:library/code/util/error_supplier.js"));

/**
 * 文本经理
 */
const TextManager = {
    /**
     * 使用 Clip 方式控制文本区域
     */
    Clip: function (w, h, fx, fy) {
        if (fx == undefined) fx = x => x;
        if (fy == undefined) fy = y => y;
        let map = new Map();
        let list = [];
        const zero = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
        const g0 = zero.createGraphics();

        const getW = (str, font) => {
            const fm = g0.getFontMetrics(font);
            const width = fm.stringWidth(str)
            return width;
        };

        const getDescent = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getDescent();
        }

        const getAscent = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getAscent();
        }
        
        const getHeight = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getHeight();
        }

        const layout = TextManager.Clip.layout;

        function Text(str, font, style, color, x, y, w, h, mode, start) {
            let getH;
            switch (mode) {
                case 0: getH = font => getHeight(font); break;
                default: getH = font => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            h = getH(font);
            let scroll = false;
            str = TextManager.processString(str, font, w, getW);
            let width = getW(str, font);
            if (width > w) scroll = true;
            switch (mode) {
                case 0: d = getDescent(font); break;
                default: d = getDescent(font) / 2; break;
            }
            let d;
            const descent = d;
            if (!scroll) {
                this.draw = (g, xi, yi, time) => {
                    g.setClip(new Rectangle2D.Float(xi + x - w / 2, yi + y - h / 2, w, h));
                    g.setFont(font);
                    layout(g, xi + x, yi + y, w, h);
                    g.drawString(str, xi + x - w / 2 + (w - width) / 2, yi + y + h / 2 - descent);
                    g.setClip(null);
                }
            } else {
                const ins = h * 2; // 间隔
                this.draw = (g, xi, yi, time) => {
                    g.setClip(new Rectangle2D.Float(xi + x - w / 2, yi + y - h / 2, w, h));
                    g.setFont(font);
                    layout(g, xi + x, yi + y, w, h);
                    let tx = ((time - start) / 1000 * 2 * h) % (width + ins);
                    tx = 0;
                    g.setColor(color);
                    g.drawString(str, xi + x - w / 2 - tx - ins, yi + y + h / 2 - descent);
                    g.drawString(str, xi + x - w / 2 - tx + width, yi + y + h / 2 - descent);
                    g.setClip(null);
                }
            }


            this.dispose = () => {};
        }

        /**
         * 添加文字到队列
         * @param {String} str 文字内容
         * @param {Font} font 字体
         * @param {number} style 字体样式
         * @param {number | Color} color HEX颜色
         * @param {number} x x坐标
         * @param {number} y y坐标
         * @param {number} w 最大宽度
         * @param {number} h 最大高度
         * @param {number} mode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, mode, start, id) => {
            if (start == null) start = 0;
            if (mode == undefined) mode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, mode, start));
            } else {
                list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, mode, start));
            }
        }

        this.map = () => map;
        this.list = () => list;
        
        /**
         * 清空文字队列
         */
        this.clear = () => {
            map = new Map();
            list = [];
        }

        /**
         * 绘制文字队列
         * @param {Graphics2D} g 画笔
         * @param {number} x x坐标
         * @param {number} y y坐标
         * @param {number | Null} time 时间
         */
        this.draw = (g, x, y, time) => {
            if (x == undefined) x = 0;
            if (y == undefined) y = 0;
            if (time == undefined) time = Date.now();
            for (let [id, text] of map) text.draw(g, x, y, time);
            for (let text of list) text.draw(g, x, y, time);
        }

        /**
         * 释放资源
         */
        this.dispose = () => {
            g0.dispose();
        }
    },
    /**
     * 使用 BufferedImage 方式控制文本区域
     */
    Buffered: function (w, h, fx, fy) {
        if (fx == undefined) fx = x => x;
        if (fy == undefined) fy = y => y;
        let map = new Map();
        let list = [];
        const zero = new BufferedImage(1, 1, BufferedImage.TYPE_INT_ARGB);
        const g0 = zero.createGraphics();

        const getW = (str, font) => {
            const fm = g0.getFontMetrics(font);
            const width = fm.stringWidth(str)
            return width;
        };

        const getDescent = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getDescent();
        }

        const getAscent = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getAscent();
        }
        
        const getHeight = (font) => {
            const fm = g0.getFontMetrics(font);
            return fm.getHeight();
        }

        const layout = TextManager.Buffered.layout;

        function Text(str, font, style, color, x, y, w, h, mode, start) {
            let getH;
            switch (mode) {
                case 0: getH = (font) => getHeight(font); break;
                default: getH = (font) => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            str = TextManager.processString(str, font, w, getW);
            let scroll = false;
            let width = getW(str, font);
            if (width > w) scroll = true;
            h = getH(font);
            let d;
            switch (mode) {
                case 0: d = getDescent(font); break;
                default: d = getDescent(font) / 2; break;
            }
            const descent = d;
            const y0 = h - descent;
            if (!scroll) {
                let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                let g = tex.createGraphics();
                g.setFont(font);
                layout(g, w, h);
                g.setColor(color);
                g.drawString(str, (w - width) / 2, y0); // 居中绘制
                this.draw = (gi, xi, yi, time) => gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
                g.dispose();
            } else {
                let last = start;
                const ins = h * 2; // 间隔
                this.draw = (gi, xi, yi, time) => {
                    let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                    let g = tex.createGraphics();
                    g.setFont(font);
                    layout(g, w, h);
                    g.setComposite(AlphaComposite.SrcOver);
                    let tx = ((time - start) / 1000 * 2 * h) % (width + ins);
                    if (last > time) throw new Error("Time error");
                    last = time;
                    g.setColor(color);
                    g.drawString(str, -tx - ins, y0);
                    g.drawString(str, -tx + width, y0);
                    gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
                }
            }
            this.dispose = () => {
            }
        }

        /**
         * 添加文字到队列
         * @param {String} str 文字内容
         * @param {Font} font 字体
         * @param {number} style 字体样式
         * @param {number | Color} color HEX颜色
         * @param {number} x x坐标
         * @param {number} y y坐标
         * @param {number} w 最大宽度
         * @param {number} h 最大高度
         * @param {number} mode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, mode, start, id) => {
            if (start == null) start = 0;
            if (mode == undefined) mode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, mode, start));
            } else {
                list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, mode, start));
            }
        }

        this.map = () => map;
        this.list = () => list;
        
        /**
         * 清空文字队列
         */
        this.clear = () => {
            map = new Map();
            list = [];
        }

        /**
         * 绘制文字队列
         * @param {Graphics2D} g 画笔
         * @param {number} x x坐标
         * @param {number} y y坐标
         * @param {number | Null} time 时间
         */
        this.draw = (g, x, y, time) => {
            if (x == undefined) x = 0;
            if (y == undefined) y = 0;
            if (time == undefined) time = Date.now();
            for (let [id, text] of map) text.draw(g, x, y, time);
            for (let text of list) text.draw(g, x, y, time);
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
}

TextManager.setComp = (g, value) => {
    let oc = g.getComposite();  
    let ov = 1;
    if (oc instanceof AlphaComposite) ov = oc.getAlpha();
    g.setComposite(AlphaComposite.SrcOver.derive(value * ov));
};

TextManager.Clip.layout = layout = (g, x, y, w, h) => {
    return;
    const setComp = TextManager.setComp;
    g = g.create();
    setComp(g, 0.1);
    g.setColor(Color.BLUE);
    g.fillRect(x - w / 2, y - h / 2, w, h);
    setComp(g, 0.8);
    g.setStroke(new BasicStroke(2));
    g.setColor(Color.BLACK);
    g.drawRect(x - w / 2, y - h / 2, w, h);
    g.dispose();
}

TextManager.Buffered.layout = layout = (g, w, h) => {
    return;
    const setComp = TextManager.setComp;
    g = g.create();
    setComp(g, 0.1);
    g.setColor(Color.BLUE);
    g.fillRect(0, 0, w, h);
    setComp(g, 0.8);
    g.setStroke(new BasicStroke(2));
    g.setColor(Color.BLACK);
    g.drawRect(0, 0, w, h);
    g.dispose();
}

TextManager.modeKey = "text_manager_mode";
TextManager.defaultMode = "0";

TextManager.getMode = () => {
    return ClientConfig.get(TextManager.modeKey);
}

TextManager.processString = (str, font, w, getW) => {
    switch (TextManager.getMode() + "") {
        case "0": {
            break;
        }
        default: {
            if (getW(str, font) <= w) return str;
            str = str + "...";
            while (getW(str, font) > w && str.length > 0) {
                if (str.length > 3) {
                    str = str.substring(0, str.length - 4) + str.substring(str.length - 3);
                } else {
                    str = str.substring(0, str.length - 1);
                }
            }
            break;
        }
    }
    return str;
}

// TextManager.ConfigResponder = new ConfigResponder.TextField(TextManager.modeKey, ComponentUtil.translatable("name.aph.text_manager_mode"), "0", str => str, ErrorSupplier.only(["0", "1"]), str => {}, str => {
//     let arr = java.lang.reflect.Array.newInstance(ComponentUtil.translatable("").getClass(), 1);
//     java.lang.reflect.Array.set(arr, 0, ComponentUtil.translatable("tip.aph.text_manager_mode"));
//     return java.util.Optional.of(arr);
// }, false);

TextManager.configResponder = new ConfigResponder.TextField(TextManager.modeKey, ComponentUtil.translatable("name.aph.text_manager_mode"), "1", str => str, ErrorSupplier.only(["0", "1"]), str => {}, str => java.util.Optional.of(asJavaArray([ComponentUtil.translatable("tip.aph.text_manager_mode"), ComponentUtil.translatable("tip.aph.reload_resourcepack")], Component)), false);
ClientConfig.register(TextManager.configResponder);