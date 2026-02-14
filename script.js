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
    showImage(index, null); // no animation on first open
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
        lightboxImg.style.display = "block";
        lightboxImg.src = src;
        newEl = lightboxImg;
    }

    // Animate transition if direction specified
    if (direction) {
        const distance = direction === "next" ? "100%" : "-100%";

        // Create temporary clone of previous element
        let prevEl;
        if (lightboxVideo && lightboxVideo !== newEl) prevEl = lightboxVideo.cloneNode(true);
        else if (lightboxImg !== newEl) prevEl = lightboxImg.cloneNode(true);

        if (prevEl) {
            prevEl.style.position = "absolute";
            prevEl.style.top = "50%";
            prevEl.style.left = "50%";
            prevEl.style.transform = "translate(-50%, -50%)";
            prevEl.style.transition = "transform 0.3s ease";
            lightbox.appendChild(prevEl);

            // Animate previous element out
            requestAnimationFrame(() => {
                prevEl.style.transform = `translate(${direction === "next" ? "-150%" : "150%"}, -50%)`;
            });

            // Remove clone after animation
            setTimeout(() => prevEl.remove(), 300);
        }

        // Animate new element in
        if (newEl !== lightboxImg) {
            newEl.style.position = "absolute";
            newEl.style.top = "50%";
            newEl.style.left = direction === "next" ? "150%" : "-150%";
            newEl.style.transform = "translate(-50%, -50%)";
            newEl.style.transition = "transform 0.3s ease";

            requestAnimationFrame(() => {
                newEl.style.left = "50%";
                newEl.style.transform = "translate(-50%, -50%)";
            });

            setTimeout(() => {
                newEl.style.position = "";
                newEl.style.top = "";
                newEl.style.left = "";
                newEl.style.transform = "";
                newEl.style.transition = "";
            }, 300);
        }
    }
}

/* ===== Buttons ===== */
closeBtn.onclick = closeLightbox;

lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
};

lightboxCopy.onclick = () => {
    copyUrl(imageList[currentIndex], lightboxCopy);
};

/* ===== Swipe gestures ===== */
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 50;

lightbox.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, {passive: true});

lightbox.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) closeLightbox(); // Swipe down
    } else if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX < 0 && currentIndex < imageList.length - 1) {
            currentIndex++;
            showImage(currentIndex, "next");
        } else if (deltaX > 0 && currentIndex > 0) {
            currentIndex--;
            showImage(currentIndex, "prev");
        }
    }
}, {passive: true});

/* ===== Keyboard navigation ===== */
document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;

    switch (e.key) {
        case "ArrowRight":
            if (currentIndex < imageList.length - 1) {
                currentIndex++;
                showImage(currentIndex, "next");
            }
            break;
        case "ArrowLeft":
            if (currentIndex > 0) {
                currentIndex--;
                showImage(currentIndex, "prev");
            }
            break;
        case "Escape":
            closeLightbox();
            break;
    }
});
