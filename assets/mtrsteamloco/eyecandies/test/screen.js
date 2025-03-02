importPackage(java.awt);

let font = new Font("宋体", Font.PLAIN, 200);
let str = "";

const screen = new IScreen.WithTextrue(ComponentUtil.literal("screen"));
screen.initFunction = (screen, w, h) => {
    let state = screen.state;
    if (state.str == null) state.str = "";
    let tex = screen.texture;
    let w0 = tex.width, h0 = tex.height;
    state.fx = x => x * w0 / w;
    state.fy = y => y * h0 / h;
}
screen.renderFunction = (screen, mx, my, d) => {
    let state = screen.state;
    let tex = screen.texture;
    let g = tex.graphics;
    g.setComposite(AlphaComposite.Clear);
    g.fillRect(0, 0, tex.width, tex.height);
    g.setComposite(AlphaComposite.SrcOver);
    g.setColor(Color.WHITE);
    g.setFont(font);
    g.drawString(state.str, 10, 220);
    g.fillRect(state.fx(mx) - 10, state.fy(my) - 10, 20, 20);
    g.drawString(str, 10, 120);
    tex.upload();
}
screen.charTypedFunction = (screen, c, b) => {
    screen.state.str += c;
    return true;
}

function use(ctx, state, entity, player) {
    MinecraftClient.setScreen(screen);
}