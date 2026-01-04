import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export const ffmpeg = new FFmpeg();

export async function loadFFmpeg(statusCallback) {
    if (!ffmpeg.loaded) {
        if (statusCallback) statusCallback("Loading FFmpeg...");
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
    }
}

export async function processVideoToGif({
    file,
    fps,
    width,
    height,
    colors,
    speed,
    isAutoHeight,
    statusCallback
}) {
    const inputName = "input.mp4";
    const paletteName = "palette.png";
    const outputName = "output.gif";

    if (statusCallback) statusCallback("Reading video...");
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (statusCallback) statusCallback("Generating palette...");
    await ffmpeg.exec([
        "-i", inputName,
        "-vf", `setpts=(1/${speed})*PTS,fps=${fps},scale=${width}:${isAutoHeight ? -1 : height}:flags=lanczos,palettegen=max_colors=${colors}`,
        paletteName
    ]);

    if (statusCallback) statusCallback("Creating GIF...");
    await ffmpeg.exec([
        "-i", inputName,
        "-i", paletteName,
        "-lavfi", `setpts=(1/${speed})*PTS,fps=${fps},scale=${width}:${isAutoHeight ? -1 : height}:flags=lanczos[x];[x][1:v]paletteuse`,
        outputName
    ]);

    return await ffmpeg.readFile(outputName);
}

export async function processOptimizeGif({
    file,
    fps,
    width,
    height,
    colors,
    speed,
    isAutoHeight,
    statusCallback
}) {
    const inputName = "input.gif";
    const paletteName = "palette.png";
    const outputName = "optimized.gif";

    if (statusCallback) statusCallback("Reading GIF...");
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (statusCallback) statusCallback("Generating palette...");
    await ffmpeg.exec([
        "-i", inputName,
        "-vf", `fps=${fps},scale=${width}:${isAutoHeight ? -1 : height}:flags=lanczos,palettegen=max_colors=${colors}`,
        paletteName
    ]);

    if (statusCallback) statusCallback("Optimizing...");
    await ffmpeg.exec([
        "-i", inputName,
        "-i", paletteName,
        "-lavfi", `fps=${fps},scale=${width}:${isAutoHeight ? -1 : height}:flags=lanczos[x];[x][1:v]paletteuse,setpts=(1/${speed})*PTS`,
        outputName
    ]);

    return await ffmpeg.readFile(outputName);
}

export function calculateEstimatedSize({
    width,
    height,
    fps,
    colors,
    speed,
    duration
}) {
    if (!duration) return null;

    // estimate based on color depth
    const bitsPerPixel = Math.log2(colors);

    const totalFrames = (duration / speed) * fps;
    const bits = width * height * bitsPerPixel * totalFrames;

    const bytes = bits / 8;

    // typical gif compression factor (0.1 to 0.3 for optimized gifs)
    const compressionFactor = 0.15;

    return bytes * compressionFactor;
}

export function formatSize(bytes) {
    if (bytes === null || bytes === undefined) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
