import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import React from "react";
import { cn } from "@/lib/utils";

export default function NoSafariSupport({className}:React.HTMLAttributes<Element>){
    return (
        <Alert className={cn( className, "text-border")}>
        <AlertTitle className="text-border">No Safari Support !</AlertTitle>
        <AlertDescription>
            Sorry that there is no support for safari, since this project is powered by <a target="_blank" className="underline underline-offset-4" href="https://github.com/diffusion-studio/ffmpeg-js">@diffusion-studio/ffmpeg-js</a>
        </AlertDescription>
      </Alert>
    )
}