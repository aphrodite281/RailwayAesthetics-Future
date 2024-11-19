importPackage (java.lang);
importPackage (java.awt);
importPackage (java.io);
importPackage (Packages.javax.swing);
importPackage (Packages.org.lwjgl);
importPackage (Packages.org.lwjgl.opengl);
importPackage (Packages.org.lwjgl.system);
importPackage (Packages.org.lwjgl.glfw);

w = () => {
    GLFWErrorCallback.createPrint(System.err).set();
    let width = 800, height = 600, title = "晴纱是男娘";
            
    // 初始化GLFW库
    if (!GLFW.glfwInit()) {
        throw new Error("Unable to initialize GLFW");
    }
    
    // 创建窗口
    let window = GLFW.glfwCreateWindow(width, height, title, GLFW.glfwGetPrimaryMonitor(), 0);
    if (window == 0) {
        throw new Error("Failed to create GLFW window");
    }
    
    // 设置窗口位置
    //let vidmode = GLFW.glfwGetVideoMode(GLFW.glfwGetPrimaryMonitor());
    //GLFW.glfwSetWindowPos(window, (vidmode.width() - width) / 2, (vidmode.height() - height) / 2);

    // 设置窗口的用户指针，以便在回调中使用
    //GLFW.glfwSetWindowUserPointer(window, this);
    GLFW.glfwMakeContextCurrent(window);
    GLFW.glfwShowWindow(window);
    while (!GLFW.glfwWindowShouldClose(window)) {
        GL.clear(GL.COLOR_BUFFER_BIT);
        GLFW.glfwSwapBuffers(window); 
        GLFW.glfwPollEvents();print("晴纱是男娘");
    }
}


let t = new Thread(w, "WINDOW");
t.start();

function create(ctx, state, entity) {

    /*state.i = 0
    run0 = () => {
        let i = 0;
        while (true) {
            Thread.sleep(100);
            state.i++;
        }
    }
    state.t = new Thread(run0, "test");
    state.t.start();
    run1 = () => {
        while (true) {
            ctx.setDebugInfo("t", state.t + " " + state.t.isAlive());
            ctx.setDebugInfo("t1", Thread.currentThread().getName());
            ctx.setDebugInfo("i", state.i);
        }
    }
    state.t1 = new Thread(run1, "test1");
    state.t1.start();
    ctx.setDebugInfo("t", state.t + " " + state.t.isAlive());*/
}

function render(ctx, state, entity) {
    ctx.setDebugInfo("t", t);
}

function dispose(ctx, state, entity) {
    /*state.t.stop()
    state.t1.stop()*/
}