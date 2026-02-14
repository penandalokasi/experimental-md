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
let lightboxVideo = null;

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

        imageList = files.sort((a, b) => b.optimized.localeCompare(a.optimized));

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
function openLightbox(index) {
    currentIndex = index;
    showImage(index, null);
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

function showImage(index, direction) {
    const item = imageList[index];
    const src = `images-optimized/${item.optimized}`;

    // Remove existing video
    if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.remove();
        lightboxVideo = null;
    }

    // Create the new element (img or video)
    let newEl;
    if (item.optimized.match(/\.webm$/i)) {
        lightboxImg.style.display = "none";
        newEl = document.createElement("video");
        newEl.src = src;
        newEl.controls = true;
        newEl.autoplay = true;
        newEl.loop = true;
        newEl.style.maxWidth = "90vw";
        newEl.style.maxHeight = "90vh";
        lightbox.appendChild(newEl);
        lightboxVideo = newEl;
    } else {
        newEl = lightboxImg;
        lightboxImg.style.display = "block";
        lightboxImg.src = src;
    }

    // Animation
    if (direction) {
        const distance = direction === "next" ? "100%" : "-100%";
        newEl.style.transition = "none";
        newEl.style.transform = `translateX(${distance})`;
        requestAnimationFrame(() => {
            newEl.style.transition = "transform 0.3s ease";
            newEl.style.transform = "translateX(0)";
            if (lightboxImg !== newEl) {
                // Animate previous element out
                const prevEl = lightboxImg.style.display === "block" ? lightboxImg : lightboxVideo;
                prevEl.style.transition = "transform 0.3s ease";
                prevEl.style.transform = direction === "next" ? "translateX(-100%)" : "translateX(100%)";
                setTimeout(() => {
                    if (prevEl !== lightboxImg) prevEl.remove();
                    prevEl.style.transition = "";
                    prevEl.style.transform = "";
                }, 300);
            }
        });
    }
}

/* ===== Buttons ===== */
closeBtn.onclick = closeLightbox;

lightbox.onclick = (e) =>
