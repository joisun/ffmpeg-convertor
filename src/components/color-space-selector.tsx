import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BiteRateSelectorProps extends React.HTMLAttributes<HTMLElement> {
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

export default function ColorSpaceSelector({
  defaultValue,
  onValueChange,
}: BiteRateSelectorProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="选择颜色空间" />
      </SelectTrigger>
      <SelectContent>
          <SelectItem value=" "> 无选择</SelectItem>
        <SelectGroup>
          <SelectLabel className="text-border">单调</SelectLabel>
          <SelectItem value="gray"> gray - 灰度图像</SelectItem>
          <SelectItem value="monob"> monob - 单色二值图像</SelectItem>
          <SelectItem value="pal8"> pal8 - 8位调色板</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-border">RGB</SelectLabel>
          <SelectItem value="rgb8"> rgb8</SelectItem>
          <SelectItem value="rgb24"> rgb24</SelectItem>
          <SelectItem value="rgb32"> rgb32</SelectItem>
          <SelectItem value="rgb48be">rgb48be - 48位 RGB 格式(大端)</SelectItem>
          <SelectItem value="rgb48le">rgb48le - 48位 RGB 格式(小端)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-border">RGBA</SelectLabel>
          <SelectItem value="rgba"> rgba</SelectItem>
          <SelectItem value="bgra"> bgra</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="text-border">YUV</SelectLabel>
          <SelectItem value="nv12"> nv12 </SelectItem>
          <SelectItem value="nv21">nv21</SelectItem>
          <SelectItem value="yuv420p"> yuv420p</SelectItem>
          <SelectItem value="yuv422p"> yuv422p</SelectItem>
          <SelectItem value="yuv444p"> yuv444p</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
