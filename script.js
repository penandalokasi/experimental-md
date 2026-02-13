/* ===== Repository config ===== */
const config = {
    user: "penandalokasi",
    repo: "experimental-md",
    branch: "main",
    folder: "images"
};

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

let imageList = [];
let currentIndex = 0;

/* ===== GitHub API ===== */
const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${config.folder}?ref=${config.branch}`;

fetch(apiUrl)
    .then(res => res.json())
    .then(files => {
        imageList = files
            .filter(file => file.type === "file")
            .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i))
            .sort((a, b) => b.name.localeCompare(a.name))
            .map(file => file.name);

        imageList.forEach((name, index) => createItem(name, index));
    })
    .catch(err => {
        gallery.innerHTML = "Failed to load images.";
        console.error(err);
    });

/* ===== Lazy loading observer ===== */
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        img.src = img.dataset.src;
        obs.unobserve(img);
    });
}, {
    rootMargin: "200px"
});

/* ===== Create thumbnails ===== */
function createItem(filename, index) {
    const container = document.createElement("div");
    container.className = "item";

    const img = document.createElement("img");
    img.dataset.src = `${config.folder}/${filename}`;
    img.draggable = false;
    img.alt = filename;

    observer.observe(img);

    img.onclick = () => openLightbox(index);

    const btn = document.createElement("button");
    btn.textContent = "Copy URL";

    btn.onclick = (e) => {
        e.stopPropagation();
        copyUrl(filename, btn);
    };

    container.appendChild(img);
    container.appendChild(btn);
    gallery.appendChild(container);
}

/* ===== URL helper ===== */
function getRawUrl(filename) {
    return `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch}/${config.folder}/${filename}`;
}

function copyUrl(filename, button) {
    const url = getRawUrl(filename);
    navigator.clipboard.writeText(url).then(() => {
        if (button) {
            const original = button.textContent;
            button.textContent = "Copied";
            setTimeout(() => button.textContent = original, 1200);
        }
    });
}

/* ===== Lightbox ===== */
function openLightbox(index) {
    currentIndex = index;
    showImage(index);
    lightbox.classList.remove("hidden");
    document.body.classList.add("no-scroll");
}

function closeLightbox() {
    lightbox.classList.add("hidden");
    document.body.classList.remove("no-scroll");
}

function showImage(index) {
    if (index < 0 || index >= imageList.length) return;
    currentIndex = index;
    lightboxImg.src = `${config.folder}/${imageList[index]}`;
}

closeBtn.onclick = closeLightbox;

lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
};

/* Lightbox copy button (fixed) */
lightboxCopy.onclick = () => {
    const filename = imageList[currentIndex];
    copyUrl(filename, lightboxCopy);
};

/* ===== Keyboard navigation ===== */
document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
});

/* ===== Navigation ===== */
function nextImage() {
    if (currentIndex < imageList.length - 1) {
        showImage(currentIndex + 1);
    }
}

function prevImage() {
    if (currentIndex > 0) {
        showImage(currentIndex - 1);
    }
}

/* ===== Swipe / Drag navigation (mobile + desktop) ===== */
let startX = 0;
let startY = 0;
let currentX = 0;
let dragging = false;

function setTranslate(x) {
    lightboxImg.style.transform = `translateX(${x}px)`;
}

function resetPosition(animated = true) {
    if (animated) {
        lightboxImg.style.transition = "transform 0.25s ease";
    }
    setTranslate(0);
    setTimeout(() => {
        lightboxImg.style.transition = "";
    }, 250);
}

function handleStart(x, y) {
    dragging = true;
    startX = x;
    startY = y;
    currentX = 0;
    lightboxImg.style.transition = "";
}

function handleMove(x, y) {
    if (!dragging) return;

    const dx = x - startX;
    const dy = y - startY;

    // Horizontal swipe dominates
    if (Math.abs(dx) > Math.abs(dy)) {
        currentX = dx;
        setTranslate(dx);
    }
}

function handleEnd(x, y) {
    if (!dragging) return;
    dragging = false;

    const dx = x - startX;
    const dy = y - startY;

    // Horizontal navigation
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
        lightboxImg.style.transition = "transform 0.2s ease";

        if (dx < 0 && currentIndex < imageList.length - 1) {
            setTranslate(-window.innerWidth);
            setTimeout(() => {
                nextImage();
                resetPosition(false);
            }, 200);
            return;
        }

        if (dx > 0 && currentIndex > 0) {
            setTranslate(window.innerWidth);
            setTimeout(() => {
                prevImage();
                resetPosition(false);
            }, 200);
            return;
        }
    }

    // Vertical swipe to close
    if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx)) {
        closeLightbox();
        return;
    }

    resetPosition();
}

/* Touch events */
lightbox.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

lightbox.addEventListener("touchmove", (e) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

lightbox.addEventListener("touchend", (e) => {
    handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

/* Mouse events (desktop drag) */
lightbox.addEventListener("mousedown", (e) => {
    handleStart(e.clientX, e.clientY);
});

window.addEventListener("mousemove", (e) => {
    handleMove(e.clientX, e.clientY);
});

window.addEventListener("mouseup", (e) => {
    handleEnd(e.clientX, e.clientY);
});
