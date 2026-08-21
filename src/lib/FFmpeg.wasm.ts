import type { FFmpeg, FileData } from "@ffmpeg/ffmpeg";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommandPartsType } from "./utils";

const CORE_LOAD_TIMEOUT = 30_000;
const MAX_LOGS = 200;

export type EngineStatus = "idle" | "loading" | "ready" | "working" | "error";

interface FFmpegInstance {
  load: () => Promise<void>;
  transcode: (file: File, commandParts: CommandPartsType) => Promise<void>;
  cancel: () => void;
  isLoaded: boolean;
  isDoing: boolean;
  isLoading: boolean;
  status: EngineStatus;
  progress: number;
  transcodedTime: number;
  logs: string[];
  error: Error | null;
  openMT: boolean;
}

function getCoreAssetURL(filename: string) {
  return new URL(
    `${import.meta.env.BASE_URL}ffmpeg-core/st/${filename}`,
    window.location.href,
  ).href;
}

async function withTimeout<T>(promise: Promise<T>, timeout: number, message: string) {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeout);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getOutputMime(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    avi: "video/x-msvideo",
    flv: "video/x-flv",
    gif: "image/gif",
    mkv: "video/x-matroska",
    mov: "video/quicktime",
    mp4: "video/mp4",
    mpg: "video/mpeg",
    ogv: "video/ogg",
    webm: "video/webm",
    webp: "image/webp",
    wmv: "video/x-ms-wmv",
  };
  return mimeTypes[extension ?? ""] ?? "application/octet-stream";
}

function downloadData(file: FileData, filename: string) {
  if (typeof file === "string") {
    throw new Error("FFmpeg 返回了非二进制结果，无法下载。");
  }

  const url = URL.createObjectURL(new Blob([file], { type: getOutputMime(filename) }));
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = url;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function useFFmpeg(): FFmpegInstance {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const operationGenerationRef = useRef(0);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [transcodedTime, setTranscodedTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((currentLogs) => [...currentLogs, message].slice(-MAX_LOGS));
  }, []);

  const createEngine = useCallback(
    async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      ffmpeg.on("log", ({ message }) => {
        if (message.trim() !== "Aborted()") addLog(message);
      });
      ffmpeg.on("progress", ({ progress: nextProgress, time }) => {
        const percentage = Number.isFinite(nextProgress)
          ? Math.min(100, Math.max(0, nextProgress * 100))
          : 0;
        setProgress(percentage);
        setTranscodedTime(Math.max(0, time / 1_000_000));
      });

      addLog("正在初始化 Compatible core…");

      try {
        await withTimeout(
          ffmpeg.load({
            coreURL: getCoreAssetURL("ffmpeg-core.js"),
            wasmURL: getCoreAssetURL("ffmpeg-core.wasm"),
          }),
          CORE_LOAD_TIMEOUT,
          "Compatible core 初始化超时。",
        );
      } catch (caughtError) {
        ffmpeg.terminate();
        throw caughtError;
      }

      return ffmpeg;
    },
    [addLog],
  );

  const load = useCallback(async () => {
    if (ffmpegRef.current?.loaded) return;
    if (loadPromiseRef.current) return loadPromiseRef.current;

    setStatus("loading");
    setError(null);
    setLogs(["正在准备本地 FFmpeg runtime…"]);
    const loadGeneration = operationGenerationRef.current;

    const loadPromise = (async () => {
      const engine = await createEngine();
      if (loadGeneration !== operationGenerationRef.current) {
        engine.terminate();
        throw new DOMException("任务已取消", "AbortError");
      }
      ffmpegRef.current = engine;
      addLog("Compatible core 已就绪。");

      setStatus("ready");
    })()
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
          throw caughtError;
        }
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error("FFmpeg 核心加载失败，请检查网络后重试。");
        setError(normalizedError);
        setStatus("error");
        throw normalizedError;
      })
      .finally(() => {
        if (loadPromiseRef.current === loadPromise) {
          loadPromiseRef.current = null;
        }
      });

    loadPromiseRef.current = loadPromise;
    return loadPromise;
  }, [addLog, createEngine]);

  const transcode = useCallback(
    async (file: File, commandParts: CommandPartsType) => {
      await load();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg?.loaded) throw new Error("FFmpeg 核心尚未就绪。");
      const transcodeGeneration = operationGenerationRef.current;

      setStatus("working");
      setError(null);
      setProgress(0);
      setTranscodedTime(0);

      try {
        const { fetchFile } = await import("@ffmpeg/util");
        addLog(`正在读取输入文件：${file.name}`);
        const inputData = await fetchFile(file);
        addLog("正在写入 FFmpeg 虚拟文件系统…");
        await ffmpeg.writeFile(commandParts.input, inputData);
        addLog(`开始执行：ffmpeg ${commandParts.executeParts.join(" ")}`);
        const exitCode = await ffmpeg.exec(commandParts.executeParts);
        if (exitCode !== 0) {
          throw new Error(`FFmpeg 转换失败，退出码：${exitCode}`);
        }

        addLog("编码完成，正在读取输出文件…");
        const result = await ffmpeg.readFile(commandParts.output);
        downloadData(result, commandParts.output);
        addLog(`已生成并下载：${commandParts.output}`);
        setProgress(100);
        setStatus("ready");
      } catch (caughtError: unknown) {
        if (transcodeGeneration !== operationGenerationRef.current) {
          throw new DOMException("任务已取消", "AbortError");
        }
        const normalizedError =
          caughtError instanceof Error
            ? caughtError
            : new Error("转换失败，请调整参数后重试。");
        setError(normalizedError);
        setStatus("error");
        throw normalizedError;
      } finally {
        await Promise.allSettled([
          ffmpeg.deleteFile(commandParts.input),
          ffmpeg.deleteFile(commandParts.output),
        ]);
      }
    },
    [addLog, load],
  );

  const cancel = useCallback(() => {
    operationGenerationRef.current += 1;
    ffmpegRef.current?.terminate();
    ffmpegRef.current = null;
    loadPromiseRef.current = null;
    setProgress(0);
    setTranscodedTime(0);
    setError(null);
    setStatus("idle");
    addLog("任务已取消。下次转换会重新加载 FFmpeg 核心。");
  }, [addLog]);

  useEffect(
    () => () => {
      ffmpegRef.current?.terminate();
      ffmpegRef.current = null;
    },
    [],
  );

  return {
    load,
    transcode,
    cancel,
    isLoaded: status === "ready" || status === "working",
    isLoading: status === "loading",
    isDoing: status === "working",
    status,
    progress,
    transcodedTime,
    logs,
    error,
    openMT: false,
  };
}
