import { GitHubLogoIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "ffmpeg-converter:theme";

function getInitialTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Header() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5" aria-label="FFmpeg Converter 视频工作台">
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          className="size-8 shrink-0 object-contain"
        />
        <span className="truncate font-display text-sm font-semibold tracking-tight sm:text-base">
          FFmpeg Converter
        </span>
        <span className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
          Local
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setTheme(nextTheme)}
          aria-label={`切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`}
          title={`切换到${nextTheme === "dark" ? "深色" : "浅色"}模式`}
        >
          {theme === "dark" ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
        </button>
        <a
          href="https://github.com/joisun/ffmpeg-convertor"
          target="_blank"
          rel="noopener noreferrer"
          className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="在 GitHub 查看源代码"
          title="GitHub"
        >
          <GitHubLogoIcon aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
