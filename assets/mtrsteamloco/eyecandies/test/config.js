// throw new Error(JSON.stringify(config));

let model = ModelManager.uploadVertArrays(ModelManager.loadRawModel(Resources.manager(), Resources.id("mtrsteamloco:eyecandies/test/main.obj"), null));

let gt = new GraphicsTexture(1000, 1000);

model.replaceAllTexture(gt.identifier);
function render(ctx, state, entity) {
    gt.upload();
    gt.close();
    ctx.drawModel(model, new Matrices());
}