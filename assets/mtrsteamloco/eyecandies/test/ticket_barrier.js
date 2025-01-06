const open = "13, 0, 0, 16, 24, 16";
const close = open + "/ 0, 0, 6, 16, 24, 10";
const open1 = "13, 0, 0, 16, 17, 16";
const close1 = open1 + "/ 0, 8, 6, 16, 16, 10";

function render(ctx, state, entity) {
    let e = entity;
    let u = false;
    let str = "0, 0, 0, 16, 32, 16/ 0, 17, 0, 16, 24, 16";
    if (e.shape.set(str)) u = true;
    if (e.collision.set(str)) u = true;
    ctx.setDebugInfo("ab", e.shape.get().getClass().getName())
    if (u) e.sendUpdateC2S();
    
}

function render1(ctx, state, entity) {
    let e = entity;
    ctx.setDebugInfo("open", e.isOpened());
    let u = false;
    if (e.isOpened()) {
        if (e.shape.set(open1)) u = true;
        if (e.collision.set(open)) u = true;
    } else {
        if (e.shape.set(close1)) u = true;
        if (e.collision.set(close)) u = true;
    }
    if (u) e.sendUpdateC2S();
}