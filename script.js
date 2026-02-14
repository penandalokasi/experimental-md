/* ===== Repository config ===== */
const config = {
    user: "penandalokasi",
    repo: "experimental-md",
    branch: "main",
    displayFolder: "images-optimized", // shown in gallery
    originalFolder: "images"            // used for copy URL
};

const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

let imageList = [];
let originalMap = {};
let currentIndex = 0;

/* ===== API URLs ===== */
const optimizedApiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${config.displayFolder}?ref=${config.branch}`;
const originalApiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${config.originalFolder}?ref=${config.branch}`;

/* ===== Load images ===== */
async function loadImages() {
    try {
        const optimizedRes = await fetch(optimizedApiUrl);
        const originalRes = await fetch(originalApiUrl);

        if (!optimizedRes.ok) throw new Error("Optimized folder not found");
        if (!originalRes.ok) throw new Error("Original folder not found");

        const optimizedFiles = await optimizedRes.json();
        const originalFiles = await originalRes.json();

        /* Build original filename map */
        originalFiles
            .filter(file => file.type === "file")
            .forEach(file => {
                const base = file.name.replace(/\.[^/.]+$/, "");
                originalMap[base] = file.name;
            });

        /* Optimized list */
        imageList = optimizedFiles
            .filter(file => file.type === "file")
            .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|webm)$/i))
            .sort((a, b) => b.name.localeCompare(a.name))
            .map(file => file.name);

        if (imageList.length === 0) {
            gallery.innerHTML = "No images found in images-optimized.";
            return;
        }

        imageList.forEach((name, index) => createItem(name, index));

    } catch (err) {
        console.error(err);
        gallery.innerHTML = "Failed to load images. Check folder names and repository.";
    }
}

loadImages();

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
    img.dataset.src = `${config.displayFolder}/${filename}`;
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
    container.append
