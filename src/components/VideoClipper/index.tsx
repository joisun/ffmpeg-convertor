import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import DragHandler, { HandlerEnum } from "./DragHandler";
import { cn, secondsToTime, throttle } from "@/lib/utils";
import {
  IcRoundPause,
  IcRoundPlayArrow,
  MaterialSymbolsVolumeUp,
} from "../icons";

interface VideoClipperProps extends React.HTMLAttributes<HTMLVideoElement> {
  src: string;
  onClipChange: (startPoint: string, endPoint: string) => void;
}

export default function VideoClipper({
  onClipChange,
  ...props
}: VideoClipperProps) {
  const [play, setPlay] = useState(false);
  const [range, setRange] = useState([0, 0]);
  const [startPoint, setStartPoint] = useState("");// 时间 tag
  const [endPoint, setEndPoint] = useState("");

  // const [startTime, setStartTime] = useState(0);// 时间 tag
  // const [endTime, setEndTime] = useState(0);
  // xTimeRef 用于解决 useEffect 闭包陷阱
  const startTimeRef = useRef(0);
  const endTimeRef = useRef(0);
  const setStartTime = (val: number)=>{startTimeRef.current = val}
  const setEndTime = (val: number)=>{endTimeRef.current = val}

  const [volumVisible, setVolumVisible] = useState(false);
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 初始化 时间 tag
    const handleLoadedmetadata = () => {
      const duration = video.duration
      setStartPoint(secondsToTime(0))
      setEndPoint(secondsToTime(duration))
      setDuration(duration)
      setStartTime(0)
      setEndTime(duration)
    }

    // 同步播放按钮
    const handlePlay = () => setPlay(true);
    const handlePause = () => setPlay(false);
    // 自动循环播放， 让视频始终在指定范围内重复播放
    const handleTimeupdate = ()=>{
      // ! 注意：这里的回调触发频率是没有特别高的， 可能会导致听感的时间间隔和实际导出的参数设定有一秒左右的误差， 如果需要非常精确， 可以使用 requestAniamtion
      if(videoRef.current && videoRef.current.currentTime > endTimeRef.current){
        playAtFromRangeStart()
      }
    }

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedmetadata)
    video.addEventListener("timeupdate", handleTimeupdate)

 

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedmetadata)
      video.removeEventListener("timeupdate", handleTimeupdate)


    };
  }, []);

  // 初始化 range 条
  const initRange = (isStart: boolean, e: number) => updateRange(isStart, e);
  // 更新 range 条
  const updateRange = (isStart: boolean, e: number) => {
    const newRange = Array.from(range);
    newRange[isStart ? 0 : 1] = e;
    setRange(newRange);
  };
  const handleChange = (isStart: boolean, e: number, percentage: number) => {
    updateRange(isStart, e);
    const newTime = duration * percentage
    const formatedTimeStr = secondsToTime(newTime);
    
    // xTimeRef 用于解决 useEffect 闭包陷阱
    isStart ? startTimeRef.current = newTime : endTimeRef.current = newTime;
    isStart ? setStartTime(newTime) : setEndTime(newTime);

    isStart ? setStartPoint(formatedTimeStr) : setEndPoint(formatedTimeStr);



    // 起始时刻 + 持续时间
    const lastingTime = endTimeRef.current - startTimeRef.current
    onClipChange(startPoint, secondsToTime(lastingTime));
    throttledPlay();
  };

  const handlePlay = function () {
    play ? videoRef.current?.pause() : videoRef.current?.play();
    setPlay(!play);
  };
  const handleVolChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    videoRef.current && (videoRef.current.volume = Number(target.value));
  };

  // 设定播放时间点并播放
  const playAtFromRangeStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTimeRef.current;
      videoRef.current.play();
    }
  };
  const throttledPlay = throttle(playAtFromRangeStart, 100);

  return (
    <div className="relative w-full max-w-[800px] mx-auto">
      <video
        onError={(e) => console.error("Video error:", e)}
        onPlay={() => console.log("Video started playing")}
        onPause={() => console.log("Video paused")}
        ref={videoRef}
        className="relative w-full"
        {...props}
      ></video>
      <div className="absolute flex gap-4 px-4 justify-between items-center z-20 bottom-12 left-1/2 rounded-2xl  backdrop-blur-2xl  -translate-x-1/2 z-1000 controller h-14 w-11/12 bg-black/40">
        <button
          className="text-4xl"
          onClick={handlePlay}
        >
          {play ? <IcRoundPause /> : <IcRoundPlayArrow />}
        </button>
        <div className="con-bar flex-1 bg-white/20 rounded-2xl backdrop-blur-3xl h-4 relative flex items-center transition-all">
          <DragHandler
            initRange={initRange}
            onPositionChange={(e, p) => handleChange(true, e, p)}
            type={HandlerEnum.START}
          >
            {startPoint}
          </DragHandler>
          <DragHandler
            initRange={initRange}
            onPositionChange={(e, p) => handleChange(false, e, p)}
            type={HandlerEnum.END}
          >
            {endPoint}
          </DragHandler>
          <div
            className="range-bar absolute z-10 bg-green-500/80 h-full"
            style={{ left: range[0], right: `calc(100% - ${range[1]}px)` }}
          ></div>
        </div>
        <button
          className="text-3xl "
          onClick={() => setVolumVisible(!volumVisible)}
        >
          <MaterialSymbolsVolumeUp />
        </button>
        {volumVisible && (
          <input
            onChange={(e) => handleVolChange(e)}
            className={cn(
              "absolute -right-14 -top-0 -rotate-90 transition-all w-20 ",
              "appearance-none bg-transparent",
              "[&::-webkit-slider-runnable-track]:rounded-full",
              " [&::-webkit-slider-runnable-track]:bg-black/80",
              " [&::-webkit-slider-runnable-track]:backdrop-blur-2xl",
              "[&::-webkit-slider-thumb]:appearance-none ",
              "[&::-webkit-slider-thumb]:h-4 ",
              "[&::-webkit-slider-thumb]:w-4 ",
              "[&::-webkit-slider-thumb]:rounded-full ",
              "[&::-webkit-slider-thumb]:bg-white"
            )}
            type="range"
            id="volumeSlider"
            min="0"
            max="1"
            step="0.01"
          ></input>
        )}
      </div>
      {props.children}
    </div>
  );
}



