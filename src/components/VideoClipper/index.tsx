import {
  Timeline,
  type TimelineState,
} from "@xzdarcy/react-timeline-editor";
import "@xzdarcy/react-timeline-editor/dist/react-timeline-editor.css";
import { useEffect, useMemo, useRef, useState } from "react";

const MIN_CLIP_DURATION = 0.1;

interface TimelineActionData {
  id: string;
  start: number;
  end: number;
  effectId: string;
  selected?: boolean;
  flexible?: boolean;
  movable?: boolean;
  minStart?: number;
  maxEnd?: number;
}

interface TimelineRowData {
  id: string;
  actions: TimelineActionData[];
  classNames?: string[];
}

interface TimelineEffectData {
  id: string;
  name?: string;
}

function formatTimecode(value: number) {
  const totalMilliseconds = Math.round(Math.max(0, value) * 1000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${[hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")}.${String(milliseconds).padStart(3, "0")}`;
}

interface VideoClipperProps {
  src: string;
  onClipChange: (startPoint: string, duration: string) => void;
  children?: React.ReactNode;
}

export default function VideoClipper({
  src,
  onClipChange,
  children,
}: VideoClipperProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<TimelineState | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [editorData, setEditorData] = useState<TimelineRowData[]>([]);
  const effects = useMemo<Record<string, TimelineEffectData>>(
    () => ({ video: { id: "video", name: "视频片段" } }),
    [],
  );

  useEffect(() => {
    setDuration(0);
    setStart(0);
    setEnd(0);
    setCurrentTime(0);
    setEditorData([]);
  }, [src]);

  useEffect(() => {
    if (!duration || (start === 0 && Math.abs(end - duration) < MIN_CLIP_DURATION)) {
      onClipChange("", "");
      return;
    }

    onClipChange(formatTimecode(start), formatTimecode(end - start));
  }, [duration, end, onClipChange, start]);

  const previewAt = (time: number) => {
    const nextTime = Math.min(duration, Math.max(0, time));
    if (videoRef.current) videoRef.current.currentTime = nextTime;
    timelineRef.current?.setTime(nextTime);
    setCurrentTime(nextTime);
  };

  const updateSelection = (nextData: TimelineRowData[]) => {
    const action = nextData[0]?.actions[0];
    if (!action) return;
    setEditorData(nextData);
    setStart(action.start);
    setEnd(action.end);
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_7.5rem] overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="relative flex min-h-0 items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          onLoadedMetadata={(event) => {
            const nextDuration = Number.isFinite(event.currentTarget.duration)
              ? event.currentTarget.duration
              : 0;
            setDuration(nextDuration);
            setStart(0);
            setEnd(nextDuration);
            setEditorData([
              {
                id: "video-track",
                classNames: ["media-timeline-row"],
                actions: [
                  {
                    id: "source-video",
                    effectId: "video",
                    start: 0,
                    end: nextDuration,
                    flexible: true,
                    movable: true,
                    minStart: 0,
                    maxEnd: nextDuration,
                    selected: true,
                  },
                ],
              },
            ]);
          }}
          onTimeUpdate={(event) => {
            const time = event.currentTarget.currentTime;
            timelineRef.current?.setTime(time);
            setCurrentTime(time);
          }}
        />
        {children}
        <output className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/80 backdrop-blur">
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </output>
      </div>

      <section className="media-timeline min-w-0 border-t bg-card" aria-label="视频剪辑时间线">
        <div className="flex h-7 items-center justify-between border-b px-3 text-[10px]">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">Timeline</span>
          <output className="font-mono text-primary">
            IN {formatTimecode(start)} · OUT {formatTimecode(end)} · {formatTimecode(end - start)}
          </output>
        </div>
        {duration > 0 ? (
          <Timeline
            ref={timelineRef}
            editorData={editorData}
            effects={effects}
            scale={1}
            scaleSplitCount={10}
            scaleWidth={88}
            minScaleCount={Math.max(5, Math.ceil(duration))}
            maxScaleCount={Math.max(5, Math.ceil(duration))}
            startLeft={12}
            rowHeight={46}
            gridSnap
            dragLine
            autoScroll
            onChange={updateSelection}
            onActionMoving={({ start: nextStart }) => previewAt(nextStart)}
            onActionResizing={({ start: nextStart, end: nextEnd, dir }) => {
              if (nextStart < 0 || nextEnd > duration || nextEnd - nextStart < MIN_CLIP_DURATION) {
                return false;
              }
              previewAt(dir === "left" ? nextStart : nextEnd);
            }}
            onCursorDrag={previewAt}
            onClickTimeArea={(time) => {
              previewAt(time);
              return true;
            }}
            getActionRender={() => (
              <div className="flex h-full min-w-0 items-center gap-2 px-3">
                <span className="size-1.5 shrink-0 rounded-full bg-current" />
                <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider">
                  Video
                </span>
              </div>
            )}
            style={{ width: "100%", height: 92 }}
          />
        ) : (
          <div className="m-3 h-12 animate-pulse rounded bg-muted" aria-label="正在读取视频时长" />
        )}
      </section>
    </div>
  );
}
