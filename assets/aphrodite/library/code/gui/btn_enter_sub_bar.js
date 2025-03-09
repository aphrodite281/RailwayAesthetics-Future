function btnEnterSubBar(key, filling, title, responders) {
    return new ConfigResponder({
        key: () => key, 
        init: map => {
            map.put(key, filling);
            for (let responder of responders) {
                responder.init(map);
            }
        },
        getListEntries: (map, builder, screenSuplier) => {
            let btnListEntry = IScreen.ClothConfig2.newButtonListEntry(ComponentUtil.literal(""), IScreen.newButton(0, 0, 300, 20, title, btn => {
                let screen;
                let parent = screenSuplier.get();
                let builder = IScreen.ClothConfig2.createConfigBuilder()
                    .setParentScreen(parent)
                    .setTitle(title)
                    .setDoesConfirmSave(false)
                    .transparentBackground();
                let entryBuilder = builder.entryBuilder();
                let common = builder.getOrCreateCategory(title);
                
                for (let responder of responders) {
                    for (let entry of responder.getListEntries(map, entryBuilder, () => screen)) {
                        common.addEntry(entry);
                    }
                }

                builder.setSavingRunnable(() => {
                    ClientConfig.save();
                    Resources.resetComponents();
                });
                screen = builder.build();
                MinecraftClient.setScreen(screen);
            }), (e, b, a1, a2, a3, a4, a5, a6, a7, a8, a9) => {
                UtilitiesClient.setWidgetX(b, IScreen.getGuiScaledWidth() / 2 - 150);
            }, null, false);
            return [btnListEntry];
        }
    });
}