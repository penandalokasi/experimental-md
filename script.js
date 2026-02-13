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

/* GitHub API endpoint */
const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${config.folder}?ref=${config.branch}`;

/* Load images automatically */
fetch(apiUrl)
    .then(res => res.json())
    .then(files => {
        files.forEach(file => {
            if (file.type !== "file") return;

            // Basic image filter
            if (!file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) return;

            createItem(file.name);
        });
    })
    .catch(err => {
        gallery.innerHTML = "Failed to load images.";
        console.error(err);
    });

function createItem(filename) {
    const container = document.createElement("div");
    container.className = "item";

    const img = document.createElement("img");
    img.src = `${config.folder}/${filename}`;

    img.onclick = () => {
        lightboxImg.src = img.src;
        lightbox.classList.remove("hidden");
    };

    const btn = document.createElement("button");
    btn.textContent = "Copy URL";

    btn.onclick = (e) => {
        e.stopPropagation();

        const url = `https://github.com/${config.user}/${config.repo}/blob/${config.branch}/${config.folder}/${filename}`;

        navigator.clipboard.writeText(url).then(() => {
            btn.textContent = "Copied";
            setTimeout(() => btn.textContent = "Copy URL", 1200);
        });
    };

    container.appendChild(img);
    container.appendChild(btn);
    gallery.appendChild(container);
}

/* Lightbox close */
closeBtn.onclick = () => lightbox.classList.add("hidden");
lightbox.onclick = (e) => {
    if (e.target === lightbox) lightbox.classList.add("hidden");
};
