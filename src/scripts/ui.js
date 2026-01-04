export function setupTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("visible"));
            document.getElementById(tab.dataset.tab).classList.add("visible");
        });
    });
}

export function setupSidebarResize() {
    const touchTarget = document.getElementById("touch-target");
    const sidebar = document.querySelector(".sidebar");
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    let isExpanded = false;

    function minimizeSidebar() {
        if (window.innerWidth <= 768) {
            isExpanded = false;
            sidebar.style.transition = "height 0.5s cubic-bezier(0.38, 1.21, 0.22, 1.00)";
            sidebar.style.height = "150px";
            setTimeout(() => {
                if (!isDragging) sidebar.style.transition = "none";
            }, 500);
        }
    }

    function startDrag(e) {
        if (window.innerWidth > 768) return;
        isDragging = true;
        const currentY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        startY = currentY;
        lastY = currentY;
        lastTime = Date.now();
        startHeight = sidebar.offsetHeight;
        sidebar.style.transition = "none";
        document.body.style.cursor = "ns-resize";
    }

    function handleDrag(e) {
        if (!isDragging) return;
        const currentY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        const currentTime = Date.now();

        const dt = currentTime - lastTime;
        if (dt > 0) {
            velocity = (lastY - currentY) / dt;
        }
        lastY = currentY;
        lastTime = currentTime;

        const deltaY = startY - currentY;
        let newHeight = startHeight + deltaY;

        const minHeight = 150;
        const maxHeight = window.innerHeight * 0.9;
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

        sidebar.style.height = `${newHeight}px`;
        sidebar.style.maxHeight = `${maxHeight + 100}px`;
    }

    function stopDrag() {
        if (!isDragging) return;
        isDragging = false;

        const minHeight = 150;
        const maxHeight = window.innerHeight * 0.9;
        const threshold = 0.5;

        sidebar.style.transition = "height 0.5s cubic-bezier(0.38, 1.21, 0.22, 1.00)";

        if (Math.abs(velocity) > threshold) {
            if (velocity > 0) {
                sidebar.style.height = `${maxHeight}px`;
                isExpanded = true;
            } else {
                sidebar.style.height = `${minHeight}px`;
                isExpanded = false;
            }
        } else {
            const currentHeight = sidebar.offsetHeight;
            if (currentHeight > (maxHeight + minHeight) / 2) {
                sidebar.style.height = `${maxHeight}px`;
                isExpanded = true;
            } else {
                sidebar.style.height = `${minHeight}px`;
                isExpanded = false;
            }
        }

        setTimeout(() => {
            if (!isDragging) sidebar.style.transition = "none";
        }, 500);

        document.body.style.cursor = "";
        velocity = 0;
    }

    function handleResize() {
        if (window.innerWidth > 768) {
            sidebar.style.height = "";
            sidebar.style.maxHeight = "";
            sidebar.style.transition = "";
            isExpanded = false;
        } else {
            const maxHeight = window.innerHeight * 0.9;
            sidebar.style.maxHeight = `${maxHeight + 100}px`;

            if (isExpanded) {
                sidebar.style.height = `${maxHeight}px`;
            } else {
                const currentHeight = sidebar.offsetHeight;
                if (currentHeight > maxHeight) {
                    sidebar.style.height = `${maxHeight}px`;
                }
            }
        }
    }

    touchTarget.addEventListener("mousedown", startDrag);
    touchTarget.addEventListener("touchstart", startDrag, { passive: true });
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("touchmove", handleDrag, { passive: false });
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);
    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    return { minimizeSidebar };
}

export function updateAutoHeight(isOpt, state) {
    const suffix = isOpt ? "Opt" : "";
    const label = document.getElementById("heightLabel" + suffix);
    const input = document.getElementById("height" + suffix);

    if (state) {
        label.style.opacity = "0.5";
        input.style.pointerEvents = "none";
    } else {
        label.style.opacity = "1";
        input.style.pointerEvents = "auto";
    }
    document.getElementById("autoHeight" + suffix).selected = state;
}
