/**
 * 本类意在管理图片上传相关内容
 * 
 * @author Aphrodite281 QQ: 3435494979
 */

importPackage (java.lang);
importPackage (java.awt);
importPackage (java.awt.image);
importPackage (java.awt.geom);
importPackage (java.awt.font);



/**
 * 上传经理
 * @param {GraphicsTexture} tex 纹理对象
 */
function UploadManager(tex) {
    const fontA = Resources.getSystemFont("Noto Sans");
    const w = 1000, h = 80;
    const anaTex = new GraphicsTexture(w, h);
    let last, max, min, avg, times = 0;
    let history = [];
    let lasttime = 0;
    let offside = 0;

    /**
     * 上传图片
     * @param {BufferedImage} img 图片
     * @param {number} timestamp 时间戳
     */
    this.upload = (img, timestamp) => {
        if (timestamp <= lasttime) {
            offside++;
            return;
        }
        else lasttime = timestamp;
        tex.upload(img);
        if (last == undefined) last = Date.now();
        else {
            times++;
            let ins = Date.now() - last;
            if (max == undefined) max = ins;
            else max = Math.max(max, ins);
            if (min == undefined) min = ins;
            else min = Math.min(min, ins);
            if (avg == undefined) avg = ins;
            else avg = (avg * (times - 1) + ins) / times;
            last = Date.now();
            history.push([last, ins]);
            let ne = [];
            let nmax, nmin;
            for (let el of history) {
                if (Date.now() - el[0] <= 5000) ne.push(el);   
                if (nmax == undefined) nmax = el[1];
                else nmax = Math.max(nmax, el[1]);
                if (nmin == undefined) nmin = el[1];
                else nmin = Math.min(nmin, el[1]);
            }
            max = nmax;
            min = nmin;
            history = ne;
        }
    }

    this.getAnalyse = () => {
        let img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        let arr = history;
        let g = img.createGraphics();
        g.setStroke(new BasicStroke(5));
        g.setColor(Color.BLACK);
        g.drawRect(0, 0, w, h);
        g.setStroke(new BasicStroke(3));
        if (arr.length <= 5 || last == undefined || avg == undefined || min == undefined || max == undefined) {
            g.dispose();
            return img;
        }

        const f = (x) => 1000 / x;
        let ma = f(min), mi = f(max), av = f(avg);
        let c = false;
        if (ma > 200) {
            c = true;
            ma = 200;
        }
        let max1 = 80;
        const fy = (y) => h - h / max1 * y;
        g.setColor(Color.GRAY);
        for (let i = 0; i < max1; i += 10) {
            g.drawLine(0, fy(i), w, fy(i));
        }
        g.setColor(Color.WHITE);
        let a = arr[arr.length - 1];
        let now = Date.now();
        const fx = (x) => w / 5 * (now - x) / 1000; // 5s
        const fy1 = (y) => fy(f(y));
        let x = fx(a[0]), y =fy1(a[1])
        for (let i = 2; i < arr.length; i++) {
            let b = arr[arr.length - i];
            let nx = fx(b[0]), ny = fy1(b[1]);
            try {g.drawLine(x, y, nx, ny);} catch (e) {}
            x = nx;
            y = ny;
        }

        g.setColor(Color.YELLOW);
        g.drawLine(0, fy(40), w, fy(40));
        g.setFont(fontA.deriveFont(Font.PLAIN, 15));
        g.setColor(Color.BLUE);
        g.drawString("avg: " + av.toFixed(2), 900, 16);
        av = fy(av);
        g.drawLine(0, av, w, av);
        g.setColor(Color.RED);
        g.drawString("min: " + mi.toFixed(2), 0, 30);
        mi = fy(mi);
        g.drawLine(0, mi, w, mi);
        g.setColor(Color.GREEN);
        g.drawString("max: " + (c ? "200+" : ma.toFixed(2)), 0, 46);
        ma = fy(ma);
        g.drawLine(0, ma, w, ma);
        g.dispose();

        anaTex.upload(img);
        return anaTex;
    }

    this.dispose = () => anaTex.close();
    this.getOffside = () => offside;
}