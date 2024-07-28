import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Ref, useRef } from 'react';
import { CommandPartsType } from './utils';

export const useFFmpeg = async () => {
    const ffmpegRef = useRef(new FFmpeg());
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpegRef
}

export const transcode = async (ffmpegRef: React.MutableRefObject<FFmpeg>, file: File, commandParts: CommandPartsType) => {
    console.log("start")
    if (!ffmpegRef) return
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile(commandParts.input, await fetchFile(file));
    // await ffmpeg.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'));
    await ffmpeg.exec(commandParts.executeParts).catch(err=>{
        console.log('err',err)
    });
    const data = await ffmpeg.readFile(commandParts.output);
    console.log('data', data)
    // videoRef.current.src =
    //     URL.createObjectURL(new Blob([data.buffer], {type: 'video/mp4'}));
}

const readFile = async (file: File) => {
    return new Promise<Blob | undefined>((resolve) => {
        // setting up the reader
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        // read file
        reader.onload = readerEvent => {
            const content = readerEvent?.target?.result;
            if (!content || typeof content == "string") {
                resolve(undefined);
            } else {
                resolve(new Blob([new Uint8Array(content)], { type: file.type }));
            }
        }
    })
}



// return (loaded
//     ? (
//         <>
//             <video ref={videoRef} controls></video><br/>
//             <button onClick={transcode}>Transcode webm to mp4</button>
//             <p ref={messageRef}></p>
//             <p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
//         </>
//     )
//     : (
//         <button onClick={load}>Load ffmpeg-core (~31 MB)</button>
//     )
// );