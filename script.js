import "@3r1s_s/erisui/style.css";
import { registerIcons } from './src/scripts/icons.js';
import { loadFFmpeg, ffmpeg, processVideoToGif, processOptimizeGif } from './src/scripts/gif.js';
import { setupTabs, setupSidebarResize, updateAutoHeight } from './src/scripts/ui.js';

registerIcons();
setupTabs();
const { minimizeSidebar } = setupSidebarResize();

let ah = true;
let ahOpt = true;

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
let lastGeneratedBlob = null;

ffmpeg.on("progress", ({ progress }) => {
    if (progress > 1) {
        progressBar.value = 100;
        return;
    }
    progressBar.value = Math.round(progress * 100);
});

document.getElementById("autoHeight").addEventListener("change", () => {
    ah = document.getElementById("autoHeight").selected;
    updateAutoHeight(false, ah);
});

document.getElementById("autoHeightOpt").addEventListener("change", () => {
    ahOpt = document.getElementById("autoHeightOpt").selected;
    updateAutoHeight(true, ahOpt);
});

updateAutoHeight(false, ah);
updateAutoHeight(true, ahOpt);

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

[
    { zone: dropZone, isGif: false },
    { zone: dropZoneGif, isGif: true }
].forEach(({ zone, isGif }) => {
    zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("dragging");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("dragging");
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], isGif);
    });
});

document.getElementById("convertBtn").addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Select a video first");
        return;
    }

    const statusCont = document.querySelector(".status");
    progressBar.value = 100;
    progressBar.intermediate = true;
    statusCont.style.display = "flex";
    minimizeSidebar();

    await loadFFmpeg((msg) => status.textContent = msg);

    try {
        const gifData = await processVideoToGif({
            file: selectedFile,
            fps: document.getElementById("fps").value,
            width: document.getElementById("width").value,
            height: document.getElementById("height").value,
            colors: document.getElementById("colors").value,
            speed: document.getElementById("speed").value,
            isAutoHeight: ah,
            statusCallback: (msg) => {
                status.textContent = msg;
                if (msg === "Creating GIF...") {
                    progressBar.value = 0;
                    progressBar.intermediate = false;
                }
            }
        });

        statusCont.style.display = "none";
        lastGeneratedBlob = new Blob([gifData.buffer], { type: "image/gif" });
        resultImg.src = URL.createObjectURL(lastGeneratedBlob);
        status.textContent = "Done!";
        progressBar.value = 100;
    } catch (err) {
        console.error(err);
        status.textContent = "Error during conversion";
    }
});

document.getElementById("optimizeBtn").addEventListener("click", async () => {
    if (!selectedGif) {
        alert("Select a GIF first");
        return;
    }

    const statusCont = document.querySelector(".status");
    progressBar.value = 100;
    progressBar.intermediate = true;
    statusCont.style.display = "flex";
    minimizeSidebar();

    await loadFFmpeg((msg) => status.textContent = msg);

    try {
        const gifData = await processOptimizeGif({
            file: selectedGif,
            fps: document.getElementById("fpsOpt").value,
            width: document.getElementById("widthOpt").value,
            height: document.getElementById("heightOpt").value,
            colors: document.getElementById("colorsOpt").value,
            speed: document.getElementById("speedOpt").value,
            isAutoHeight: ahOpt,
            statusCallback: (msg) => {
                status.textContent = msg;
                if (msg === "Optimizing...") {
                    progressBar.value = 0;
                    progressBar.intermediate = false;
                }
            }
        });

        statusCont.style.display = "none";
        lastGeneratedBlob = new Blob([gifData.buffer], { type: "image/gif" });
        resultImg.src = URL.createObjectURL(lastGeneratedBlob);
        status.textContent = "Optimized!";
        progressBar.value = 100;
    } catch (err) {
        console.error(err);
        status.textContent = "Error during optimization";
    }
});

document.getElementById("downloadBtn").innerHTML = `
<eui-surface ripple interactive>
<eui-icon name="download" width="24" height="24" style="padding-bottom:2px;"></eui-icon>
</eui-surface>
`;

document.getElementById("shareBtn").innerHTML = `
<eui-surface ripple interactive>
<eui-icon name="share" width="24" height="24" style="padding-bottom:2px;"></eui-icon>
</eui-surface>
`;

document.getElementById("downloadBtn").addEventListener("click", () => {
    if (!resultImg.src) return;
    const link = document.createElement("a");
    link.href = resultImg.src;
    link.download = "untitled.gif";
    link.click();
});

document.getElementById("shareBtn").addEventListener("click", async () => {
    if (!lastGeneratedBlob) {
        alert("Generate a GIF first");
        return;
    }

    const shareData = {
        files: [new File([lastGeneratedBlob], "giferator.gif", { type: "image/gif" })]
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        alert("Sharing not supported or invalid data.");
    }
});