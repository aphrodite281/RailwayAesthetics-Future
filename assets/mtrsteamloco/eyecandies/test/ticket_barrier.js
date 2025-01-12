const open = "13, 0, 0, 16, 24, 16";
const close = open + "/ 0, 0, 6, 16, 24, 10";
const open1 = "13, 0, 0, 16, 17, 16";
const close1 = open1 + "/ 0, 8, 6, 16, 16, 10";

function render(ctx, state, entity) {
    let e = entity;
    let u = false;
    let str = "0, 0, 0, 16, 8, 16/0, 0, 0, 16, 24, 16";
    if (e.setCollisionShape(str)) u = true;
    if (e.setShape(str)) u = true;
    e.sendUpdateC2S();
}

function render1(ctx, state, entity) {
    let e = entity;
    let u = false;
    if (e.isOpened()) {
        if (e.setCollisionShape(open)) u = true;
        if (e.setShape(open1)) u = true;
    } else {
        if (e.setCollisionShape(close)) u = true;
        if (e.setShape(close1)) u = true;
    }
    if (u) e.sendUpdateC2S();
    
}