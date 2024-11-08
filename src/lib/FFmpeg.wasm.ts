import Bowser from "bowser"
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CommandPartsType } from './utils';
import { FileData } from 'node_modules/@ffmpeg/ffmpeg/dist/esm/types';

interface FFmpegInstance {
    load: () => Promise<void>;
    transcode: (file: File, commandParts: CommandPartsType) => Promise<void>;
    isLoaded: boolean;
    isDoing: boolean;
    isLoading: boolean;
    progress: number;
    transcodedTime: number;
    logs: string[];
    error: Error | null;
    openMT:boolean
}

export function useFFmpeg(): FFmpegInstance {
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDoing, setIsDoing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [progress, setProgress] = useState(0)
    const [transcodedTime, setTranscodedTime] = useState(0)
    const [openMT, serOpenMT] = useState(false)
    // const [logs, setLogs] = useState<string[]>([]);

    const { logs, updateLogs } = useLogManager()
    function useLogManager(maxLogs = 5) {
        const [logs, setLogs] = useState<string[]>([]);

        const updateLogs = useCallback((message: string) => {
            setLogs(prevLogs => {
                const newLogs = [...prevLogs, message];
                return newLogs.length > maxLogs ? newLogs.slice(-maxLogs) : newLogs;
            });
        }, [maxLogs]);

        return { logs, updateLogs };
    }

    const load = useCallback(async () => {
        console.log('1. Load function called');
        if (isLoaded || isLoading || error) {
            console.log('2. Already loaded or loading');
            return;
        }
        console.log('3. Starting load process');
        setIsLoading(true);
        setError(null);

        try {
            if (!ffmpegRef.current) {
                console.log('4. Creating FFmpeg instance');
                ffmpegRef.current = new FFmpeg();
                console.log('5. FFmpeg instance created');
            }

            ffmpegRef.current.on('log', ({ message }) => {
                updateLogs(message)
                // console.log('FFmpeg log:', message);
            });
            console.log('6. Log listener added');

            ffmpegRef.current.on('progress', ({ progress, time }) => {
                setProgress(() => progress * 100)
                setTranscodedTime(() => time / 1000000)
            });

            // 基于chromium 的浏览器目前不支持 多线程 (不知道为什么， 可以在这里看到官方的 playgroud 是定义了两个CDN 常量 https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/apps/website/src/components/Playground/const.ts)
            const browser = Bowser.getParser(window.navigator.userAgent);
            let OpenMT = false
            if (browser.getBrowser().name === 'Firefox') {
                OpenMT = true;
            }
            serOpenMT(OpenMT)
            // const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
            // const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm'; // jsdelivr 好像开启了必须要的header设定项，否则由于安全策略（同源），只能自己server这个包
            const CORE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
            const CORE_MT_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.6/dist/esm'
            const baseURL = OpenMT ? CORE_MT_URL : CORE_URL;

            // console.log('7. Fetching core URL');
            // const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
            // console.log('8. Core URL fetched');

            // console.log('9. Fetching WASM URL');
            // const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
            // console.log('10. WASM URL fetched');

            // console.log('11. Starting FFmpeg load');
            // await ffmpegRef.current.load({ coreURL, wasmURL });
            await ffmpegRef.current.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
                ...(OpenMT ? {
                    workerURL: await toBlobURL(
                        `${baseURL}/ffmpeg-core.worker.js`,
                        "text/javascript"
                    ),
                } : {})

            });
            console.log('OpenMT: 是否开启多线程？', OpenMT)

            console.log('12. FFmpeg loaded successfully');

            setIsLoaded(true);
            console.log('13. State updated');
        } catch (err) {
            console.error('Error in FFmpeg load process:', err);
            setError(err instanceof Error ? err : new Error('Failed to load FFmpeg'));
        } finally {
            console.log('14. Load process completed');
            setIsLoading(false);
        }
    }, [isLoaded, isLoading]);

    const transcode = useCallback(async (file: File, commandParts: CommandPartsType): Promise<void> => {
        if (!ffmpegRef.current || !isLoaded) throw new Error('FFmpeg is not loaded');

        try {
            await ffmpegRef.current.writeFile(commandParts.input, await fetchFile(file));
            console.log('commandParts.executeParts', commandParts.executeParts)
            setIsDoing(true)

            // await ffmpegRef.current.exec(["-i","input.mp4","output.mp4"]);
            await ffmpegRef.current.exec(commandParts.executeParts);
            const result = await ffmpegRef.current.readFile(commandParts.output);
            downloadData(result, commandParts.output)
        } catch (err: any) {
            throw new Error(`Transcoding failed: ${err.message}`);
        } finally {
            setIsDoing(false)
        }
    }, [isLoaded]);



    useEffect(() => {
        load();
    }, [load]);

    return {
        load,
        transcode,
        isLoaded,
        isLoading,
        isDoing,
        progress,
        transcodedTime,
        logs,
        error,
        openMT
    };
}


const downloadData = (file: FileData, filename: string) => {
    // Create link and download
    const a = document.createElement('a');
    document.head.appendChild(a);
    a.download = filename
    a.href = URL.createObjectURL(
        new Blob([file])
    )
    a.click();
}
