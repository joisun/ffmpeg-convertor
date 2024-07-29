import { cn } from "@/lib/utils";
import { GitHubLogoIcon } from '@radix-ui/react-icons'

export default function Header() {
    return <div className="flex justify-between items-center">
        <div className="left">
            <h1 className={cn("text-2xl", "font-semibold", "text-foreground","flex items-center")}>FFmpeg Convertor
                <a href="https://github.com/joisun/ffmpeg-convertor" target="_blank" rel="noopener noreferrer" className="ml-4 flex items-center">
                    <GitHubLogoIcon className="w-6 h-6 inline-block hover:text-primary/80" />
                </a>
            </h1>
            <p className="text-secondary-foreground mt-2">Easily convertor, powered by ffmpeg.</p>
        </div>
        <div className="right">
        </div>
    </div>
}