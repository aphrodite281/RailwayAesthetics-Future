{
    var ShapeU = {};
    ShapeU.WT = (e, sh) => {
        let x = e.translateX * 16, y = e.translateY * 16, z = e.translateZ * 16;
        const xyz = [x, y, z];
        let ps = sh.split('/');
        let ss = "";
        if (ps.length == 0 ) return;
        let j = ps.length;
        for (let p of ps) {
            j--;
            let ps = p.split(',');
            if (ps.length != 6) return;
            let sss = "";
            for (let i = 0; i < 6; i++) {
                let p = ps[i];
                let num = parseFloat(p);
                if (isNaN(num)) return;
                num += xyz[i % 3];
                sss += num + (i == 5 ? " " : ",");
            }
            ss += sss + (j == 0 ? "" : "/");
        }
        return ss;
    };
    ShapeU.WF =  (e, s) => {
        let yrot = e.getBlockYRot();
        //yrot = yrot % 360;
        let ps = s.split('/');
        if (ps.length == 0 ) return;
        let j = ps.length;
        let ss = "";
        for (let p of ps) {
            j--;
            let ps = p.split(',');
            if (ps.length != 6) return;
            let pss = [];
            for (let i = 0; i < 6; i++) {
                let p = parseFloat(ps[i]);
                if (isNaN(p)) return;
                pss[i] = p;
            }
            let [x1, y1, z1, x2, y2, z2] = pss;
            let r;
            switch (yrot) {
                case 0: {
                    r = [x1, y1 , z1, x2, y2, z2];   
                    break;
                }
                case 90: {
                    r = [16 - z2, y1, x1, 16 - z1, y2, x2];
                    break;
                }
                case 180: {
                    r = [16 - x2, y1, 16 - z2, 16 - x1, y2, 16 - z1];
                    break;
                }
                case 270: {
                    r = [z1, y1, 16 - x2, z2, y2, 16 - x1];
                    break;
                }
            }
            let sss = r.join(',');
            ss += sss + (j == 0 ? "" : "/");
        }
        return ShapeU.WT(e, ss);
    };
}