importPackage(java.nio);
importPackage(java.util);

let model = ModelManager.loadRawModel(Resources.manager(), Resources.idr("face.obj"), null);// 法线 -z
model = ModelManager.uploadVertArrays(model);

function create(ctx, state, entity) {
    state.num = 0;
}

let t = ComponentUtil.translatable;
let g = ComponentUtil.getString;

function render(ctx, state, entity) {
    ctx.setDebugInfo(g(t("text.raf.qssnn")), ClientConfig.get("qssnn"));
}

function beClicked1(ctx, state, entity, player) {// player: WapperedEntity 包装了 Entity(Player) 为js提供一些基本的方法和属性
    let p = player.getPosition();
    p.add(0, 1.5, 0);// 假定头在脚底往上1.5m
    ctx.setDebugInfo("Clicked on ", "shift: " + player.isShiftKeyDown(), "look angle: " + player.getLookAngle(), "from: " + p,"time: " + Date.now(), p);
    let ti = Date.now();
    // DrawCall为一个接口 仅有一个commit方法
    let call = new DrawCall({commit: (drawScheduler, basePose, worldPose, light) => {// 差不多是这样的 包含commit方法的对象 -> 转换为DrawCall对象
        try {
            let pose = worldPose.copy();
            pose.translate(p);
            pose.translate(0, (Date.now() - ti) / 1000 * 0.4, 0);

            let buf = FloatBuffer.allocate(16);
            pose.store(buf);
            
            buf.put(0, 1);
            buf.put(1, 0);
            buf.put(2, 0);
            buf.put(3, 0);

            buf.put(4, 0);
            buf.put(5, 1);
            buf.put(6, 0);
            buf.put(7, 0);

            buf.put(8, 0);
            buf.put(9, 0);
            buf.put(10, 1);
            buf.put(11, 0);

            pose.load(buf);// 清空旋转信息 始终面向摄像机

            drawScheduler.enqueue(model, pose, MinecraftClient.packLightTexture(15, 15));
        } catch (e) {
            ctx.setDebugInfo("Error", e.toString());
        }
    }});
    ctx.drawCalls.put(state.num, call);
    // 亦可以直接使用 ctx.drawCalls.put(state.num, (drawScheduler, basePose, worldPose, light) => {...}); 
    // 即 function -> lambda表达式(java) -> DrawCall对象
    state.num++;
}

ClientConfig.register("qssnn", t("text.raf.qssnn"), true, str => str, str => {
    let stri = str + "";
    if (stri == "true" || stri == "false") return Optional.empty();
    else return Optional.of(t("gui.mtrsteamloco.error.invalid_value"));
}, str => {});