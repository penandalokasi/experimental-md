/* ===== Config ===== */
const config = {
  user: "penandalokasi",
  repo: "experimental-md",
  branch: "main",
  displayFolder: "images-optimized",
  thumbFolder: "images-thumbs",
  originalFolder: "images"
};

/* ===== Elements ===== */
const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const closeBtn = document.getElementById("closeBtn");
const lightboxCopy = document.getElementById("lightboxCopy");

let imageList = [];
let currentIndex = 0;
let currentEl = null;
let nextEl = null;
let isAnimating = false;

/* ===== Load Images ===== */
fetch("index.json")
  .then(r => r.ok ? r.json() : Promise.reject("index.json not found"))
  .then(files => {
    if (!Array.isArray(files)) throw "index.json format error";
    imageList = files.sort((a, b) => b.original.localeCompare(a.original));
    if (!imageList.length) throw "No images in index.json";
    imageList.forEach((item, i) => createThumbnail(item, i));
  })
  .catch(err => gallery.innerHTML = err);

/* ===== Create Thumbnails (with <picture>) ===== */
function createThumbnail(item, index) {
  const container = document.createElement("div");
  container.className = "item";

  const picture = document.createElement("picture");

  const srcAvif = item.thumbnail?.avif || `${config.thumbFolder}/${item.original}.avif`;
  const srcWebp = item.thumbnail?.webp || `${config.thumbFolder}/${item.original}.webp`;

  const sourceAvif = document.createElement("source");
  sourceAvif.type = "image/avif";
  sourceAvif.srcset = srcAvif;

  const sourceWebp = document.createElement("source");
  sourceWebp.type = "image/webp";
  sourceWebp.srcset = srcWebp;

  const img = document.createElement("img");
  img.src = srcWebp;
  img.alt = item.original;
  img.draggable = false;
  img.dataset.index = index;
  img.onclick = () => openLightbox(index);

  picture.append(sourceAvif, sourceWebp, img);
  container.appendChild(picture);

  // Copy button
  const btn = document.createElement("button");
  btn.textContent = "Copy URL";
  btn.onclick = e => {
    e.stopPropagation();
    copyUrl(item, btn);
  };
  container.appendChild(btn);

  gallery.appendChild(container);
}

/* ===== Copy URL ===== */
function copyUrl(item, btn) {
  const url = `https://raw.githubusercontent.com/${config.user}/${config.repo}/${config.branch}/${item.original}`;
  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      const txt = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = txt), 1200);
    }
  });
}

/* ===== Lightbox (with <picture>) ===== */
function createLightboxEl(item) {
  const picture = document.createElement("picture");

  const srcAvif = item.optimized?.avif || `${config.displayFolder}/${item.original}.avif`;
  const srcWebp = item.optimized?.webp || `${config.displayFolder}/${item.original}.webp`;

  const sourceAvif = document.createElement("source");
  sourceAvif.type = "image/avif";
  sourceAvif.srcset = srcAvif;

  const sourceWebp = document.createElement("source");
  sourceWebp.type = "image/webp";
  sourceWebp.srcset = srcWebp;

  const img = document.createElement("img");
  img.src = srcWebp;
  img.alt = item.original;
  Object.assign(img.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    maxWidth: "90vw",
    maxHeight: "90vh",
    transition: "transform 0.3s ease,left 0.3s ease"
  });

  picture.append(sourceAvif, sourceWebp, img);
  return picture;
}

function openLightbox(index) {
  currentIndex = index;
  currentEl = createLightboxEl(imageList[currentIndex]);
  lightbox.innerHTML = "";
  lightbox.appendChild(currentEl);

  // Close (X) button
  const xBtn = document.createElement("button");
  xBtn.textContent = "✕";
  Object.assign(xBtn.style, {
    position: "absolute",
    top: "10px",
    right: "10px",
    zIndex: "20",
    fontSize: "1.8rem",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "3px",
    padding: "5px 10px",
    cursor: "pointer"
  });
  xBtn.onclick = closeLightbox;
  lightbox.appendChild(xBtn);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy URL";
  Object.assign(copyBtn.style, {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "20",
    fontSize: "1rem",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    borderRadius: "3px",
    padding: "5px 10px",
    cursor: "pointer"
  });
  copyBtn.onclick = () => copyUrl(imageList[currentIndex], copyBtn);
  lightbox.appendChild(copyBtn);

  lightbox.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  addSideNav();
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  document.body.classList.remove("no-scroll");
  lightbox.innerHTML = "";
  currentEl = nextEl = null;
}

/* ===== Navigation ===== */
function navigate(direction) {
  if (isAnimating) return;
  if (direction === "next" && currentIndex >= imageList.length - 1) return;
  if (direction === "prev" && currentIndex <= 0) return;

  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  nextEl = createLightboxEl(imageList[nextIndex]);
  nextEl.style.left = direction === "next" ? "150%" : "-150%";
  lightbox.appendChild(nextEl);

  requestAnimationFrame(() => {
    currentEl.style.left = direction === "next" ? "-150%" : "150%";
    nextEl.style.left = "50%";
  });

  isAnimating = true;
  setTimeout(() => {
    lightbox.removeChild(currentEl);
    currentEl = nextEl;
    nextEl = null;
    currentIndex = nextIndex;
    isAnimating = false;
  }, 300);
}

/* ===== Keyboard & Swipe ===== */
document.addEventListener("keydown", e => {
  if (lightbox.classList.contains("hidden")) return;
  if (e.key === "ArrowRight") navigate("next");
  if (e.key === "ArrowLeft") navigate("prev");
  if (e.key === "Escape") closeLightbox();
});

let touchStartX = 0, touchStartY = 0;
const swipeThreshold = 50;

lightbox.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

lightbox.addEventListener("touchend", e => {
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  const deltaY = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold && deltaY > 0) {
    closeLightbox();
  } else if (Math.abs(deltaX) > swipeThreshold) {
    deltaX < 0 ? navigate("next") : navigate("prev");
  }
}, { passive: true });

/* ===== Side Clickable Nav ===== */
function addSideNav() {
  const left = document.createElement("div");
  const right = document.createElement("div");
  [left, right].forEach(el => {
    Object.assign(el.style, {
      position: "absolute",
      top: "0",
      bottom: "0",
      width: "20%",
      cursor: "pointer",
      zIndex: "10",
      background: "rgba(0,0,0,0)"
    });
    lightbox.appendChild(el);
  });
  left.style.left = "0";
  right.style.right = "0";
  left.onclick = () => navigate("prev");
  right.onclick = () => navigate("next");
}

/* ===== Close Buttons ===== */
lightboxCopy.onclick = () => copyUrl(imageList[currentIndex], lightboxCopy);
closeBtn.onclick = closeLightbox;
lightbox.onclick = e => { if (e.target === lightbox) closeLightbox(); };
