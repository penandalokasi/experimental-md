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
let isAnimating = false;
let currentEl = null;
let nextEl = null;

/* ===== Load index.json ===== */
fetch(`${config.displayFolder}/index.json`)
    .then(res => res.ok ? res.json() : Promise.reject("index.json not found"))
    .then(files => {
        if (!Array.isArray(files)) throw "index.json format error";
        imageList = files.sort((a, b) => b.optimized.localeCompare(a.optimized));
        if (!imageList.length) throw "No images in index.json";
        imageList.forEach((item, idx) => createItem(item, idx));
    })
    .catch(err => { 
        console.error(err);
        gallery.innerHTML = err; 
    });

/* ===== Lazy loading ===== */
const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.src = el.dataset.src;
        if (el.tagName === "VIDEO") el.play().catch(()=>{});
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
