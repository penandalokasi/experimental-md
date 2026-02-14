/* ===== Config ===== */
const config = {
    user: "penandalokasi",
    repo: "experimental-md",
    branch: "main",
    displayFolder: "images-optimized",
    originalFolder: "images"
};

/* GitHub Pages base path */
const basePath = location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "");

/* Elements */
const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

let imageList = [];
let currentIndex = 0;

/* ===== Load index.json ===== */
fetch(`${basePath}/${config.displayFolder}/index.json`)
    .then(res => {
        if (!res.ok) throw new Error("index.json not found");
        return res.json();
    })
    .then(files => {
        imageList = files.sort((a, b) => b.localeCompare(a));
        imageList.forEach((name, index) => createItem(name, index));
    })
    .catch(err => {
        console.error(err);
        gallery.innerHTML = "Failed to load image index.";
    });

/* ===== Lazy loading ===== */
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        obs.unobserve(img);
    });
}, { rootMargin: "200px" });

/* ===== Create thumbnails ===== */
function createItem(filename, index) {
    const container = document.createElement("div");
    container.className = "item";

    const img = document.createElement("img");
    img.dataset.src = `${basePath}/${config.displayFolder}/${filename}`;
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

/* ===== Copy original URL ===== */
/* Converts optimized name -> original base name only */
function getRawUrl(optimizedFilename) {
    const base = optimizedFilename.replace(/\.[^/.]+$/, "");
    return `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch}/${config.originalFolder}/${base}`;
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
    lightboxImg.src = `${basePath}/${config.displayFolder}/${imageList[index]}`;
}

closeBtn.onclick = closeLightbox;

lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
};

lightboxCopy.onclick = () => {
    copyUrl(imageList[currentIndex], lightboxCopy);
};
