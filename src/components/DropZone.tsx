import { UploadIcon } from "@radix-ui/react-icons";
import { useRef, useState } from "react";
import { cn, formatFileSize } from "@/lib/utils";

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;

interface DropzoneProps {
  onChange: (file: File) => void;
  className?: string;
  accept?: string;
}

export default function Dropzone({
  onChange,
  className,
  accept = "video/*",
}: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("请选择浏览器可识别的视频文件。");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("文件超过 FFmpeg.wasm 的 2 GB 内存上限。");
      return;
    }

    setError(null);
    onChange(file);
  };

  return (
    <div className={className}>
      <button
        type="button"
        className={cn(
          "group relative flex h-full min-h-44 w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          "border-foreground/20 bg-card hover:border-primary hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dragActive && "border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]",
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <span className="mb-3 grid size-10 place-items-center rounded-md border bg-muted text-primary transition-colors group-hover:border-primary/40">
          <UploadIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">
          拖入视频或选择文件
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          MP4 · MOV · WEBM · AVI · MKV · MAX 2 GB
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(event) => handleFile(event.target.files?.[0])}
        className="sr-only"
        tabIndex={-1}
      />
      {error && (
        <p className="mt-2 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {error ? error : `单文件大小限制：${formatFileSize(MAX_FILE_SIZE)}`}
      </p>
    </div>
  );
}
