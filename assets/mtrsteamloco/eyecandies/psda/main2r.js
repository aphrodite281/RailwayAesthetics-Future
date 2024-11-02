include(Resources.id("mtrsteamloco:eyecandies/psda/common0.js"));

function create(ctx, state, entity) {
    c(ctx, state, entity);
}

function render(ctx, state, entity) {
    r(ctx, state, entity, draw, sh1 + '/' + sh);
}

function draw(ctx, mat, i) {
    mat.rotateY(Math.PI);
    ctx.drawModel((i == 0 || i == lineNum - 1)? mcr : mcy, mat);
}
