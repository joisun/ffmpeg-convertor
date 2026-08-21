import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function secondsToTime(duration: number): string {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const totalSeconds = Math.floor(safeDuration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

export type TrimRange = {
  start: string;
  duration: string;
};

export const OUTPUT_FORMATS = [
  "webp",
  "gif",
  "mp4",
  "avi",
  "mkv",
  "mov",
  "webm",
  "flv",
  "mpg",
  "ogv",
  "wmv",
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];
export type RateControlMode = "quality" | "bitrate" | "none";
export type QualityKind = "crf" | "qscale" | "webp-quality";

export type OutputProfile = {
  extension: OutputFormat;
  label: string;
  videoCodec: string;
  audioCodec: string | null;
  rateControlModes: readonly RateControlMode[];
  defaultRateControl: RateControlMode;
  quality: {
    kind: QualityKind;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    lowerIsBetter: boolean;
  } | null;
  frameRate: {
    min: number;
    max: number;
    defaultValue: number;
    allowedValues?: readonly number[];
  };
  pixelFormats: readonly string[];
  defaultPixelFormat: string;
  loop: { min: number; max: number; defaultValue: number } | null;
  description: string;
};

const H264_PIXEL_FORMATS = [
  "none",
  "gray",
  "nv12",
  "nv21",
  "yuv420p",
  "yuv422p",
  "yuv444p",
] as const;
const VP8_PIXEL_FORMATS = ["none", "yuv420p"] as const;
const THEORA_PIXEL_FORMATS = ["none", "yuv420p", "yuv422p"] as const;

const h264Quality = {
  kind: "crf",
  label: "质量 / CRF",
  min: 0,
  max: 51,
  step: 1,
  defaultValue: 23,
  lowerIsBetter: true,
} as const;
const DEFAULT_FRAME_RATE = { min: 1, max: 120, defaultValue: 30 } as const;
const GIF_FRAME_RATE = { min: 1, max: 100, defaultValue: 15 } as const;
const MPEG2_FRAME_RATE = {
  min: 24,
  max: 60,
  defaultValue: 30,
  allowedValues: [24, 25, 30, 50, 60],
} as const;

export const OUTPUT_PROFILES: Record<OutputFormat, OutputProfile> = {
  webp: {
    extension: "webp",
    label: "WEBP",
    videoCodec: "libwebp_anim",
    audioCodec: null,
    rateControlModes: ["quality"],
    defaultRateControl: "quality",
    quality: {
      kind: "webp-quality",
      label: "图像质量",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 75,
      lowerIsBetter: false,
    },
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: [],
    defaultPixelFormat: "none",
    loop: { min: 0, max: 65535, defaultValue: 0 },
    description: "Animated WebP · VP8 image · 无音频",
  },
  gif: {
    extension: "gif",
    label: "GIF",
    videoCodec: "gif",
    audioCodec: null,
    rateControlModes: ["none"],
    defaultRateControl: "none",
    quality: null,
    frameRate: GIF_FRAME_RATE,
    pixelFormats: [],
    defaultPixelFormat: "none",
    loop: { min: -1, max: 65535, defaultValue: 0 },
    description: "GIF palette · 无音频 · -1 不循环",
  },
  mp4: {
    extension: "mp4",
    label: "MP4",
    videoCodec: "libx264",
    audioCodec: "aac",
    rateControlModes: ["quality", "bitrate"],
    defaultRateControl: "quality",
    quality: h264Quality,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: H264_PIXEL_FORMATS,
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "H.264 + AAC · 通用兼容",
  },
  avi: {
    extension: "avi",
    label: "AVI",
    videoCodec: "mpeg4",
    audioCodec: "libmp3lame",
    rateControlModes: ["bitrate"],
    defaultRateControl: "bitrate",
    quality: null,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: ["none", "yuv420p"],
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "MPEG-4 Part 2 + MP3",
  },
  mkv: {
    extension: "mkv",
    label: "MKV",
    videoCodec: "libx264",
    audioCodec: "libopus",
    rateControlModes: ["quality", "bitrate"],
    defaultRateControl: "quality",
    quality: h264Quality,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: H264_PIXEL_FORMATS,
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "H.264 + Opus · Matroska",
  },
  mov: {
    extension: "mov",
    label: "MOV",
    videoCodec: "libx264",
    audioCodec: "aac",
    rateControlModes: ["quality", "bitrate"],
    defaultRateControl: "quality",
    quality: h264Quality,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: H264_PIXEL_FORMATS,
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "H.264 + AAC · QuickTime",
  },
  webm: {
    extension: "webm",
    label: "WEBM",
    videoCodec: "libvpx",
    audioCodec: "libopus",
    rateControlModes: ["quality", "bitrate"],
    defaultRateControl: "quality",
    quality: {
      kind: "crf",
      label: "质量 / VP8 CRF",
      min: 4,
      max: 63,
      step: 1,
      defaultValue: 32,
      lowerIsBetter: true,
    },
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: VP8_PIXEL_FORMATS,
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "VP8 + Opus · Compatible core 稳定路径",
  },
  flv: {
    extension: "flv",
    label: "FLV",
    videoCodec: "flv",
    audioCodec: "libmp3lame",
    rateControlModes: ["bitrate"],
    defaultRateControl: "bitrate",
    quality: null,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: ["none", "yuv420p"],
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "Sorenson Spark + MP3",
  },
  mpg: {
    extension: "mpg",
    label: "MPG",
    videoCodec: "mpeg2video",
    audioCodec: "mp2",
    rateControlModes: ["bitrate"],
    defaultRateControl: "bitrate",
    quality: null,
    frameRate: MPEG2_FRAME_RATE,
    pixelFormats: ["none", "yuv420p", "yuv422p"],
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "MPEG-2 Video + MP2",
  },
  ogv: {
    extension: "ogv",
    label: "OGV",
    videoCodec: "libtheora",
    audioCodec: "libvorbis",
    rateControlModes: ["quality", "bitrate"],
    defaultRateControl: "quality",
    quality: {
      kind: "qscale",
      label: "质量 / Theora Q",
      min: 0,
      max: 10,
      step: 1,
      defaultValue: 7,
      lowerIsBetter: false,
    },
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: THEORA_PIXEL_FORMATS,
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "Theora + Vorbis · Ogg",
  },
  wmv: {
    extension: "wmv",
    label: "WMV",
    videoCodec: "wmv2",
    audioCodec: "wmav2",
    rateControlModes: ["bitrate"],
    defaultRateControl: "bitrate",
    quality: null,
    frameRate: DEFAULT_FRAME_RATE,
    pixelFormats: ["none", "yuv420p"],
    defaultPixelFormat: "yuv420p",
    loop: null,
    description: "Windows Media Video 8 + WMA",
  },
};

export function getOutputProfile(filetype: string): OutputProfile {
  if (!OUTPUT_FORMATS.includes(filetype as OutputFormat)) {
    throw new Error(`不支持的输出格式：${filetype}`);
  }
  return OUTPUT_PROFILES[filetype as OutputFormat];
}

export function isFrameRateSupported(profile: OutputProfile, fps: number): boolean {
  if (fps < profile.frameRate.min || fps > profile.frameRate.max) return false;
  return profile.frameRate.allowedValues
    ? profile.frameRate.allowedValues.includes(fps)
    : true;
}

export type GenerateFFmpegParams = {
  bitrate: string;
  compression: number;
  fps: number;
  loop: number;
  pix_fmt?: string;
  rateControl: RateControlMode;
  width: number;
  filetype: OutputFormat;
  input?: string;
  output?: string;
  trim?: TrimRange | null;
};

export type CommandPartsType = {
  input: string;
  output: string;
  executeParts: string[];
};

function quoteShellArgument(argument: string): string {
  if (/^[a-zA-Z0-9_./:=,-]+$/.test(argument)) return argument;
  return `'${argument.replaceAll("'", `'\\''`)}'`;
}

export function generateFFmpegCommand(
  params: GenerateFFmpegParams,
): { command: string; commandParts: CommandPartsType } {
  const {
    bitrate,
    compression,
    fps,
    loop,
    rateControl,
    width,
    filetype,
    pix_fmt = "yuv420p",
    input = "input.mp4",
    output: outputStem = "output",
    trim = null,
  } = params;
  const options = {
    bitrate,
    compression,
    fps,
    loop,
    pix_fmt,
    rateControl,
    width,
    input,
    output: outputStem,
    filetype,
    trim,
  };

  const output = `${options.output}.${options.filetype}`;
  const executeParts: string[] = [];
  const profile = getOutputProfile(options.filetype);

  if (!profile.rateControlModes.includes(options.rateControl)) {
    throw new Error(`${profile.label} 不支持 ${options.rateControl} 码率控制。`);
  }
  if (!isFrameRateSupported(profile, options.fps)) {
    const allowed = profile.frameRate.allowedValues?.join("、");
    throw new Error(
      allowed
        ? `${profile.label} 仅支持 ${allowed} FPS。`
        : `${profile.label} 的 FPS 范围为 ${profile.frameRate.min}–${profile.frameRate.max}。`,
    );
  }
  if (
    !Number.isInteger(options.width) ||
    options.width < 16 ||
    options.width > 5000 ||
    options.width % 2 !== 0
  ) {
    throw new Error("输出宽度必须是 16–5000 之间的偶数。");
  }
  if (
    options.rateControl === "quality" &&
    profile.quality &&
    (options.compression < profile.quality.min || options.compression > profile.quality.max)
  ) {
    throw new Error(
      `${profile.quality.label} 必须在 ${profile.quality.min}–${profile.quality.max} 之间。`,
    );
  }
  if (
    profile.loop &&
    (options.loop < profile.loop.min || options.loop > profile.loop.max)
  ) {
    throw new Error(`${profile.label} 循环次数必须在 ${profile.loop.min}–${profile.loop.max} 之间。`);
  }
  if (!profile.loop && options.loop !== 0) {
    throw new Error(`${profile.label} 不支持循环次数参数。`);
  }

  if (options.trim?.start) {
    executeParts.push("-ss", options.trim.start);
  }

  executeParts.push("-i", options.input);

  if (options.trim?.duration) {
    executeParts.push("-t", options.trim.duration);
  }

  const animationFrameRateOptions = ["gif", "webp"].includes(options.filetype)
    ? ":round=up:eof_action=pass"
    : "";
  const frameRateFilter = `fps=fps=${options.fps}:start_time=0${animationFrameRateOptions}`;
  const videoFilter =
    options.filetype === "gif"
      ? `${frameRateFilter},scale=${options.width}:-2:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`
      : `${frameRateFilter},scale=${options.width}:-2`;
  executeParts.push("-vf", videoFilter, "-c:v", profile.videoCodec);

  if (profile.audioCodec) {
    executeParts.push("-c:a", profile.audioCodec);
  } else {
    executeParts.push("-an");
  }

  if (options.rateControl === "bitrate") {
    executeParts.push("-b:v", options.bitrate);
  } else if (options.rateControl === "quality" && profile.quality) {
    if (profile.quality.kind === "crf") {
      if (options.filetype === "webm") executeParts.push("-b:v", "0");
      executeParts.push("-crf", String(options.compression));
    } else if (profile.quality.kind === "qscale") {
      executeParts.push("-q:v", String(options.compression));
    } else {
      executeParts.push(
        "-quality",
        String(options.compression),
        "-compression_level",
        "4",
      );
    }
  }

  if (profile.loop) {
    executeParts.push("-loop", String(options.loop));
  }

  const pixelFormat = options.pix_fmt?.trim();
  if (
    pixelFormat &&
    pixelFormat !== "none"
  ) {
    if (!profile.pixelFormats.includes(pixelFormat)) {
      throw new Error(`${profile.label} / ${profile.videoCodec} 不支持像素格式 ${pixelFormat}。`);
    }
    executeParts.push("-pix_fmt", pixelFormat);
  }

  executeParts.push(output);

  return {
    command: `ffmpeg ${executeParts.map(quoteShellArgument).join(" ")}`,
    commandParts: {
      input: options.input,
      output,
      executeParts,
    },
  };
}

export function sanitizeFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  const rawName = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  const rawExtension = lastDot > 0 ? filename.slice(lastDot + 1) : "";
  const name =
    rawName
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .replace(/^-+|-+$/g, "") || "output";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  return extension ? `${name}.${extension}` : name;
}

export function getFilenameStem(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const lastDot = sanitized.lastIndexOf(".");
  return lastDot > 0 ? sanitized.slice(0, lastDot) : sanitized;
}

export function getInputFilename(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const lastDot = sanitized.lastIndexOf(".");
  const extension = lastDot > 0 ? sanitized.slice(lastDot + 1) : "mp4";
  return `input.${extension}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];

  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }

  return `${value >= 100 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

export function get24HourTimeStringSuffix() {
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
  return `_${time}`;
}
