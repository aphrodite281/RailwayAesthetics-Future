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
 * @param {number} tmax 分析上的最大值
 * @param {number} tmin 分析上的最小值
 * @param {number} tavg 分析上的目标值
 * @param {number} tf 分析上的分度值
 * @param {number} ty 分析上的最大阈值
 */
function UploadManager(tex, tmax, tmin, tavg, tf, ty) {
    if (tmax == undefined) tmax = 40;
    if (tmin == undefined) tmin = 0;
    if (tavg == undefined) tavg = 100;
    if (tf == undefined) tf = 10;
    if (ty == undefined) ty = 200;
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

        const f = (x) => 1000 / x;
        const fy = (y) => h - h / (tmax - tmin) * (y - tmin);

        g.setStroke(new BasicStroke(3));
        g.setColor(Color.GRAY);
        for (let i = tmin; i < tmax; i += tf) {
            g.drawLine(0, fy(i), w, fy(i));
        }
        let ma = f(min), mi = f(max), av = f(avg);
        if (arr.length <= 5 || last == undefined || avg == undefined || min == undefined || max == undefined) {
            ma = 0, mi = 0, av = 0;
        } else {
            let c = false;
            if (ma > tmax) {
                c = true;
                ma = tmax;
            }
    
            g.setColor(Color.WHITE);
            let a = arr[arr.length - 1];
            let now = Date.now();
            const fx = (x) => w / 5 * (now - x) / 1000; // 5s
            const fy1 = (y) => fy(f(y));
            let x = fx(a[0]), y =fy1(a[1])
            for (let i = 2; i < arr.length; i++) {
                let b = arr[arr.length - i];
                let nx = fx(b[0]), ny = f(b[1]);
                ny = Math.min(ny, 2 * tmax);
                ny = fy(ny);
                try {g.drawLine(x, y, nx, ny);} catch (e) {}
                x = nx;
                y = ny;
            }
        }

        g.setColor(Color.YELLOW);
        g.drawLine(0, fy(tavg), w, fy(tavg));
        g.setColor(Color.BLUE);
        let avy = fy(av);
        g.drawLine(0, avy, w, avy);
        g.setColor(Color.RED);
        let miy = fy(mi);
        g.drawLine(0, miy, w, miy);
        g.setColor(Color.GREEN);
        let may = fy(ma);
        g.drawLine(0, may, w, may);

        g.setColor(Color.GRAY);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.5));
        g.fillRect(0, 0, 100, 50);
        g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1));
        g.setFont(fontA.deriveFont(Font.PLAIN, 15));
        g.setColor(Color.BLUE);
        g.drawString("avg: " + av.toFixed(2), 10, 46);
        g.setColor(Color.RED);
        g.drawString("min: " + mi.toFixed(2), 10, 16);
        g.setColor(Color.GREEN);
        g.drawString("max: " + (c ? tmax.toFixed(2) + "+" : ma.toFixed(2)), 10, 30);

        g.setStroke(new BasicStroke(5));
        g.setColor(Color.BLACK);
        g.drawRect(0, 0, w, h);

        g.dispose();

        anaTex.upload(img);
        return anaTex;
    }

    this.dispose = () => anaTex.close();
    this.getOffside = () => offside;
}