const ColorIntBase = {
    init: (ctx, state, entity, colors) => {
        let nu = false;
        pi = (key, mnum) => {
            let num = parseInt(entity.data.get(key));
            if (isNaN(num)) {
                num = mnum;
                entity.data.put(key, mnum + "");
                nu = true;
            }
            return num;
        }
        for (let [key, color0, responder] of colors) {
            let color = pi(key, color0);
            state[key] = color;
            if (responder != null) responder();
        }
        return nu;
    },
    tick: (ctx, state, entity, colors) => {
        let nu = false;
        let changed = false;
        pi = (key, mnum) => {
            let num = parseInt(entity.data.get(key));
            if (isNaN(num)) {
                num = mnum;
                entity.data.put(key, mnum + "");
                nu = true;
            }
            return num;
        }
        for (let [key, color0, responder] of colors) {
            let color = pi(key, color0);
            if (color != state[key]) {
                changed = true;
            }
            state[key] = color;
            if (color != state[key] && responder != null) responder();
        }
        return [nu, changed];
    }
}
const CIB = ColorIntBase;