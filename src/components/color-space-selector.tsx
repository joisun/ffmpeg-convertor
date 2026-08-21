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
  value?: string;
  allowedValues?: readonly string[];
  disabled?: boolean;
}

const groups = [
  {
    label: "自动",
    options: [{ value: "none", label: "保持源文件设置" }],
  },
  {
    label: "单调",
    options: [
      { value: "gray", label: "gray - 灰度图像" },
      { value: "monob", label: "monob - 单色二值图像" },
      { value: "pal8", label: "pal8 - 8位调色板" },
    ],
  },
  {
    label: "RGB / RGBA",
    options: [
      { value: "rgb8", label: "rgb8" },
      { value: "rgb24", label: "rgb24" },
      { value: "rgb32", label: "rgb32" },
      { value: "rgb48be", label: "rgb48be - 48位 RGB 格式(大端)" },
      { value: "rgb48le", label: "rgb48le - 48位 RGB 格式(小端)" },
      { value: "rgba", label: "rgba" },
      { value: "bgra", label: "bgra" },
    ],
  },
  {
    label: "YUV",
    options: [
      { value: "nv12", label: "nv12" },
      { value: "nv21", label: "nv21" },
      { value: "yuv420p", label: "yuv420p" },
      { value: "yuv422p", label: "yuv422p" },
      { value: "yuv444p", label: "yuv444p" },
    ],
  },
] as const;

export default function ColorSpaceSelector({
  value,
  onValueChange,
  allowedValues,
  disabled,
}: BiteRateSelectorProps) {
  const allowed = new Set(
    allowedValues?.length === 0
      ? ["none"]
      : (allowedValues ?? groups.flatMap((group) => group.options.map((option) => option.value))),
  );
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => allowed.has(option.value)),
    }))
    .filter((group) => group.options.length > 0);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="选择颜色空间" />
      </SelectTrigger>
      <SelectContent>
        {visibleGroups.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
