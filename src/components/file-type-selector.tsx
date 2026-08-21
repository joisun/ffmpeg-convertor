import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTPUT_FORMATS, OUTPUT_PROFILES } from "@/lib/utils";

interface BiteRateSelectorProps extends React.HTMLAttributes<HTMLElement> {
  onValueChange: (value: string) => void;
  value: string;
}

export default function FileTypeSelector({
  value,
  onValueChange,
}: BiteRateSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        {OUTPUT_FORMATS.map((format) => (
          <SelectItem key={format} value={format}>
            {OUTPUT_PROFILES[format].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
