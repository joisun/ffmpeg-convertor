# FFmpeg Converter

一个浏览器本地运行的视频转换、裁剪与压缩工作台。源文件不会上传到服务器，转换由 [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) 在 Web Worker 中完成。

## 能力

- 支持 MP4、WEBM、MOV、MKV、AVI、GIF、WEBP、FLV、MPG、OGV、WMV 11 种输出格式
- 基于 [React Timeline Editor](https://github.com/xzdarcy/react-timeline-editor) 的可拖拽、可缩放视频时间线与实时预览
- 分辨率、帧率、码率模式、codec-specific quality、循环和像素格式参数
- 输出格式与 codec、rate control、循环、帧率及像素格式联动，不支持的参数会禁用或阻止生成命令
- 生成可复制的原生 FFmpeg 指令
- 单页 100vh 编辑器布局，支持跟随系统且可记忆的 Light / Dark mode
- FFmpeg core 随应用同源部署，不依赖转换时临时访问第三方 CDN
- 使用稳定的 Compatible core，避免部分浏览器中 Multi-thread worker 卡死
- 转换进度、日志、错误恢复与任务取消
- 输入/输出虚拟文件在任务结束后自动清理

## 输出能力矩阵

工具不会仅根据文件扩展名猜测 FFmpeg 默认 codec，而是为每种输出显式指定经过 bundled Compatible core 验证的 profile：

| 输出 | 视频 / 图像 codec | 音频 codec | 码率控制 |
| --- | --- | --- | --- |
| MP4、MOV | libx264 | AAC | CRF 或目标码率，二选一 |
| MKV | libx264 | Opus | CRF 或目标码率，二选一 |
| WEBM | libvpx VP8 | Opus | CRF 或目标码率，二选一 |
| AVI | MPEG-4 Part 2 | MP3 | 目标码率 |
| FLV | Sorenson Spark | MP3 | 目标码率 |
| MPG | MPEG-2 Video | MP2 | 目标码率；帧率限制为 24/25/30/50/60 |
| OGV | Theora | Vorbis | Theora quality 或目标码率 |
| WMV | Windows Media Video 8 | WMA | 目标码率 |
| GIF | GIF + palettegen/paletteuse | 无音频 | 循环参数；不使用 bitrate/CRF |
| WEBP | libwebp_anim | 无音频 | WebP quality；不使用通用 CRF |

像素格式选项来自当前 encoder 的实际能力，并进一步排除了这个 WASM build 中不稳定的组合。WEBM 使用实测稳定的 VP8 路径；VP9 在当前 Single-thread core 中会触发 WASM memory fault。

## 本地运行

环境要求：Node.js 20+、pnpm 9+。

```bash
pnpm install
pnpm dev
```

打开终端输出的根地址即可进入编辑器；项目没有二级业务路由。FFmpeg core 会由 Vite 从本地依赖复制到构建产物，不需要额外配置 CDN 或 Cross-Origin Isolation 响应头。

## 质量检查

```bash
pnpm test
pnpm lint
pnpm checkbuild
pnpm audit --prod
```

- `test`：运行 11 种输出 profile、参数互斥、非法组合和文件名处理的单元测试
- `lint`：运行 ESLint，warning 也会使检查失败
- `checkbuild`：先执行 TypeScript project build，再构建 production bundle
- `audit --prod`：检查 production dependency 漏洞

## 运行方式

1. 选择或拖入一个本地视频。
2. 可选：拖动预览下方 Timeline 的片段或两侧 trim handle 设置范围。
3. 设置输出格式和参数。
4. 选择“生成指令”进行复核，或选择“开始转换”。
5. 浏览器会按需加载 FFmpeg core；完成后自动下载结果。

## 隐私与性能边界

- 视频数据只进入当前页面的浏览器内存和 FFmpeg 虚拟文件系统。
- 项目不加载 Analytics，也不将文件或转换参数发送到业务服务器。
- ffmpeg.wasm 的转换速度明显慢于原生 FFmpeg；大型文件与批处理建议使用桌面端工具。
- WebAssembly 存在约 2 GB 的文件/内存边界，实际可用容量还取决于设备内存与浏览器。
- FFmpeg core 约 31 MB，仅在真正开始转换时下载，并在当前页面生命周期内复用。

## 技术栈

- React 18 + TypeScript
- Vite 5
- React Timeline Editor
- React Hook Form + Zod
- Tailwind CSS + Radix UI
- ffmpeg.wasm 0.12
- Vitest

## 浏览器说明

当前默认使用 Single-thread Compatible core。它比原生 FFmpeg 慢，但转换行为更稳定，并且不依赖 `SharedArrayBuffer` 或 Cross-Origin Isolation。日志面板会持续展示 core 初始化、文件写入、编码和输出阶段。

## Demo

- [Bilibili 演示](https://www.bilibili.com/video/BV1KMvTe5ExN/)
- [YouTube 演示](https://www.youtube.com/watch?v=SDm7EcHQV_k)
