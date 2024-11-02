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
        if (nu) entity.sendUpdateC2S();
    },
    tick: (ctx, state, entity, colors) => {
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
            if (color != state[key] && responder != null) responder();
        }
        if (nu) entity.sendUpdateC2S();
    }
}