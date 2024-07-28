import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BiteRateSelectorProps extends React.HTMLAttributes<HTMLElement> {
  onValueChange: (value: string) => void;
  defaultValue: string;
}

export default function FileTypeSelector({
  defaultValue,
  onValueChange,
}: BiteRateSelectorProps) {
  return (
    <Select defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="webp"> WEBP</SelectItem>
        <SelectItem value="gif"> GIF</SelectItem>
        <SelectItem value="mp4"> MP4</SelectItem>
        <SelectItem value="avi"> AVI</SelectItem>
        <SelectItem value="mkv"> MKV</SelectItem>
        <SelectItem value="mov"> MOV</SelectItem>
        <SelectItem value="webm"> WEBM</SelectItem>
        <SelectItem value="flv"> FLV</SelectItem>
        <SelectItem value="mpg"> MPG</SelectItem>
        <SelectItem value="ogv"> OGV</SelectItem>
        <SelectItem value="wmv"> WMV</SelectItem>
      </SelectContent>
    </Select>
  );
}
