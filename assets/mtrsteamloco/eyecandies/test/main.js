include(Resources.id("mtrsteamloco:library/code/board.js"));

function create(ctx, state, entity) {
    let a = new Board({matrices: []});
    a.addBoard("abcdefg");
    ctx.setDebugInfo("nb", a.nowBoard);
    state.a = a;
}

function render(ctx, state, entity) {
    let a = state.a;
    ctx.setDebugInfo("nb", a.nowBoard);
}