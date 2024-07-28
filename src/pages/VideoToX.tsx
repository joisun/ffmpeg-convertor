import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
const formSchema = z.object({
  fps: z.coerce
    .number()
    .lte(120, {
      message: "帧率必须小于120.",
    })
    .gte(10, { message: "帧率必须大于10." }),
  width: z.coerce
    .number()
    .lte(5000, {
      message: "宽度必须小于5000.",
    })
    .gte(1, { message: "宽度必须大于0." }),
  loop: z.coerce.number().gte(0, { message: "循环次数必须大于0." }),
  bitrate: z.string().min(0, { message: "比特率选择不可为空." }),
  compression: z.coerce
    .number()
    .lte(100, {
      message: "压缩级别必须小于100.",
    })
    .gte(0, { message: "压缩级别必须大于0." }),

  select: z.coerce.number(),
  pix_fmt: z.string().optional(),
  filetype: z.string(),
});

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import BiteRateSelector from "@/components/bit-rate-selector";
import { Slider } from "@/components/ui/slider";
import ColorSpaceSelector from "@/components/color-space-selector";
import { CommandPartsType, generateFFmpegCommand } from "@/lib/utils";
import { ReactElement, SVGProps, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import FileTypeSelector from "@/components/file-type-selector";
import Dropzone from "@/components/DropZone";
import VideoClipper from "@/components/VideoClipper";
import { Separator } from "@radix-ui/react-separator";
import { useToast } from "@/components/ui/use-toast";
import NoSafariSupport from "@/components/no-safari-support";
import { useFFmpeg } from "@/lib/FFmpeg.wasm";
import DemoFFmpeg from "@/components/DemoFFmpeg";
import { HugeiconsLoading03, MingcuteCloseFill } from "@/components/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Progress } from "@/components/ui/progress";

export default function ProfileForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fps: 30,
      width: 480,
      loop: 0,
      bitrate: "800k",
      compression: 10,
      select: 1,
      pix_fmt: "yuv420p",
      filetype: "mp4",
    },
  });
  const [command, setCommand] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [videoSrc, setVideoSrc] = useState("")
  const { toast } = useToast();
  const ffmpeg = useFFmpeg();
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleVideoClipperChange = (startPoint: string, endPoint: string) => {
    if (startPoint && endPoint) {
      setTimeRange(`-ss ${startPoint} -t ${endPoint}`);
    } else {
      setTimeRange("");
    }
  };

  const handleDropzoneChange = (files: File[]) => {
    setFiles(() => files)
    setVideoSrc(URL.createObjectURL(files[0]))
  }
  const handleTranscode = async (file: File, commandParts: CommandPartsType) => {
    if (!ffmpeg.isLoaded) {
      console.log('FFmpeg is not loaded yet');
      return;
    }

    try {
      const data = await ffmpeg.transcode(file, commandParts);
      setResult(data);
      console.log('Transcoding completed');
    } catch (error) {
      console.error('Transcoding failed:', error);
    }
  };

  async function onSubmit(
    values: z.infer<typeof formSchema>,
    onlyGenerateCommand?: boolean
  ) {
    const { command, commandParts } = generateFFmpegCommand({
      ...values,
      timeRange,
    });
    setCommand(command);
    if (onlyGenerateCommand) return;

    if (!onlyGenerateCommand && files.length == 0) {
      toast({
        title: "未检测到文件上传，无法执行转换",
        description: "File is not uploaded, Please try again.",
      });
      return;
    }
    const result = await handleTranscode(files[0], commandParts)
    console.log('result', result)
  }

  return (
    <>
      <div className="file mb-8">
        {files[0] ? (
          <VideoClipper src={videoSrc} onClipChange={handleVideoClipperChange}>
            <button
              onClick={() => setFiles([])}
              className="w-12 h-12 bg-black/20 hover:bg-black/30 backdrop-blur-xl absolute hover:scale-110 transition-all top-2 right-2 flex justify-center items-center rounded-lg"
            >
              <MingcuteCloseFill className="text-3xl" />
            </button>
          </VideoClipper>
        ) : (
          <Dropzone
            onChange={handleDropzoneChange}
            className="w-full h-24 my-12 flex items-center justify-center"
            fileExtension="video/*"
          ></Dropzone>
        )}
      </div>
      <Separator className="bg-border h-[1px] my-8" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => onSubmit(form.getValues(), false))}
          className="grid w-full  lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-4"
        >
          <FormField
            control={form.control}
            name="fps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>帧率</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="" {...field} />
                </FormControl>
                <FormDescription>控制输出资源的帧率</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>宽度</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="" {...field} />
                </FormControl>
                <FormDescription>控制输出资源的尺寸</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="loop"
            render={({ field }) => (
              <FormItem>
                <FormLabel>循环次数</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="" {...field} />
                </FormControl>
                <FormDescription>
                  控制输出资源的循环播放次数，0为无限循环
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bitrate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>比特率</FormLabel>
                <FormControl>
                  <BiteRateSelector
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  />
                </FormControl>
                <FormDescription>
                  控制输出资源的循环播放次数，0为无限循环
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="compression"
            render={({ field }) => (
              <FormItem>
                <FormLabel>压缩级别 {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    id="compression"
                    max={100}
                    min={0}
                    defaultValue={[field.value]}
                    step={1}
                    onValueChange={field.onChange}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                  />
                </FormControl>
                <FormDescription>
                  原视频资源的压缩等级，压缩等级越高，输出质量越差，但文件越小
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="select"
            render={({ field }) => (
              <FormItem>
                <FormLabel>抽帧 {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    id="select"
                    max={60}
                    min={1}
                    defaultValue={[field.value]}
                    step={1}
                    onValueChange={field.onChange}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                  />
                </FormControl>
                <FormDescription>间隔抽取帧，合成结果</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pix_fmt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>颜色空间转换</FormLabel>
                <FormControl>
                  <ColorSpaceSelector
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  />
                </FormControl>
                <FormDescription>
                  控制输出资源的循环播放次数，0为无限循环
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="filetype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生成文件类型</FormLabel>
                <FormControl>
                  <FileTypeSelector
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
      <Separator className="bg-border h-[1px] mt-8 mb-4" />
      <Button
        variant={"outline"}
        className="mr-6"
        onClick={form.handleSubmit(() => onSubmit(form.getValues(), true))}
      >
        仅生成指令
      </Button>
      <Button
        variant={"outline"}
        className=""
        onClick={form.handleSubmit(() => onSubmit(form.getValues(), false))}
      >
        生成指令并开始转换 {ffmpeg.isDoing && <HugeiconsLoading03 className="animate-spin ml-2 inline-block" />}
      </Button>

      <span className="ml-4 text-gray-500 inline-flex items-center text-xs">FFmpeg.wasm {ffmpeg.isLoading && <div className="inline-block w-1.5 h-1.5 ml-2 rounded-full bg-yellow-500"></div>} {ffmpeg.isLoaded && <div className="inline-block w-1.5 h-1.5 ml-2 rounded-full bg-green-500"></div>}</span>


      <div className="my-4 h-1 flex items-center gap-4">
        {ffmpeg.progress !== 0 && <> <Progress value={ffmpeg.progress} className="my-4 h-1" /> <span className="text-xs shrink-0">{Math.floor(ffmpeg.transcodedTime)} s</span></>}
      </div>

      {ffmpeg.error &&
        <Alert className="my-4" variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {ffmpeg.error?.message}
          </AlertDescription>
        </Alert>
      }

      {
        ffmpeg.logs.length !== 0 &&
        <Alert className="my-4">
          <AlertTitle>Logs:{ffmpeg.logs.length}</AlertTitle>
          <AlertDescription>
            {ffmpeg.logs.map((i, index) => {
              return <pre key={index} className="mt-4 whitespace-normal">{i}</pre>
            })}
          </AlertDescription>
        </Alert>
      }

      {
        command && <Alert className="my-4">
          <AlertTitle>生成指令:</AlertTitle>
          <AlertDescription>
            <pre className="mt-4 whitespace-normal">{command}</pre>
          </AlertDescription>
        </Alert>
      }


      <Alert className="text-border my-4">
        <AlertTitle className="text-border">No Safari Support !</AlertTitle>
        <AlertDescription>
          Sorry that there is no support for safari, since this project is powered by <a target="_blank" className="underline underline-offset-4" href="https://github.com/diffusion-studio/ffmpeg-js">@diffusion-studio/ffmpeg-js</a>
        </AlertDescription>
      </Alert>
    </>
  );
}
