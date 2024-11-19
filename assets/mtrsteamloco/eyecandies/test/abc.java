import org.lwjgl.glfw.GLFW;
import org.lwjgl.glfw.GLFWVidMode;
import org.lwjgl.opengl.GL;
import org.lwjgl.system.MemoryStack;

import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.opengl.GL11.*;
import static org.lwjgl.system.MemoryStack.stackPush;

public class Main {
    private long window;

    public void run() {
        init();
        loop();

        // 释放窗口和库资源
        glfwDestroyWindow(window);
        glfwTerminate();
        glfwSetErrorCallback(null).free();
    }

    private void init() {
        // 初始化GLFW
        if (!glfwInit()) {
            throw new IllegalStateException("无法初始化GLFW");
        }

        // 配置窗口
        glfwDefaultWindowHints();
        glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
        glfwWindowHint(GLFW_RESIZABLE, GLFW_TRUE);

        // 创建窗口
        window = glfwCreateWindow(800, 600, "LWJGL窗口", 0, 0);
        if (window == 0) {
            throw new RuntimeException("无法创建窗口");
        }

        // 获取窗口的坐标
        try (MemoryStack stack = stackPush()) {
            GLFWVidMode vidMode = glfwGetVideoMode(glfwGetPrimaryMonitor());

            glfwSetWindowPos(
                    window,
                    (vidMode.width() - 800) / 2,
                    (vidMode.height() - 600) / 2
            );
        }

        // 显示窗口
        glfwShowWindow(window);

        // 初始化OpenGL
        glfwMakeContextCurrent(window);
        GL.createCapabilities();
    }

    private void loop() {
        // 主循环
        while (!glfwWindowShouldClose(window)) {
            glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // 清除屏幕

            // 交换前后缓冲
            glfwSwapBuffers(window);

            // 处理窗口事件
            glfwPollEvents();
        }
    }

    public static void main(String[] args) {
        new Main().run();
    }
}
