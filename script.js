import { icons } from '@3r1s_s/erisui';
import "@3r1s_s/erisui/style.css";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

icons.register("download", `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9879 0C11.0653 0 10.264 0.804018 10.264 1.73367V12.1105L10.434 16.4572C10.4826 17.4621 11.2352 18.015 11.9879 18.015C12.7648 18.015 13.5418 17.4621 13.566 16.4572L13.736 12.1105V1.73367C13.736 0.804018 12.9348 0 11.9879 0ZM11.9879 20C12.4492 20 12.8134 19.8492 13.2504 19.3969L19.4901 13.2412C19.8058 12.8894 20 12.5377 20 12.0603C20 11.1306 19.3203 10.4774 18.422 10.4774C17.9849 10.4774 17.5479 10.6532 17.2322 11.005L14.5615 14.0201L11.9879 16.8843L9.41427 14.0201L6.74354 11.005C6.45221 10.6532 5.96661 10.4774 5.55387 10.4774C4.65554 10.4774 4 11.1306 4 12.0603C4 12.5377 4.16996 12.8894 4.50987 13.2412L10.7254 19.3969C11.1867 19.8492 11.5509 20 11.9879 20Z" fill="currentColor"/><rect y="22" width="24" height="3" rx="1.5" fill="currentColor"/></svg>`);

let ah = true;
let ahOpt = true;

function updateAutoHeight(isOpt = false) {
    const suffix = isOpt ? "Opt" : "";
    const label = document.getElementById("heightLabel" + suffix);
    const input = document.getElementById("height" + suffix);
    const val = isOpt ? ahOpt : ah;

    if (val) {
        label.style.opacity = "0.5";
        input.style.pointerEvents = "none";
    } else {
        label.style.opacity = "1";
        input.style.pointerEvents = "auto";
    }
    document.getElementById("autoHeight" + suffix).selected = val;
}

document.getElementById("autoHeight").addEventListener("change", () => {
    ah = document.getElementById("autoHeight").selected;
    updateAutoHeight(false);
});

document.getElementById("autoHeightOpt").addEventListener("change", () => {
    ahOpt = document.getElementById("autoHeightOpt").selected;
    updateAutoHeight(true);
});

updateAutoHeight(false);
updateAutoHeight(true);

const ffmpeg = new FFmpeg();
const status = document.getElementById("status");
const resultImg = document.getElementById("result");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("videoInput");
const browseBtn = document.getElementById("browseBtn");
const fileNameDisplay = document.getElementById("fileName");

const gifInput = document.getElementById("gifInput");
const browseBtnGif = document.getElementById("browseBtnGif");
const fileNameGif = document.getElementById("fileNameGif");
const dropZoneGif = document.getElementById("dropZoneGif");

const progressBar = document.getElementById("progressBar");
let selectedFile = null;
let selectedGif = null;

ffmpeg.on("progress", ({ progress }) => {
    if (progress > 1) {
        progressBar.value = 100;
        return;
    }
    progressBar.value = Math.round(progress * 100);
});

function handleFile(file, isGif = false) {
    if (isGif) {
        if (file && file.type === "image/gif") {
            selectedGif = file;
            fileNameGif.textContent = `Selected: ${file.name}`;
        } else {
            alert("Please select a valid GIF.");
        }
    } else {
        if (file && (file.type === "video/mp4" || file.type === "video/quicktime")) {
            selectedFile = file;
            fileNameDisplay.textContent = `Selected: ${file.name}`;
        } else {
            alert("Please select a valid video file.");
        }
    }
}

browseBtn.addEventListener("click", () => fileInput.click());
browseBtnGif.addEventListener("click", () => gifInput.click());

fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0], false);
});

gifInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0], true);
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragging");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], false);
});

dropZoneGif.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneGif.classList.add("dragging");
});

dropZoneGif.addEventListener("dragleave", () => dropZoneGif.classList.remove("dragging"));

dropZoneGif.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZoneGif.classList.remove("dragging");
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], true);
});

async function loadFFmpeg() {
    if (!ffmpeg.loaded) {
        status.textContent = "Loading FFmpeg...";
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
    }
}
document.getElementById("convertBtn").addEventListener("click", async () => {
    const fps = document.getElementById("fps").value;
    const width = document.getElementById("width").value;
    const height = document.getElementById("height").value;
    const colors = document.getElementById("colors").value;
    const speed = document.getElementById("speed").value;

    const statusCont = document.querySelector(".status");

    if (!selectedFile) {
        alert("Select a video first");
        return;
    }

    progressBar.value = 100;
    progressBar.intermediate = true;
    statusCont.style.display = "flex";
    await loadFFmpeg();

    const videoFile = selectedFile;
    const inputName = "input.mp4";
    const paletteName = "palette.png";
    const outputName = "output.gif";

    status.textContent = "Reading video...";

    await ffmpeg.writeFile(
        inputName,
        await fetchFile(videoFile)
    );

    status.textContent = "Generating palette...";

    await ffmpeg.exec([
        "-i", inputName,
        "-vf", `setpts=(1/${speed})*PTS,fps=${fps},scale=${width}:${ah ? -1 : height}:flags=lanczos,palettegen=max_colors=${colors}`,
        paletteName
    ]);

    progressBar.value = 0;
    progressBar.intermediate = false;
    status.textContent = "Creating GIF...";

    await ffmpeg.exec([
        "-i", inputName,
        "-i", paletteName,
        "-lavfi", `setpts=(1/${speed})*PTS,fps=${fps},scale=${width}:${ah ? -1 : height}:flags=lanczos[x];[x][1:v]paletteuse`,
        outputName
    ]);

    statusCont.style.display = "none";

    const gifData = await ffmpeg.readFile(outputName);
    const gifBlob = new Blob([gifData.buffer], { type: "image/gif" });
    const gifURL = URL.createObjectURL(gifBlob);

    resultImg.src = gifURL;
    status.textContent = "Done!";
    progressBar.value = 100;
});

document.getElementById("optimizeBtn").addEventListener("click", async () => {
    const fps = document.getElementById("fpsOpt").value;
    const width = document.getElementById("widthOpt").value;
    const height = document.getElementById("heightOpt").value;
    const colors = document.getElementById("colorsOpt").value;
    const speed = document.getElementById("speedOpt").value;
    const statusCont = document.querySelector(".status");

    if (!selectedGif) {
        alert("Select a GIF first");
        return;
    }

    progressBar.value = 100;
    progressBar.intermediate = true;
    statusCont.style.display = "flex";
    await loadFFmpeg();

    const gifFile = selectedGif;
    const inputName = "input.gif";
    const paletteName = "palette.png";
    const outputName = "optimized.gif";

    status.textContent = "Reading GIF...";
    await ffmpeg.writeFile(inputName, await fetchFile(gifFile));

    status.textContent = "Generating palette...";
    await ffmpeg.exec([
        "-i", inputName,
        "-vf", `fps=${fps},scale=${width}:${ahOpt ? -1 : height}:flags=lanczos,palettegen=max_colors=${colors}`,
        paletteName
    ]);

    progressBar.value = 0;
    progressBar.intermediate = false;
    status.textContent = "Optimizing...";

    await ffmpeg.exec([
        "-i", inputName,
        "-i", paletteName,
        "-lavfi", `fps=${fps},scale=${width}:${ahOpt ? -1 : height}:flags=lanczos[x];[x][1:v]paletteuse,setpts=(1/${speed})*PTS`,
        outputName
    ]);

    statusCont.style.display = "none";
    const gifData = await ffmpeg.readFile(outputName);
    const gifBlob = new Blob([gifData.buffer], { type: "image/gif" });
    const gifURL = URL.createObjectURL(gifBlob);

    resultImg.src = gifURL;
    status.textContent = "Optimized!";
    progressBar.value = 100;
});

document.getElementById("downloadBtn").innerHTML = `
<eui-surface ripple interactive>
<eui-icon name="download" width="18" height="18" style="padding-bottom:2px;"></eui-icon>
</eui-surface>
`

document.getElementById("downloadBtn").addEventListener("click", () => {
    if (!resultImg.src) return;
    const link = document.createElement("a");
    link.href = resultImg.src;
    link.download = "untitled.gif";
    link.click();
});

// tabs stuff

document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("visible"));
        document.getElementById(tab.dataset.tab).classList.add("visible");
    });
});

// mobile sidebar

const touchTarget = document.getElementById("touch-target");
const sidebar = document.querySelector(".sidebar");
let isDragging = false;
let startY = 0;
let startHeight = 0;

function startDrag(e) {
    if (window.innerWidth > 768) return;
    isDragging = true;
    startY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    startHeight = sidebar.offsetHeight;
    sidebar.style.transition = "none";
    document.body.style.cursor = "ns-resize";
}

function handleDrag(e) {
    if (!isDragging) return;
    const currentY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - currentY;
    let newHeight = startHeight + deltaY;

    const minHeight = 100;
    const maxHeight = window.innerHeight * 0.9;
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    sidebar.style.height = `${newHeight}px`;
    sidebar.style.maxHeight = `${maxHeight}px`;
}

function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    sidebar.style.transition = "";
    document.body.style.cursor = "";
}

touchTarget.addEventListener("mousedown", startDrag);
touchTarget.addEventListener("touchstart", startDrag, { passive: true });

window.addEventListener("mousemove", handleDrag);
window.addEventListener("touchmove", handleDrag, { passive: false });

window.addEventListener("mouseup", stopDrag);
window.addEventListener("touchend", stopDrag);