function newBooleanResponder(key, title, dv, funHandleBuilder) {
    dv = dv + "";
    if (funHandleBuilder == undefined) funHandleBuilder = builder => {};
    return new ConfigResponder({
        key: () => key,
        init: function(map) {
            if (!map.containsKey(key)) map.put(key, dv);
        },
        getListEntries: function(map, builder,supp) {
            let a = builder.startBooleanToggle(title, (map.get(key) + "") == "true").setDefaultValue(dv == "true").setSaveConsumer(b => map.put(key, b + ""));
            funHandleBuilder(a);
            return [a.build()];
        }
    })
}