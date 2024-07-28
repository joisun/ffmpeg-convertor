import { FFmpeg } from '@diffusion-studio/ffmpeg-js';
import { CommandPartsType } from './utils';

export const useFFmpeg = () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.whenReady(async () => {
        await ffmpeg.exec(['-help']);
    });
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

export const execute = async (file: string, commandParts: CommandPartsType) => {
    // const blob = await readFile(file);
    // if (!blob) return;

    const ffmpeg = new FFmpeg();

    // write to file system
    await ffmpeg.writeFile(commandParts.input, file);

    // convert mp4 to avi
    await ffmpeg.exec(commandParts.executeParts);

    // read from file system
    const result: Uint8Array = ffmpeg.readFile(commandParts.output);

    downloadData(result, commandParts.output)

    // free memory
    ffmpeg.deleteFile(commandParts.input);
    ffmpeg.deleteFile(commandParts.output);
    // const result: Uint8Array = ffmpeg.exec(commandParts).export()

    //   const result: Uint8Array | undefined = await ffmpeg
    //     .input({ source: blob })
    //     .ouput({ format: 'avi' })
    //     .export()
}

const downloadData = (file: Uint8Array, filename: string) => {
    // Create link and download
    const a = document.createElement('a');
    document.head.appendChild(a);
    a.download = filename
    a.href = URL.createObjectURL(
        new Blob([file])
    )
    a.click();
}
