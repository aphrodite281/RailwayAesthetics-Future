function orderlyResponder(key, filling, responders) {
    return new ConfigResponder({
        key: () => key,
        init: map => {
            map.put(key, filling);
            for (let responder of responders) {
                responder.init(map);
            }
        },
        getListEntries: (map0, builder, screenSuplier) => {
            let result = [];
            for (let responder of responders) {
                let entries = responder.getListEntries(map0, builder, screenSuplier);
                for (let entry of entries) {
                    result.push(entry);
                }
            }
            return result;
        }
    });
}