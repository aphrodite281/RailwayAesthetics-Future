const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

function create(ctx, state, entity) {

}

function render(ctx, state, entity) {
    ctx.clearDebugInfo();
    MCD.SCHEDULES_FOR_PLATFORM.forEach((key, value) => {
        if (key == entity.platformId) {
            let sches1 = value;
            let sches = sches1.toArray();
            sches.sort((a, b) => {
                return a.arrivalMillis - b.arrivalMillis;
            });
            let mins = [sches[0]], texs = []
            ctx.setDebugInfo("sches", sches.length);
            ctx.setDebugInfo("kk", sches1.size())
            let n = getNames(sches[0].routeId)
            ctx.setDebugInfo("N", n[0]+","+n[1]+","+n[2])
        }
    });

}

function getNames(rtid) {
    for (let rot of MCD.ROUTES) {
        if (rot.id == rtid) {
            let ns = [];
            pids = rot.platformIds;
            for (let i = 0; i < 2; i++) {
                p = pids[i == 0 ? 0 : pids.size() - 1];
                pid = p.platformId;
                let st;
                for (let [key, value] of MCD.DATA_CACHE.platformIdToStation) {
                    if (key == pid) {
                        st = value;
                        break;
                    }
                }
                if (st != null) {
                    n = st.name;
                }
                ns[i] = n;
            }
            ns[2] = rot.name;
            return ns;
        }
    }
}