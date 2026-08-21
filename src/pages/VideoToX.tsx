import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircledIcon,
  CopyIcon,
  Cross2Icon,
  LightningBoltIcon,
  StopIcon,
} from "@radix-ui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import BiteRateSelector from "@/components/bit-rate-selector";
import ColorSpaceSelector from "@/components/color-space-selector";
import Dropzone from "@/components/DropZone";
import FileTypeSelector from "@/components/file-type-selector";
import { HugeiconsLoading03 } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import VideoClipper from "@/components/VideoClipper";
import { useFFmpeg } from "@/lib/FFmpeg.wasm";
import {
  type GenerateFFmpegParams,
  OUTPUT_FORMATS,
  OUTPUT_PROFILES,
  type RateControlMode,
  type TrimRange,
  formatFileSize,
  generateFFmpegCommand,
  get24HourTimeStringSuffix,
  getFilenameStem,
  getInputFilename,
  isFrameRateSupported,
} from "@/lib/utils";

const formSchema = z
  .object({
    fps: z.coerce.number().min(1, "至少为 1 FPS").max(120, "不能超过 120 FPS"),
    width: z.coerce
      .number()
      .min(16, "至少为 16 px")
      .max(5000, "不能超过 5000 px")
      .refine((value) => value % 2 === 0, "宽度必须为偶数"),
    loop: z.coerce.number().int().min(-1, "不能小于 -1").max(65535, "不能超过 65535"),
    bitrate: z.string().min(1, "请选择比特率"),
    compression: z.coerce.number().min(0).max(100),
    output: z
      .string()
      .min(1, "文件名不能为空")
      .max(50, "不能超过 50 个字符")
      .regex(
        /^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/,
        "需以字母、数字或下划线开头；其余仅支持字母、数字、下划线和连字符",
      ),
    pix_fmt: z.string().optional(),
    filetype: z.enum(OUTPUT_FORMATS),
    rateControl: z.enum(["quality", "bitrate", "none"]),
  })
  .superRefine((values, context) => {
    const profile = OUTPUT_PROFILES[values.filetype];

    if (!profile.rateControlModes.includes(values.rateControl)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rateControl"],
        message: `${profile.label} 不支持该码率模式`,
      });
    }

    if (!isFrameRateSupported(profile, values.fps)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fps"],
        message: profile.frameRate.allowedValues
          ? `仅支持 ${profile.frameRate.allowedValues.join("、")} FPS`
          : `有效范围为 ${profile.frameRate.min}–${profile.frameRate.max} FPS`,
      });
    }

    if (
      values.rateControl === "quality" &&
      profile.quality &&
      (values.compression < profile.quality.min || values.compression > profile.quality.max)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compression"],
        message: `有效范围为 ${profile.quality.min}–${profile.quality.max}`,
      });
    }

    if (
      values.pix_fmt &&
      values.pix_fmt !== "none" &&
      !profile.pixelFormats.includes(values.pix_fmt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pix_fmt"],
        message: `${profile.videoCodec} 不支持该像素格式`,
      });
    }

    if (profile.loop && (values.loop < profile.loop.min || values.loop > profile.loop.max)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["loop"],
        message: `有效范围为 ${profile.loop.min}–${profile.loop.max}`,
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const statusCopy = {
  idle: { label: "等待任务", tone: "bg-muted-foreground" },
  loading: { label: "加载引擎", tone: "bg-amber-500" },
  ready: { label: "引擎就绪", tone: "bg-emerald-500" },
  working: { label: "正在转换", tone: "bg-primary" },
  error: { label: "需要重试", tone: "bg-destructive" },
} as const;

export default function VideoToX() {
  const [file, setFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState("");
  const [trim, setTrim] = useState<TrimRange | null>(null);
  const [command, setCommand] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const logRef = useRef<HTMLPreElement | null>(null);
  const { toast } = useToast();
  const ffmpeg = useFFmpeg();
  const engineStatus = statusCopy[ffmpeg.status];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fps: 30,
      width: 1280,
      loop: 0,
      bitrate: "2500k",
      compression: 23,
      pix_fmt: "yuv420p",
      filetype: "mp4",
      rateControl: "quality",
      output: "output",
    },
  });
  const filetype = form.watch("filetype");
  const rateControl = form.watch("rateControl");
  const outputProfile = OUTPUT_PROFILES[filetype];

  useEffect(() => {
    form.setValue("rateControl", outputProfile.defaultRateControl, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("compression", outputProfile.quality?.defaultValue ?? 23, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("pix_fmt", outputProfile.defaultPixelFormat, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("loop", outputProfile.loop?.defaultValue ?? 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!isFrameRateSupported(outputProfile, form.getValues("fps"))) {
      form.setValue("fps", outputProfile.frameRate.defaultValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, outputProfile]);

  useEffect(() => {
    if (!file) {
      setVideoSrc("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const logElement = logRef.current;
    if (logElement) logElement.scrollTop = logElement.scrollHeight;
  }, [ffmpeg.logs]);

  const handleClipChange = useCallback((start: string, duration: string) => {
    setTrim(start && duration ? { start, duration } : null);
  }, []);

  const buildCommand = (values: FormValues, sourceFile: File | null) => {
    const params: GenerateFFmpegParams = {
      ...values,
      trim,
      input: sourceFile ? getInputFilename(sourceFile.name) : "input.mp4",
      output: `${values.output}${get24HourTimeStringSuffix()}`,
    };
    return generateFFmpegCommand(params);
  };

  const generateOnly = (values: FormValues) => {
    const result = buildCommand(values, file);
    setCommand(result.command);
    setActionMessage("FFmpeg 指令已生成");
    toast({
      title: "指令已生成",
      description: file ? "已使用当前文件与参数。" : "输入文件暂用 input.mp4 占位。",
    });
  };

  const convert = async (values: FormValues) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "请先选择视频",
        description: "转换需要本地视频；仅生成指令则不需要。",
      });
      return;
    }

    const result = buildCommand(values, file);
    setCommand(result.command);

    try {
      await ffmpeg.transcode(file, result.commandParts);
      setActionMessage("转换完成，下载已经开始");
      toast({ title: "转换完成", description: `${result.commandParts.output} 已开始下载。` });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setActionMessage("任务已取消");
        return;
      }
      toast({
        variant: "destructive",
        title: "转换未完成",
        description: "请查看错误信息，调整参数后重试。",
      });
    }
  };

  const handleFile = (nextFile: File) => {
    setFile(nextFile);
    setTrim(null);
    form.setValue("output", getFilenameStem(nextFile.name), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeFile = () => {
    setFile(null);
    setTrim(null);
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      toast({ title: "已复制 FFmpeg 指令" });
    } catch {
      toast({ variant: "destructive", title: "复制失败", description: "请手动选择复制。" });
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(17rem,42vh)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-1">
      <section className="flex min-h-0 min-w-0 flex-col bg-muted/30 p-2.5 sm:p-3" aria-label="视频预览与剪辑">
        <div className="mb-2 flex h-9 shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Source / Preview
            </p>
            <p className="truncate text-xs font-medium">
              {file ? file.name : "尚未选择视频"}
            </p>
          </div>
          {file && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                {formatFileSize(file.size)} · {file.type || "unknown"}
              </span>
              <Button type="button" variant="outline" size="sm" className="h-8 px-2.5" onClick={removeFile}>
                <Cross2Icon className="mr-1.5" />移除
              </Button>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1">
          {file && videoSrc ? (
            <VideoClipper src={videoSrc} onClipChange={handleClipChange} />
          ) : (
            <Dropzone onChange={handleFile} className="h-full" />
          )}
        </div>
      </section>

      <aside className="flex min-h-0 min-w-0 flex-col border-t bg-card lg:border-l lg:border-t-0" aria-label="输出参数">
        <div className="flex h-11 shrink-0 items-center justify-between border-b px-3.5">
          <div>
            <h1 className="text-sm font-semibold">输出参数</h1>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Inspector</p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`size-1.5 rounded-full ${engineStatus.tone}`} />
            {engineStatus.label}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <Form {...form}>
            <form className="grid grid-cols-2 gap-x-3 gap-y-3" aria-label="FFmpeg 输出参数">
              <FormField
                control={form.control}
                name="filetype"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs">格式</FormLabel>
                    <FormControl><FileTypeSelector value={field.value} onValueChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rateControl"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs">码率模式</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as RateControlMode)}
                      disabled={outputProfile.rateControlModes.length === 1}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {outputProfile.rateControlModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode === "quality"
                              ? "恒定质量"
                              : mode === "bitrate"
                                ? "目标码率"
                                : "无需设置"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <div className="col-span-2 -mt-1 rounded-md border bg-muted/40 px-2.5 py-2">
                <p className="font-mono text-[10px] font-medium text-foreground">
                  {outputProfile.videoCodec}
                  {outputProfile.audioCodec ? ` + ${outputProfile.audioCodec}` : " · no audio"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {outputProfile.description}
                </p>
              </div>
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs">宽度 / px</FormLabel>
                    <FormControl><Input type="number" inputMode="numeric" {...field} /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fps"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="flex justify-between text-xs">
                      <span>帧率 / FPS</span>
                      {outputProfile.frameRate.allowedValues && (
                        <span className="font-normal text-muted-foreground">
                          {outputProfile.frameRate.allowedValues.join("/")}
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={outputProfile.frameRate.min}
                        max={outputProfile.frameRate.max}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bitrate"
                render={({ field }) => (
                    <FormItem className="min-w-0 space-y-1.5">
                    <FormLabel className="flex justify-between text-xs">
                      <span>比特率</span>
                      {rateControl !== "bitrate" && (
                        <span className="font-normal text-muted-foreground">当前模式禁用</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <BiteRateSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={rateControl !== "bitrate"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pix_fmt"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-1.5">
                    <FormLabel className="flex justify-between text-xs">
                      <span>像素格式</span>
                      {outputProfile.pixelFormats.length === 0 && (
                        <span className="font-normal text-muted-foreground">自动管理</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <ColorSpaceSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        allowedValues={outputProfile.pixelFormats}
                        disabled={outputProfile.pixelFormats.length === 0}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loop"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="flex justify-between text-xs">
                      <span>循环次数</span>
                      {!outputProfile.loop && (
                        <span className="font-normal text-muted-foreground">格式不支持</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={outputProfile.loop?.min}
                        max={outputProfile.loop?.max}
                        disabled={!outputProfile.loop}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="compression"
                render={({ field }) => (
                  <FormItem className="col-span-2 space-y-1.5 border-t pt-3">
                    <FormLabel className="flex justify-between text-xs">
                      <span>
                        {outputProfile.quality?.label ?? "质量参数"}
                        {outputProfile.quality && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            {outputProfile.quality.lowerIsBetter ? "低值质量更高" : "高值质量更高"}
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {rateControl === "quality" && outputProfile.quality ? field.value : "Disabled"}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        className="compact-slider"
                        value={[field.value]}
                        max={outputProfile.quality?.max ?? 100}
                        min={outputProfile.quality?.min ?? 0}
                        step={outputProfile.quality?.step ?? 1}
                        disabled={rateControl !== "quality" || !outputProfile.quality}
                        onValueChange={([value]) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="output"
                render={({ field }) => (
                  <FormItem className="col-span-2 space-y-1.5 border-t pt-3">
                    <FormLabel className="text-xs">输出文件名</FormLabel>
                    <FormControl><Input type="text" placeholder="output" autoComplete="off" {...field} /></FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {ffmpeg.error && (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>FFmpeg 无法完成任务</AlertTitle>
              <AlertDescription>{ffmpeg.error.message}</AlertDescription>
            </Alert>
          )}
          <section className="mt-3 overflow-hidden rounded-md border" aria-labelledby="logs-title">
            <div className="flex items-center justify-between border-b px-2.5 py-2">
              <h2 id="logs-title" className="text-xs font-medium">FFmpeg 日志</h2>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {ffmpeg.logs.length > 0 ? `${ffmpeg.logs.length} lines` : "Waiting"}
              </span>
            </div>
            <pre
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-label="FFmpeg 实时日志"
              className="h-28 overflow-auto whitespace-pre-wrap break-words bg-muted/50 p-2.5 font-mono text-[10px] leading-4 text-muted-foreground"
            >
              {ffmpeg.logs.length > 0 ? ffmpeg.logs.join("\n") : "等待开始转换…"}
            </pre>
          </section>
          {command && (
            <section className="mt-3 overflow-hidden rounded-md border" aria-labelledby="command-title">
              <div className="flex items-center justify-between gap-2 border-b px-2.5 py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <CheckCircledIcon className="shrink-0 text-primary" />
                  <h2 id="command-title" className="truncate text-xs font-medium">FFmpeg 指令</h2>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={copyCommand} aria-label="复制 FFmpeg 指令">
                  <CopyIcon />
                </Button>
              </div>
              <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all bg-muted/50 p-2.5 font-mono text-[10px] leading-4 text-muted-foreground"><code>{command}</code></pre>
            </section>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t bg-card p-3">
          {(ffmpeg.isDoing || ffmpeg.isLoading || ffmpeg.progress > 0) && (
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
                <span>{ffmpeg.isLoading ? "初始化引擎" : `${Math.round(ffmpeg.progress)}%`}</span>
                <span>{ffmpeg.isLoading ? "Local core" : `${Math.floor(ffmpeg.transcodedTime)}s`}</span>
              </div>
              <Progress
                value={ffmpeg.isLoading ? undefined : ffmpeg.progress}
                className={`h-1 ${ffmpeg.isLoading ? "indeterminate-progress" : ""}`}
              />
            </div>
          )}
          <div className="grid grid-cols-[0.85fr_1.15fr] gap-2">
            <Button type="button" variant="outline" size="sm" onClick={form.handleSubmit(generateOnly)} disabled={ffmpeg.isDoing}>
              <CopyIcon className="mr-1.5" />生成指令
            </Button>
            <Button type="button" size="sm" onClick={form.handleSubmit(convert)} disabled={ffmpeg.isDoing || ffmpeg.isLoading}>
              {ffmpeg.isLoading || ffmpeg.isDoing ? <HugeiconsLoading03 className="mr-1.5 animate-spin" /> : <LightningBoltIcon className="mr-1.5" />}
              {ffmpeg.isLoading ? "加载引擎" : ffmpeg.isDoing ? "转换中" : "开始转换"}
            </Button>
          </div>
          {(ffmpeg.isDoing || ffmpeg.isLoading) && (
            <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={ffmpeg.cancel}>
              <StopIcon className="mr-1.5" />取消任务
            </Button>
          )}
          <p className="min-h-4 truncate text-center font-mono text-[9px] text-muted-foreground" role="status" aria-live="polite">
            {actionMessage || `${ffmpeg.openMT ? "Multi-thread" : "Compatible"} · 浏览器本地处理`}
          </p>
        </div>
      </aside>
    </div>
  );
}
