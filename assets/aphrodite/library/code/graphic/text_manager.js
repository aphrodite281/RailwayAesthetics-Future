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
 */
const TextManager = {
    /**
     * 使用 Clip 方式控制文本区域
     */
    Clip: function () {
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



        const setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
        const layout = (g, x, y, w, h) => {
            // return;
            setComp(g, 0.1);
            g.setColor(Color.BLUE);
            g.fillRect(x - w / 2, y - h / 2, w, h);
            setComp(g, 0.8);
            g.setStroke(new BasicStroke(2));
            g.setColor(Color.BLACK);
            g.drawRect(x - w / 2, y - h / 2, w, h);
        }

        function Text(str, font, style, color, x, y, w, h, mode, start) {
            switch (mode) {
                case 0: var getH = (font) => getHeight(font); break;
                case 1: var getH = (font) => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            let width = getW(str, font);
            let scroll = false;
            if (width > w) scroll = true;
            h = getH(font);
            switch (mode) {
                case 0: var d = getDescent(font); break;
                case 1: var d = getDescent(font) / 2; break;
            }
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
                    g.drawString(str, xi + x - w / 2 - tx -ins + width, yi + y + h / 2 - descent);
                    g.setClip(null);
                }
            }
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
         * @param {Number} mode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {Number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, mode, start, id) => {
            if (start == null) start = 0;
            if (mode == undefined) mode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, x, y, w, h, mode, start));
            } else {
                list.push(new Text(str, font, style, color, x, y, w, h, mode, start));
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
         * @param {Number} x x坐标
         * @param {Number} y y坐标
         * @param {Number | Null} time 时间
         */
        this.draw = (g, x, y, time) => {
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
    Buffered: function () {
        let map = new Map();
        let list = [];
        const tex0 = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        const g0 = tex0.createGraphics();

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



        const setComp = (g, value) => {g.setComposite(AlphaComposite.SrcOver.derive(value))};
        const layout = (g, x, y, w, h) => {
            // return;
            setComp(g, 0.1);
            g.setColor(Color.BLUE);
            g.fillRect(x - w / 2, y - h / 2, w, h);
            setComp(g, 0.8);
            g.setStroke(new BasicStroke(2));
            g.setColor(Color.BLACK);
            g.drawRect(x - w / 2, y - h / 2, w, h);
        }

        function Text(str, font, style, color, x, y, w, h, mode, start) {
            switch (mode) {
                case 0: var getH = (font) => getHeight(font); break;
                case 1: var getH = (font) => getAscent(font); break;
            }
            if (!(color instanceof Color)) color = new Color(color);
            let h0 = getH(font.deriveFont(style,1000));
            let scale = 1000 / h0;
            font = font.deriveFont(style, h * scale);
            let width = getW(str, font);
            let scroll = false;
            if (width > w) scroll = true;
            h = getH(font);
            let tex = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            let g = tex.createGraphics();
            g.setFont(font);
            switch (mode) {
                case 0: var d = getDescent(font); break;
                case 1: var d = getDescent(font) / 2; break;
            }
            const descent = d;
            const y0 = h - descent;
            if (!scroll) {
                layout(g, w, h);
                g.setColor(color);
                g.drawString(str, (w - width) / 2, y0); // 居中绘制
                this.draw = (gi, xi, yi) => gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
            } else {
                const ins = h * 2; // 间隔
                this.draw = (gi, xi, yi) => {
                    g.setComposite(AlphaComposite.Clear);
                    g.fillRect(0, 0, w, h);
                    layout(g, w, h);
                    g.setComposite(AlphaComposite.SrcOver);
                    let tx = ((Date.now() - start) / 1000 * h) % (width + ins);
                    g.setColor(color);
                    g.drawString(str, -tx - ins, y0);
                    g.drawString(str, -tx + width, y0);
                    gi.drawImage(tex, xi + x - w / 2, yi + y - h / 2, null);
                }
            }
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
         * @param {Number} mode 高度算法 0:Height, 1: Ascent 默认为1
         * @param {Number} start 开始时间
         * @param {Any | Null} id
         */
        this.drawMiddle = (str, font, style, color, x, y, w, h, mode, start, id) => {
            if (start == null) start = 0;
            if (mode == undefined) mode = 1;
            if (id != undefined) {
                if (map.has(id)) map.get(id).dispose();
                map.set(id, new Text(str, font, style, color, x, y, w, h, mode, start));
            } else {
                list.push(new Text(str, font, style, color, x, y, w, h, mode, start));
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
         * @param {Number} x x坐标
         * @param {Number} y y坐标
         * @param {Number | Null} time 时间
         */
        this.draw = (g, x, y) => {
            g0.setComposite(AlphaComposite.Clear);
            g0.fillRect(0, 0, w, h);
            g0.setComposite(AlphaComposite.SrcOver);
            for (let [id, text] of map) text.draw(g, x, y);
            for (let text of list) text.draw(g, x, y);
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