/* ===== Config ===== */
const config = {
    user: "penandalokasi",
    repo: "experimental-md",
    branch: "main",
    displayFolder: "images-optimized",
    originalFolder: "images"
};

/* ===== Base path (GitHub Pages project support) ===== */
const basePath = location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "");

/* ===== Elements ===== */
const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg"); // used for images
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

/* We'll dynamically create a video element for webm */
let lightboxVideo = null;

let imageList = [];
let currentIndex = 0;

/* ===== Load index.json ===== */
fetch(`${basePath}/${config.displayFolder}/index.json`)
    .then(res => {
        if (!res.ok) throw new Error("index.json not found");
        return res.json();
    })
    .then(files => {
        imageList = files.sort((a, b) =>
            b.optimized.localeCompare(a.optimized)
        );

        imageList.forEach((item, index) => createItem(item, index));
    })
    .catch(err => {
        console.error(err);
        gallery.innerHTML = "Failed to load images.";
    });

/* ===== Lazy loading ===== */
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        el.src = el.dataset.src;

        if (el.tagName === "VIDEO") {
            el.play().catch(() => {});
        }

        obs.unobserve(el);
    });
}, { rootMargin: "200px" });

/* ===== Create thumbnails ===== */
function createItem(item, index) {
    const container = document.createElement("div");
    container.className = "item";

    let media;

    if (item.optimized.match(/\.webm$/i)) {
        media = document.createElement("video");
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = true;
    } else {
        media = document.createElement("img");
        media.draggable = false;
    }

    media.dataset.src = `${basePath}/${config.displayFolder}/${item.optimized}`;
    media.alt = item.optimized;

    observer.observe(media);
    media.onclick = () => openLightbox(index);

    const btn = document.createElement("button");
    btn.textContent = "Copy URL";
    btn.onclick = (e) => {
        e.stopPropagation();
        copyUrl(item, btn);
    };

    container.appendChild(media);
    container.appendChild(btn);
    gallery.appendChild(container);
}

/* ===== Copy original URL ===== */
function copyUrl(item, button) {
    const url = `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch}/${config.originalFolder}/${item.original}`;

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

    if (lightboxVideo) {
        lightboxVideo.pause();
    }
}

function showImage(index) {
    if (index < 0 || index >= imageList.length) return;

    const item = imageList[index];
    currentIndex = index;

    const src = `${basePath}/${config.displayFolder}/${item.optimized}`;

    /* Remove existing video if any */
    if (lightboxVideo) {
        lightboxVideo.remove();
        lightboxVideo = null;
    }

    if (item.optimized.match(/\.webm$/i)) {
        /* Hide image */
        lightboxImg.style.display = "none";

        /* Create video */
        lightboxVideo = document.createElement("video");
        lightboxVideo.src = src;
        lightboxVideo.controls = true;
        lightboxVideo.autoplay = true;
        lightboxVideo.loop = true;
        lightboxVideo.style.maxWidth = "90vw";
        lightboxVideo.style.maxHeight = "90vh";

        lightbox.appendChild(lightboxVideo);
    } else {
        /* Show image */
        lightboxImg.style.display = "block";
        lightboxImg.src = src;
    }
}

closeBtn.onclick = closeLightbox;

lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
};

lightboxCopy.onclick = () => {
    copyUrl(imageList[currentIndex], lightboxCopy);
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

/* ===== Touch gestures ===== */
let startX = 0;
let startY = 0;

lightbox.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: false });

lightbox.addEventListener("touchmove", (e) => {
    e.preventDefault();
}, { passive: false });

lightbox.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
