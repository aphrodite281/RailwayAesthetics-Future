function RGB (r, g, b) {
    if (r instanceof RGB) {
        this.r = r.r;
        this.g = r.g;
        this.b = r.b;
    } else {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    this.toString = () => "{r:" + this.r + ",g:" + this.g + ",b:" + this.b + "}";
}

function HSV (h, s, v) {
    if (h instanceof HSV) {
        this.h = h.h;
        this.s = h.s;
        this.v = h.v;
    } else {
        this.h = h;
        this.s = s;
        this.v = v;
    }

    this.toString = () => "{h:" + this.h + ",s:" + this.s + ",v:" + this.v + "}";
}

const ColorU = {
    
    /**
     * 将十六进制颜色换为 RGB 数组
     * @param {number} hex 十六进制颜色
     * @returns {RGB} RGB 数组
     */
    h2r: (hex) => {
        let r = hex >> 16 & 0xff;
        let g = hex >> 8 & 0xff;
        let b = hex & 0xff;
        return new RGB(r, g, b);
    },
    
    /**
     * 将 RGB 对象转换为十六进制颜色
     * @param {RGB} rgb RGB 对象
     * @returns {number} 十六进制颜色
     */
    r2h: (rgb) => {
        let r = rgb.r, g = rgb.g, b = rgb.b;
        return r << 16 | g << 8 | b;
    },

    /**
     * 将 HSV 对象转换为 RGB 对象
     * @param {HSV} hsv HSV 对象
     * @returns {RGB} RGB 对象
     */
    r2v: (rgb) => {
        let r = rgb.r, g = rgb.g, b = rgb.b;
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;

        let d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        } else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return new HSV(h, s, v);
    },

    /**
     * 将 HSV 对象转换为 RGB 对象
     * @param {HSV} hsv HSV 对象
     * @returns {RGB} RGB 对象
     */
    v2r: (hsv) => {
        let h = hsv.h, s = hsv.s, v = hsv.v;
        let r, g, b;
        let i = Math.floor(h * 6);
        let f = h * 6 - i;
        let p = v * (1 - s);
        let q = v * (1 - f * s);
        let t = v * (1 - (1 - f) * s);

        switch(i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);

        return new RGB(r, g, b);
    }
}
/**
 * 将 HSV 对象转换为十六进制颜色
 * @param {HSV} hsv HSV 对象 
 * @returns  {number} 十六进制颜色 
 */
ColorU.v2h = (hsv) => ColorU.r2h(ColorU.v2r(hsv));

/**
 * 将十六进制颜色转换为 HSV 对象
 * @param {number} hex 十六进制颜色 
 * @returns {HSV} HSV 对象 
 */
ColorU.h2v = (hex) => ColorU.r2v(ColorU.h2r(hex));