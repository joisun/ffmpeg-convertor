import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BiteRateSelectorProps extends React.HTMLAttributes<HTMLElement> {
  onValueChange: (value: string)=>void
  defaultValue: string
}

export default function BiteRateSelector({defaultValue,onValueChange}: BiteRateSelectorProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger >
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="100k"> 100k - 非常低质量，适用于极小的文件大小需求或非常低分辨率的视频</SelectItem>
        <SelectItem value="250k"> 250k - 低质量，适用于移动设备上的小视频或低带宽情况</SelectItem>
        <SelectItem value="500k"> 500k - 中低质量，适用于较小尺寸的网络视频</SelectItem>
        <SelectItem value="800k"> 800k - 中等质量，适用于标准清晰度 (480p) 的视频</SelectItem>
        <SelectItem value="1500k"> 1500k - 中高质量，适用于高清 (720p) 视频的较低设置</SelectItem>
        <SelectItem value="2500k"> 2500k - 高质量，适用于高清 (720p) 视频的标准设置</SelectItem>
        <SelectItem value="4000k"> 4000k - 很高质量，适用于全高清 (1080p) 视频</SelectItem>
        <SelectItem value="6000k"> 6000k - 超高质量，适用于高帧率的全高清视频或低帧率的 4K 视频</SelectItem>
        <SelectItem value="10000k"> 10000k - 极高质量，适用于高帧率的 4K 视频</SelectItem>
        <SelectItem value="20000k"> 20000k - 最高质量，适用于高帧率、高动态范围 (HDR) 的 4K 或 8K 视频</SelectItem>
      </SelectContent>
    </Select>
  )
}
