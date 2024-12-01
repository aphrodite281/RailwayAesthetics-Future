from tkinter import Tk, Canvas
from pynput import mouse
import os


# 存储鼠标点击的坐标
click_coords = []

# 十字准心的线条
crosshair_lines = []
# 定义保存标志位
save_flag = False

# 鼠标当前位置
current_mouse_position = (0, 0)

def update_crosshair():
    global crosshair_lines, current_mouse_position

    # 更新十字准心位置
    for line in crosshair_lines:
        canvas.delete(line)
    
    x, y = current_mouse_position
    window_x = root.winfo_x()
    window_y = root.winfo_y()

    toplevel = root.winfo_toplevel()
    title_bar_height = toplevel.winfo_rooty() - toplevel.winfo_y()

    norm_x = x - window_x
    norm_y = y - window_y - title_bar_height


    if 0 <= norm_x <= 1100 and 0 <= norm_y <= 900:
        # 画十字准心
        line1 = canvas.create_line(norm_x - 10, norm_y, norm_x + 10, norm_y, fill="red", width=2)
        line2 = canvas.create_line(norm_x, norm_y - 10, norm_x, norm_y + 10, fill="red", width=2)

        crosshair_lines.extend([line1, line2])

    # 每200毫秒调用一次自己
    root.after(200, update_crosshair)


def on_mouse_move(x, y):
    global current_mouse_position
    current_mouse_position = (x, y)

def on_click(x, y, button, pressed):
    global click_coords
    global save_flag  # 新增标志位

    try:
        if pressed and button == mouse.Button.left:
            # 获取窗口的位置
            window_x = root.winfo_x()
            window_y = root.winfo_y()

            toplevel = root.winfo_toplevel()
            title_bar_height = toplevel.winfo_rooty() - toplevel.winfo_y()

            ox = -4
            oy = 0

            # 计算窗口内部的坐标
            norm_x = x - window_x + ox
            norm_y = y - window_y - title_bar_height + oy

            # 确保坐标在窗口范围内
            if 0 <= norm_x <= 1100 and 0 <= norm_y <= 900:
                click_coords.append((norm_x, norm_y))
                if len(click_coords) >= 2:
                    draw_line()
    except Exception as e:
        print(f"Error in on_click: {e}")

def draw_line():
    global click_coords
    l = len(click_coords)
    canvas.create_line(
        click_coords[l - 1][0], click_coords[l - 1][1],
        click_coords[l - 2][0], click_coords[l - 2][1],
        width=5
    )

def save_vertex_data():
    global save_flag  # 使用标志位
    if not save_flag:  # 检查标志位
        save_flag = True  # 设置标志位
        file_path = os.path.join(os.path.dirname(__file__), "abc.txt")
        try:
            with open(file_path, "w") as f:  # 将 "a" 模式修改为 "w" 模式
                for coord in click_coords:
                    f.write(f"path.lineTo(fx({coord[0]}), fy({coord[1]}));\n")
            click_coords.clear()  # 清空 click_coords 列表
        except Exception as e:
            print(f"Error occurred while saving data: {e}")
        save_flag = False  # 重置标志位

# 创建主窗口并获取标题栏和边框的宽度
root = Tk()

# 启动一个 1100x900 的窗口
root.geometry("1100x900")

canvas = Canvas(root, width=1100, height=900)
canvas.pack()

# 初始化十字准心更新
update_crosshair()

# 创建鼠标监听器
with mouse.Listener(on_click=on_click, on_move=on_mouse_move) as listener:
    # 绑定 Esc 键，按下时保存定点数组
    root.bind('<Escape>', lambda event: save_vertex_data())
    # 绑定 C 键，按下时保存并关闭窗口
    root.bind('<c>', lambda event: (save_vertex_data(), root.destroy()))
    root.mainloop()
    listener.stop()
