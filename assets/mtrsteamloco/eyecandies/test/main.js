const MCU = MinecraftClient;
const MCD = MTRClientData;
const MCR = MTRRailwayData;

function create(ctx, state, entity) {

}

function render(ctx, state, entity) {
    let sches = entity.schedules.get(entity.platformId);
    let rtid = sches[0].routeId;
    let names = getNames(rtid);
    ctx.setDebugInfo("names", names.toString());
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