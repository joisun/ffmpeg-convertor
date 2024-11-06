import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function secondsToTime(duration: number): string {
  const totalSeconds = Math.floor(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

export type GenerateGMParams = {
  bitrate: string,
  compression: number,
  fps: number,
  loop: number,
  pix_fmt?: string,
  select: number,
  width: number,
  filetype: string,
  input?: string,
  output?: string
  timeRange: string
}


export type CommandPartsType = {
  input: string
  output: string
  executeParts: string[]
}
type GenerateFFmpegCommandType = (params: GenerateGMParams) => { command: string, commandParts: CommandPartsType }
export const generateFFmpegCommand: GenerateFFmpegCommandType = function (params) {
  // 设置默认值
  const defaults = {
    bitrate: "800k",
    compression: 23,  // 使用更常见的 CRF 值范围
    fps: 30,
    loop: 0,
    pix_fmt: "yuv420p",  // 更常用的像素格式
    select: 1,
    width: 480,
    input: "input.mp4",
    output: "output",
    filetype: 'mp4'
  };

  // 合并默认值和用户提供的参数
  const options = { ...defaults, ...params };

  // 构建命令数组
  const commandParts = [
    "ffmpeg",
    ` ${options.timeRange} `,
    `-i ${options.input}`,
    `-b:v ${options.bitrate}`,
    `-crf ${options.compression}`,
    `-r ${options.fps}`,
    `-loop ${options.loop}`,
    `-vf select="'not(mod(n,${options.select}))',scale=${options.width}:-1"`,
    `-pix_fmt ${options.pix_fmt}`,
    `${options.output}.${options.filetype}`
  ];

  const commandStr = commandParts.filter(part => part !== '').join(' ')
  
  const _execute_parts = commandStr.replaceAll('"','').split(' ').filter(i=>!!i)
  _execute_parts.shift()
  return {
    command: commandStr, commandParts: {
      input: options.input,
      output: `${options.output}.${options.filetype}`,
      executeParts: _execute_parts
    }
  };
}



export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export function sanitizeFilename(filename:string) {
  // 分离文件名和扩展名
  const parts = filename.split('.');
  let name = parts.slice(0, -1).join('.');
  const extension = parts.length > 1 ? parts[parts.length - 1] : '';

  // 定义正则表达式，匹配合法字符（中文字符、英文字符、数字、中划线、下划线）
  const pattern = /[^\u4e00-\u9fa5a-zA-Z0-9-_]/g;
  
  // 替换非法字符为空字符串
  name = name.replace(pattern, '');

  // 拼接合法文件名和扩展名
  return extension ? `${name}.${extension}` : name;
}


export function get24HourTimeStringSuffix() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0'); // 获取小时并补全至两位数
  const minutes = String(now.getMinutes()).padStart(2, '0'); // 获取分钟并补全至两位数
  const seconds = String(now.getSeconds()).padStart(2, '0'); // 获取秒并补全至两位数
  return `_${hours}${minutes}${seconds}`; // 返回格式化后的时间字符串
}
