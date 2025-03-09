# @author: Aphrodite281

import os
import cv2
import argparse
import numpy as np
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from alive_progress import alive_bar
import re
import glob

def validate_paths(input_dir, output_path):
    """验证输入输出路径有效性"""
    if not os.path.isdir(input_dir):
        raise FileNotFoundError(f"输入目录不存在: {input_dir}")
    if not output_path.endswith('.mp4'):
        raise ValueError("输出文件必须为.mp4格式")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

def natural_sort_key(filename):
    """自然排序键函数（支持混合数字和字符串的文件名）"""
    return [int(c) if c.isdigit() else c.lower() for c in re.split('(\d+)', filename)]

def get_sorted_images(input_dir):
    """获取按时间戳排序的图片文件列表"""
    files = [f for f in os.listdir(input_dir) if f.lower().endswith('.png')]
    
    # 使用改进的自然排序算法
    try:
        files.sort(key=lambda x: int(''.join(filter(str.isdigit, x))))
    except ValueError:
        files.sort(key=natural_sort_key)
    
    return files

def calculate_frame_positions(files, target_fps):
    """计算帧位置并生成时间轴映射表"""
    timestamps = [int(''.join(filter(str.isdigit, f))) for f in files]
    base_time = timestamps[0]
    frame_interval = 1000 / target_fps  # 毫秒
    
    timeline = []
    prev_pos = 0
    
    for ts in timestamps:
        delta = ts - base_time
        frame_pos = int(delta / frame_interval)
        
        # 插入空白帧（如果存在时间间隙）
        if frame_pos > prev_pos + 1:
            for pos in range(prev_pos + 1, frame_pos):
                timeline.append(('blank', pos))
        
        timeline.append(('frame', frame_pos, ts))
        prev_pos = frame_pos
    
    return timeline

def load_image_worker(args):
    """多线程图像加载工作函数"""
    path, position = args
    try:
        img = cv2.imread(path)
        if img is None:
            raise IOError(f"无法读取图像文件: {path}")
        return (position, img)
    except Exception as e:
        print(f"\n⚠️ 加载失败: {os.path.basename(path)} - {str(e)}")
        return (position, None)

def process_video(input_dir, output_path, target_fps=30, max_workers=4):
    """主处理函数"""
    validate_paths(input_dir, output_path)
    files = get_sorted_images(input_dir)
    
    if not files:
        raise RuntimeError("输入目录中没有PNG文件")
    
    # 获取视频参数
    sample_image = cv2.imread(os.path.join(input_dir, files[0]))
    height, width = sample_image.shape[:2]
    
    # 创建视频写入器
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(output_path, fourcc, target_fps, (width, height))
    
    # 计算帧位置时间轴
    timeline = calculate_frame_positions(files, target_fps)
    total_frames = max(item[1] for item in timeline if item[0] == 'frame') + 1
    
    # 进度条初始化
    with alive_bar(total_frames, title='视频生成进度', bar='smooth', spinner='dots_waves2') as bar:
        # 多线程加载有效图像
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 准备加载任务
            load_tasks = []
            file_index = 0
            for item in timeline:
                if item[0] == 'frame':
                    path = os.path.join(input_dir, files[file_index])
                    load_tasks.append((path, item[1]))
                    file_index += 1

            # 提交任务并处理结果
            futures_to_pos = {}
            for task in load_tasks:
                future = executor.submit(load_image_worker, task)
                futures_to_pos[future] = task[1]  # 将 future 和 pos 映射关系显式存储

            frame_buffer = {}

            for future in as_completed(futures_to_pos):
                pos = futures_to_pos[future]  # 获取对应的任务位置
                try:
                    result = future.result()
                    if result[1] is not None:
                        frame_buffer[pos] = result[1]  # 存储有效帧
                except Exception as e:
                    print(f"\n⚠️ 线程错误: {str(e)}")
        
        # 按时间轴写入视频
        last_valid_frame = np.zeros((height, width, 3), dtype=np.uint8)
        for frame_pos in range(total_frames):
            if frame_pos in frame_buffer:
                frame = frame_buffer[frame_pos]
                last_valid_frame = frame
                video_writer.write(frame)
            else:
                # 使用最后一个有效帧填充空白
                video_writer.write(last_valid_frame)
            
            bar()
    
    video_writer.release()
    print(f"\n✅ 视频生成完成：{output_path}")

def find_latest_folder(directory):
    # 获取目录下所有文件夹
    folders = glob.glob(os.path.join(directory, '*/'))
    # 如果没有找到文件夹，返回 None
    if not folders:
        return None
    # 按照最后修改时间排序，并返回最后修改时间最新的文件夹
    return max(folders, key=os.path.getmtime)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='时间戳图像序列转视频工具')
    latest_folder = find_latest_folder('./')
    parser.add_argument('-i', '--input', default=latest_folder, help='输入图片目录路径')
    parser.add_argument('-o', '--output', default='./output.mp4', help='输出视频文件路径')
    parser.add_argument('-f', '--fps', type=int, default=30, help='目标帧率（默认30）')
    parser.add_argument('-t', '--threads', type=int, default=4, help='最大线程数（默认4）')
    
    args = parser.parse_args()
    
    print(f"处理视频: 输入目录={args.input}, 输出路径={args.output}, 目标帧率={args.fps}, 最大线程数={args.threads}")

    try:
        process_video(
            input_dir=args.input,
            output_path=args.output,
            target_fps=args.fps,
            max_workers=args.threads
        )
    except Exception as e:
        print(f"\n❌ 发生错误: {str(e)}")
        exit(1)