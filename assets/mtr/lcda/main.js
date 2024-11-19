importPackage (java.lang);
importPackage (java.awt);

include(Resources.id("aphrodite:library/code/face.js"));

const defaultScreenTextureSize = [2000, 400];
const defaultScreenModelSize = [2000 / 2000, 400 / 2000];

const textureSize = defaultScreenTextureSize;
const modelSize = defaultScreenModelSize;
const doorZPositions = [0, 5, -5, 10, -10];
const doorPosition = [1.5, 2.1];// x、y
const rotation = 15 / 180 * Math.PI;// YX(Z)欧拉的X
const rightMatrices = getMatrices(false);
const leftMatrices = getMatrices(true);

function create(ctx, state, entity) {
    var info = {
        ctx: ctx,
        matrices: rightMatrices,
        texture: textureSize,
        model: {
            size: modelSize,
            renderType: "light",
            uvSize: [1, 1]
        }
    }
    var rightFace = new Face(info);
    info.matrices = leftMatrices;
    var leftFace = new Face(info);

    state.rightFace = rightFace;
    state.leftFace = leftFace;

    state.running = true;
    state.lastTime = System.currentTimeMillis();

    var rightThread = getThread(rightFace, true, ctx, state, entity);
    var leftThread = getThread(leftFace, false, ctx, state, entity);
    rightThread.start();
    leftThread.start();

    state.rightThread = rightThread;
    state.leftThread = leftThread;
}

function render(ctx, state, entity) {
    state.rightFace.tick();
    state.leftFace.tick();
    state.lastTime = System.currentTimeMillis();
}

function dispose(ctx, state, entity) {
    state.running = false;
    state.lastTime = -10000;
    state.rightFace.close();
    state.leftFace.close();
}

function getMatrices(isRight) {
    const result = [];
    let matrices = new Matrices();
    matrices.translate(doorPosition[0], doorPosition[1], 0);
    const k = isRight? -1 : 1;
    const execute = (translateZ) => {
        matrices.translate(0, 0, translateZ);
        matrices.rotateY(k * Math.PI / 2);
        matrices.rotateX(k * rotation);
    }
    for (let position of doorZPositions) {
        matrices.pushPose();
        execute(position);
        result.push(new Matrices(matrices.last()));
        matrices.popPose();
    }
    return result;
}

function getThread(face, isRight, ctx, state, train) {
    const main = () => {
        print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Start");
        const tex = face.texture;
        const g = tex.graphics;
        const drawCalls = [] //[[[old, alpha], [old, alpha]], [new, alpha]]
        const inChanging = () => drawCalls.length == 2;
        const addDrawCall = (lambda) => {
            if (drawCalls.length == 1) {
                drawCalls.push([lambda, 0]);
            } else {
                drawCalls[0].push(drawCalls[1]);
                drawCalls[1] = [lambda, 0];
            }
        }

        const setComp = (value) => g.setComposite(AlphaComposite.SrcOver.derive(value));
        const smooth = (k, value) => {// 平滑变化
            if (value > k) return k;
            if (k < 0) return 0;
            return (Math.cos(value / k * Math.PI + Math.PI) + 1) / 2 * k;
        }

        let nowTime = System.currentTimeMillis();
        let lastTime = nowTime;
        let lastFrameTime = 0;
        const fps = 24;
        const frameTime = 1000 / fps;
        const checkTime = v => v < 0 ? 0 : v;

        let ab = 0;
        let a = () => {
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, tex.width, tex.height);
        }
        let b = () => {
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, tex.width, tex.height);
        }
        while (state.running && state.lastTime + 6000 > System.currentTimeMillis()) {
            try {
                nowTime = System.currentTimeMillis();

                if (!inChanging()) {
                    addDrawCall(ab == 0? a : b);
                    ab = 1 - ab;
                }

                { // commit DrawCalls
                    if (drawCalls[1][1] >= 1) {
                        drawCalls[0] = [drawCalls.pop()[1], 1];
                    }
                    for (let i = 0; i < drawCalls[0].length; i++) {
                        let [lambda, alpha] = drawCalls[0][i];
                        setComp(alpha);
                        lambda();
                    }
                    if (inChanging()) {
                        let [lambda, alpha] = drawCalls[1];
                        setComp(smooth(1, alpha));
                        drawCalls[1][1] += (nowTime - lastTime) * 0.8;
                        lambda();
                    }
                    tex.upload();
                }

                lastFrameTime = System.currentTimeMillis() - nowTime;
                ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + "Used: " + lastFrameTime + "ms", 0);
                nowTime = System.currentTimeMillis();
                lastTime = nowTime;
                Thread.sleep(checkTime(frameTime - lastFrameTime));
            } catch (e) {
                ctx.setDebugInfo("LCD-Thread " + (isRight ? "Right" : "Left") + "Error At: ", System.currentTimeMillis() + e.message);
                print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + "Error At: " + System.currentTimeMillis() + e.message);
                Thread.sleep(3000);
            }
        }
        print("ARAF-LCD-Thread " + (isRight ? "Right" : "Left") + " Exit");
    }
    return new Thread(main, "ARAF-LCD-Thread On Train" + ctx.hashCode() + (isRight? "Right" : "Left"));
}