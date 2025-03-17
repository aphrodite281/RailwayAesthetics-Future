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
    Clip: function (fx, fy) {
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

        const layout = TextManager.layout;

        function Text(str, font, style, color, x, y, w, h, highMode, processingMode, start) {
            if (processingMode == undefined) processingMode = TextManager.getMode();
            let getH;
            switch (highMode) {
                case 0: getH = font => getHeight(font); break;
                default: getH = font => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            h = getH(font);
            let scroll = false;
            str = TextManager.processString(str, font, w, getW, processingMode);
            let width = getW(str, font);
            if (width > w && processingMode == 0) scroll = true;
            switch (highMode) {
                case 0: d = getDescent(font); break;
                default: d = getDescent(font) / 2; break;
            }
            let d;
            const descent = d;
            let s0 = w / width;
            if (!scroll) {
                this.draw = (g, xi, yi, time) => {
                    g = g.create();
                    g.translate(xi + x - w / 2, yi + y - h / 2);
                    layout(g, w, h);
                    g.setColor(color);
                    g.setFont(font);
                    if (s0 < 1) {
                        g.scale(s0, 1);
                        g.drawString(str, 0, h - descent);
                    } else g.drawString(str, w / 2 + (w - width) / 2, h - descent);
                    g.dispose();
                }
                this.scroll = () => false;
            } else {
                const ins = h * 2; // 间隔
                this.draw = (g, xi, yi, time) => {
                    g = g.create();
                    g.translate(xi + x - w / 2, yi + y - h / 2);
                    g.setClip(new Rectangle2D.Float(0, 0, w, h));
                    g.setFont(font);
                    layout(g, w, h);
                    let tx = ((time - start) / 1000 * 2 * h) % (width + ins);
                    tx = 0;
                    g.setColor(color);
                    g.drawString(str, - tx - ins, h - descent);
                    g.drawString(str, - tx + width, h - descent);
                    g.dispose();
                }
                this.scroll = () => true;
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
         * @param {number} highMode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {number} processingMode 处理模式 0: 滚动, 1: 截取, 2: 缩放
         * @param {number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, highMode, processingMode, start, id) => {
            if (start == null) start = 0;
            if (highMode == undefined) highMode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, highMode, processingMode, start));
            } else {
                list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, highMode, processingMode, start));
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

        this.scroll = () => {
            for (let [id, text] of map) if (text.scroll()) return true;
            for (let text of list) if (text.scroll()) return true;
            return false;
        }
    },
    /**
     * 使用 BufferedImage 方式控制文本区域
     */
    Buffered: function (fx, fy) {
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

        const layout = TextManager.layout;

        function Text(str, font, style, color, x, y, w, h, highMode, processingMode, start) {
            if (processingMode == undefined) processingMode = TextManager.getMode();

            let getH;
            switch (highMode) {
                case 0: getH = (font) => getHeight(font); break;
                default: getH = (font) => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            str = TextManager.processString(str, font, w, getW, processingMode);
            let scroll = false;
            let width = getW(str, font);
            if (width > w && processingMode == 0) scroll = true;
            h = getH(font);
            let d;
            switch (highMode) {
                case 0: d = getDescent(font); break;
                default: d = getDescent(font) / 2; break;
            }
            const descent = d;
            const y0 = h - descent;
            let s0 = w / width;
            if (!scroll) {
                let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
                let g = tex.createGraphics();
                g.setFont(font);
                layout(g, w, h);
                g.setColor(color);
                if (s0 < 1) {
                    g.scale(s0, 1);
                    g.drawString(str, 0, y0);
                } else g.drawString(str, (w - width) / 2, y0); // 居中绘制
                g.dispose();
                this.draw = (gi, xi, yi, time) => gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
                this.scroll = () => false;
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
                    g.dispose();
                    gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
                }
                this.scroll = () => true;
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
         * @param {number} highMode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {number} processingMode 处理模式 0: 滚动, 1: 截取, 2: 缩放
         * @param {number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, highMode, start, processingMode, id) => {
            if (start == null) start = 0;
            if (highMode == undefined) highMode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, fx(x), fy(y), w, h, highMode, processingMode, start));
            } else {
                list.push(new Text(str, font, style, color, fx(x), fy(y), w, h, highMode, processingMode, start));
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

        this.scroll = () => {
            for (let [id, text] of map) if (text.scroll()) return true;
            for (let text of list) if (text.scroll()) return true;
            return false;
        }
    }
}

TextManager.setComp = (g, value) => {
    let oc = g.getComposite();  
    let ov = 1;
    if (oc instanceof AlphaComposite) ov = oc.getAlpha();
    g.setComposite(AlphaComposite.SrcOver.derive(value * ov));
};

TextManager.layout = (g, w, h) => {
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
TextManager.defaultMode = "2";

TextManager.getMode = () => {
    return Number(ClientConfig.get(TextManager.modeKey));
}

TextManager.processString = (str, font, w, getW) => {
    switch (TextManager.getMode() + "") {
        case "1": {
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
        default: break;
    }
    return str;
}

// TextManager.ConfigResponder = new ConfigResponder.TextField(TextManager.modeKey, ComponentUtil.translatable("name.aph.text_manager_mode"), "0", str => str, ErrorSupplier.only(["0", "1"]), str => {}, str => {
//     let arr = java.lang.reflect.Array.newInstance(ComponentUtil.translatable("").getClass(), 1);
//     java.lang.reflect.Array.set(arr, 0, ComponentUtil.translatable("tip.aph.text_manager_mode"));
//     return java.util.Optional.of(arr);
// }, false);

TextManager.configResponder = new ConfigResponder.TextField(TextManager.modeKey, ComponentUtil.translatable("name.aph.text_manager_mode"), "2", str => str, ErrorSupplier.only(["0", "1", "2"]), str => {}, str => java.util.Optional.of(asJavaArray([ComponentUtil.translatable("tip.aph.text_manager_mode"), ComponentUtil.translatable("tip.aph.reload_resourcepack")], Component)), false);
ClientConfig.register(TextManager.configResponder);