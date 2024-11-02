include(Resources.id("mtrsteamloco:eyecandies/signal_lighta/common0.js"));

const lights = [["colorC", 0xff4040], ["colorB", 0xffff40], ["colorA", 0x40ff40]];

function create(ctx, state, entity) {
    c(ctx, state, entity, lights);
}

function render(ctx, state, entity) {
    r(ctx, state, entity, lights);
}