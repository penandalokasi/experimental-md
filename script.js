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

/* GitHub API */
const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${config.folder}?ref=${config.branch}`;

/* ===== Load images automatically ===== */
fetch(apiUrl)
    .then(res => res.json())
    .then(files => {
        files
            .filter(file => file.type === "file")
            .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i))
            .sort((a, b) => b.name.localeCompare(a.name)) // newest first
            .forEach(file => createItem(file.name));
    })
    .catch(err => {
        gallery.innerHTML = "Failed to load images.";
        console.error(err);
    });

/* ===== Create gallery item ===== */
function createItem(filename) {
    const container = document.createElement("div");
    container.className = "item";

    const img = document.createElement("img");
    img.src = `${config.folder}/${filename}`;
    img.draggable = false;

    img.onclick = () => {
        lightboxImg.src = img.src;
        lightbox.classList.remove("hidden");
    };

    /* Copy direct RAW image URL */
    const btn = document.createElement("button");
    btn.textContent = "Copy URL";

    btn.onclick = (e) => {
        e.stopPropagation();

        const url = `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch}/${config.folder}/${filename}`;

        navigator.clipboard.writeText(url).then(() => {
            btn.textContent = "Copied";
            setTimeout(() => btn.textContent = "Copy URL", 1200);
        });
    };

    container.appendChild(img);
    container.appendChild(btn);
    gallery.appendChild(container);
}

/* ===== Lightbox controls ===== */
closeBtn.onclick = () => lightbox.classList.add("hidden");

lightbox.onclick = (e) => {
    if (e.target === lightbox) {
        lightbox.classList.add("hidden");
    }
};

/* ESC to close */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        lightbox.classList.add("hidden");
    }
});

/* Swipe down to close (mobile) */
let startY = 0;

lightbox.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
});

lightbox.addEventListener("touchend", (e) => {
    const endY = e.changedTouches[0].clientY;
    if (endY - startY > 80) {
        lightbox.classList.add("hidden");
    }
});
