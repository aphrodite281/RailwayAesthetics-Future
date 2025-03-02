function render(ctx, state, train) {
    ctx.setDebugInfo("id", train.mtrTrain().sidingId.toString());
    ctx.setDebugInfo("name", train.siding().name);
    ctx.setDebugInfo("idd", train.siding().id.toString());
}