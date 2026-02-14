/* ===== Config ===== */
const config = {
    user: "penandalokasi",
    repo: "experimental-md",
    branch: "main",
    displayFolder: "images-optimized",
    originalFolder: "images"
};

/* ===== Elements ===== */
const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

let imageList = [];
let currentIndex = 0;

/* ===== Load index.json ===== */
fetch("images-optimized/index.json")
    .then(res => {
        if (!res.ok) throw new Error("index.json not found");
        return res.json();
    })
    .then(files => {
        if (!Array.isArray(files)) {
            gallery.innerHTML = "index.json format error";
            return;
        }

        imageList = files.sort((a, b) =>
            b.optimized.localeCompare(a.optimized)
        );

        if (imageList.length === 0) {
            gallery.innerHTML = "No images in index.json";
            return;
        }

        imageList.forEach((item, index) => createItem(item, index));
    })
    .catch(err => {
        console.error(err);
        gallery.innerHTML = "Failed to load images-optimized/index.json";
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

    media.dataset.src = `images-optimized/${item.optimized}`;
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
let lightboxVideo = null;

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
        lightboxVideo.remove();
        lightboxVideo = null;
    }
}

function showImage(index) {
    const item = imageList[index];
    const src = `images-optimized/${item.optimized}`;

    if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.remove();
        lightboxVideo = null;
    }

    if (item.optimized.match(/\.webm$/i)) {
        lightboxImg.style.display = "none";

        lightboxVideo = document.createElement("video");
        lightboxVideo.src = src;
        lightboxVideo.controls = true;
        lightboxVideo.autoplay = true;
        lightboxVideo.loop = true;
        lightboxVideo.style.maxWidth = "90vw";
        lightboxVideo.style.maxHeight = "90vh";

        lightbox.appendChild(lightboxVideo);
    } else {
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
