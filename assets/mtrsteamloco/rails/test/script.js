let model = ModelManager.uploadVertArrays(ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/main.obj"), null));

function create(ctx, state, rail) {
    let map = rail.getCustomConfigs();
    // map.put("test", "abc");
    // rail.sendUpdateC2S();

    let mat = new Matrix4f();
    mat.translate(new Vector3f(rail.getPosition(0)));
    mat.scale(2, 2, 2);
    ctx.drawCalls.put(1, new SimpleRailDrawCall(model, mat));
}

function render(ctx, state, rail) {
    let map = rail.getCustomConfigs();
    ctx.setDebugInfo("test", map.get("test"));
}

function dispose(ctx, state, rail) {

}