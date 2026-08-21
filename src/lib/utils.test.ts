import { describe, expect, it } from "vitest";
import {
  type GenerateFFmpegParams,
  OUTPUT_FORMATS,
  OUTPUT_PROFILES,
  formatFileSize,
  generateFFmpegCommand,
  getFilenameStem,
  getInputFilename,
  sanitizeFilename,
  secondsToTime,
} from "./utils";

const defaultParams = {
  bitrate: "2500k",
  compression: 23,
  fps: 30,
  loop: 0,
  pix_fmt: "yuv420p",
  rateControl: "quality",
  width: 1280,
  filetype: "mp4",
  input: "input file.mp4",
  output: "result",
} satisfies GenerateFFmpegParams;

describe("generateFFmpegCommand", () => {
  it("keeps every FFmpeg argument intact instead of splitting quoted filters", () => {
    const { command, commandParts } = generateFFmpegCommand(defaultParams);

    expect(commandParts.executeParts).toEqual([
      "-i",
      "input file.mp4",
      "-vf",
      "fps=fps=30:start_time=0,scale=1280:-2",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "result.mp4",
    ]);
    expect(command).toContain("'input file.mp4'");
    expect(command).not.toContain("-b:v");
  });

  it("places trim arguments before input and duration after input", () => {
    const { commandParts } = generateFFmpegCommand({
      ...defaultParams,
      trim: { start: "00:00:04", duration: "00:00:08" },
    });

    expect(commandParts.executeParts.slice(0, 6)).toEqual([
      "-ss",
      "00:00:04",
      "-i",
      "input file.mp4",
      "-t",
      "00:00:08",
    ]);
  });

  it.each(OUTPUT_FORMATS)("uses an explicit compatible codec profile for %s", (filetype) => {
    const profile = OUTPUT_PROFILES[filetype];
    const command = generateFFmpegCommand({
      ...defaultParams,
      filetype,
      rateControl: profile.defaultRateControl,
      compression: profile.quality?.defaultValue ?? 23,
      pix_fmt: profile.defaultPixelFormat,
      loop: profile.loop?.defaultValue ?? 0,
    }).commandParts.executeParts;

    expect(command).toContain("-c:v");
    expect(command[command.indexOf("-c:v") + 1]).toBe(profile.videoCodec);
    if (profile.audioCodec) {
      expect(command[command.indexOf("-c:a") + 1]).toBe(profile.audioCodec);
      expect(command).not.toContain("-an");
    } else {
      expect(command).toContain("-an");
    }

    expect(command.includes("-loop")).toBe(Boolean(profile.loop));
    expect(command.includes("-pix_fmt")).toBe(profile.defaultPixelFormat !== "none");
  });

  it("keeps quality and target bitrate modes mutually exclusive", () => {
    const quality = generateFFmpegCommand(defaultParams).commandParts.executeParts;
    const bitrate = generateFFmpegCommand({
      ...defaultParams,
      rateControl: "bitrate",
    }).commandParts.executeParts;

    expect(quality).toContain("-crf");
    expect(quality).not.toContain("-b:v");
    expect(bitrate).toContain("-b:v");
    expect(bitrate).not.toContain("-crf");
  });

  it("uses WebM constant-quality semantics and codec-specific image options", () => {
    const webm = generateFFmpegCommand({
      ...defaultParams,
      filetype: "webm",
      rateControl: "quality",
      compression: 32,
    }).commandParts.executeParts;
    const webp = generateFFmpegCommand({
      ...defaultParams,
      filetype: "webp",
      rateControl: "quality",
      compression: 75,
      pix_fmt: "none",
    }).commandParts.executeParts;
    const gif = generateFFmpegCommand({
      ...defaultParams,
      filetype: "gif",
      rateControl: "none",
      pix_fmt: "none",
      loop: -1,
    }).commandParts.executeParts;

    expect(webm.slice(webm.indexOf("-b:v"), webm.indexOf("-b:v") + 2)).toEqual([
      "-b:v",
      "0",
    ]);
    expect(webm).toContain("-crf");
    expect(webp).toContain("-quality");
    expect(webp).toContain("-compression_level");
    expect(webp).not.toContain("-crf");
    expect(gif[gif.indexOf("-loop") + 1]).toBe("-1");
    expect(gif[gif.indexOf("-vf") + 1]).toContain("palettegen");
  });

  it("rejects combinations outside the selected encoder capability", () => {
    expect(() =>
      generateFFmpegCommand({
        ...defaultParams,
        filetype: "wmv",
        rateControl: "bitrate",
        pix_fmt: "rgba",
      }),
    ).toThrow("不支持像素格式 rgba");

    expect(() =>
      generateFFmpegCommand({
        ...defaultParams,
        filetype: "mpg",
        rateControl: "bitrate",
        fps: 17,
      }),
    ).toThrow("仅支持 24、25、30、50、60 FPS");

    expect(() =>
      generateFFmpegCommand({
        ...defaultParams,
        loop: 2,
      }),
    ).toThrow("MP4 不支持循环次数参数");

    expect(() =>
      generateFFmpegCommand({
        ...defaultParams,
        filetype: "webm",
        compression: 0,
      }),
    ).toThrow("VP8 CRF 必须在 4–63 之间");
  });
});

describe("filename helpers", () => {
  it("creates safe, non-empty virtual filenames", () => {
    expect(sanitizeFilename("旅行 2026 (final).MP4")).toBe("2026final.mp4");
    expect(sanitizeFilename("旅行.mov")).toBe("output.mov");
    expect(getFilenameStem("---.mp4")).toBe("output");
    expect(getInputFilename("clip.webm")).toBe("input.webm");
  });
});

describe("display helpers", () => {
  it("formats durations and file sizes defensively", () => {
    expect(secondsToTime(3661.9)).toBe("01:01:01");
    expect(secondsToTime(Number.NaN)).toBe("00:00:00");
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
});
