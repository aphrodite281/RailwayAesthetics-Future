const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;

const SignalBase = {
    init: (ctx, state, entity, paths) => {
        for (let i = 0; i < paths.length; i++) {
            let path = paths[i];
            let rm = MM.loadRawModel(RU.manager(), RU.id(path), null);
            let dyn = new DynamicModelHolder();
            dyn.uploadLater(rm);
            state["dyn" + (i - 1)] = dyn;
        }
    },
    render: (ctx, state, entity, paths) => {
        let oa = -1;
        let lnum = paths.length - 1;
        try {
            let pos = entity.getWorldPosVector3f();
            let facing = entity.getBlockYRot() + entity.rotateY / Math.PI * 180 + 90;
            let nodePos = MCU.getNodeAt(pos, facing);
            oa = MCU.getOccupiedAspect(nodePos, facing, lnum);
        } catch (e) {}
        ctx.drawModel(state["dyn" + oa], null);
    }
}

/*
    include(Resources.id("mtrsteamloco:library/code/signal_base.js"));
    const paths = ["不亮灯的模型路径", "红灯的模型路径", "黄灯的模型路径", "绿灯的模型路径"]

    function create(ctx, state, entity) {
        SignalBase.init(ctx, state, entity, paths);
    }
    
    function render(ctx, state, entity) {
        SignalBase.tick(ctx, state, entity, paths);}
    }
*/