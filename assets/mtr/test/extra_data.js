let res = new ConfigResponder({key: () => "yybb", init: map => {
    if (!map.containsKey("yybb")) {
        map.put("yybb", "yyyyyyy");
    }
}, getListEntries: (map, builder, screenSupplier) => [
    builder.startTextDescription(
        ComponentUtil.translatable("114514")
    ).build(), 
    builder.startIntSlider(ComponentUtil.translatable("滑条"), 0, -1, 1).build()
]});
// builder.startColorField(ComponentUtil.translatable("name.raf.color"), 0).setDefaultValue(0).build();
function create(ctx, state, train) {
    train.registerCustomConfig(res);
    // let map = train.getExtraData();
    // map.put("abc", "def");
    train.sendCustomConfigsUpdateC2S();
}

function render(ctx, state, train) {
    let map = train.getCustomConfigs();
    ctx.setDebugInfo("abc", map.size(), map.get("yybb") + "");
}

function dispose(ctx, state, train) {

}