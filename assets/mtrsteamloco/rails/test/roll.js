function render(ctx, state, rail) {
    let map = rail.getRollAngleMap();
    map.put(0, Math.PI/2);
    map.put(rail.getLength(), - Math.PI/2);
    ctx.setDebugInfo("roll", map.size());
    rail.sendUpdateC2S();
}