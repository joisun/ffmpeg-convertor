import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface LinkerProps extends React.HTMLAttributes<HTMLElement> {
  to: string
  name: string
}

export default function Linker({ to, name, className }: LinkerProps) {
  return (
    <Link
      to={to}
      className={
        cn(
        "inline-flex",
        "items-center",
        "whitespace-nowrap",
        "rounded-md",
        "text-sm",
        "font-medium",
        "transition-colors",
        "focus-visible:outline-none",
        "focus-visible:ring-1",
        "focus-visible:ring-ring",
        "disabled:pointer-events-none",
        "disabled:opacity-50",
        "hover:text-accent-foreground",
        "h-9",
        "px-4",
        "py-2",
        "hover:bg-transparent",
        "hover:underline",
        "justify-start",
        className
      )
      }
        
    >
      {name}
    </Link>
  );
}
