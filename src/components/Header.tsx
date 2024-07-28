import { cn } from "@/lib/utils";

export default function Header(){
    return <>
    <h1 className={cn("text-2xl","font-semibold","text-foreground")}>FFmpeg Convertor</h1>
    <p className="text-secondary-foreground mt-2">Easily convertor, powered by ffmpeg.</p>
    </>
}