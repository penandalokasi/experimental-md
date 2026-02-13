const USER = "penandalokasi";
const REPO = "experimental-md";
const BRANCH = "main";
const FOLDER = "images";

const gallery = document.getElementById("gallery");

/* ===== Load images from GitHub ===== */

async function loadImages() {
  try {
    const api = `https://api.github.com/repos/${USER}/${REPO}/contents/${FOLDER}?ref=${BRANCH}`;
    const res = await fetch(api);

    if (!res.ok) {
      throw new Error("GitHub API error: " + res.status);
    }

    const data = await res.json();

    let files = data
      .filter(f => f.type === "file")
      .map(f => f.name);

    if (files.length === 0) {
      gallery.innerHTML = "<p style='color:white;padding:20px'>No images found</p>";
      return;
    }

    /* Sort newest first */
    files.sort().reverse();

    const urls = files.map(name =>
      `https://raw.githubusercontent.com/${USER}/${REPO}/${BRANCH}/${FOLDER}/${name}`
    );

    window.imageList = urls;
    buildGallery(urls);

  } catch (err) {
    console.error(err);
    gallery.innerHTML = `<p style="color:white;padding:20px">
      Failed to load images.<br>
      Check USER / REPO / BRANCH / FOLDER.
    </p>`;
  }
}

/* ===== Build gallery ===== */

function buildGallery(urls) {
  gallery.innerHTML = "";

  urls.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = url;
    img.onclick = () => openLightbox(index);

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.onclick = e => {
      e.stopPropagation();
      navigator.clipboard.writeText(url);
    };

    item.appendChild(img);
    item.appendChild(btn);
    gallery.appendChild(item);
  });
}

/* ===== Lightbox ===== */

const lightbox = document.getElementById("lightbox");
const inner = document.querySelector(".lightbox-inner");
const imgMain = document.getElementById("lightbox-img");
const imgPrev = document.getElementById("lightbox-img-prev");
const imgNext = document.getElementById("lightbox-img-next");
const copyBtn = document.getElementById("lightbox-copy");

let currentIndex = 0;
let startX = 0;
let startY = 0;
let dx = 0;
let dy = 0;
let dragging = false;

function openLightbox(index) {
  currentIndex = index;
  updateLightboxImages();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
  inner.style.transform = "translate(-50%, -50%)";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function updateLightboxImages() {
  const list = window.imageList;

  imgMain.src = list[currentIndex];
  imgPrev.src = list[currentIndex - 1] || "";
  imgNext.src = list[currentIndex + 1] || "";

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(list[currentIndex]);
  };
}

/* ===== Swipe ===== */

lightbox.addEventListener("pointerdown", e => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  dx = 0;
  dy = 0;
  inner.style.transition = "none";
});

lightbox.addEventListener("pointermove", e => {
  if (!dragging) return;
  dx = e.clientX - startX;
  dy = e.clientY - startY;
  inner.style.transform = `translate(-50%, -50%) translateX(${dx}px)`;
});

lightbox.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;

  const threshold = window.innerWidth * 0.2;

  if (Math.abs(dy) > 120 && Math.abs(dy) > Math.abs(dx)) {
    closeLightbox();
    return;
  }

  if (dx < -threshold && currentIndex < window.imageList.length - 1) {
    currentIndex++;
    slide(-window.innerWidth);
  } else if (dx > threshold && currentIndex > 0) {
    currentIndex--;
    slide(window.innerWidth);
  } else {
    slide(0);
  }
});

function slide(offset) {
  inner.style.transition = "transform 0.25s ease";
  inner.style.transform = `translate(-50%, -50%) translateX(${offset}px)`;

  setTimeout(() => {
    updateLightboxImages();
    inner.style.transition = "none";
    inner.style.transform = "translate(-50%, -50%)";
  }, 250);
}

lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

lightbox.addEventListener("touchmove", e => {
  e.preventDefault();
}, { passive: false });

/* Start */
loadImages();}

/* Swipe system */

lightbox.addEventListener("pointerdown", e => {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  deltaX = 0;
  deltaY = 0;
  inner.style.transition = "none";
});

lightbox.addEventListener("pointermove", e => {
  if (!dragging) return;

  deltaX = e.clientX - startX;
  deltaY = e.clientY - startY;

  inner.style.transform =
    `translate(-50%, -50%) translateX(${deltaX}px)`;
});

lightbox.addEventListener("pointerup", () => {
  if (!dragging) return;
  dragging = false;

  const threshold = window.innerWidth * 0.2;

  /* Swipe down to close */
  if (Math.abs(deltaY) > 120 && Math.abs(deltaY) > Math.abs(deltaX)) {
    closeLightbox();
    return;
  }

  /* Left */
  if (deltaX < -threshold && currentIndex < window.imageList.length - 1) {
    currentIndex++;
    animateTo(-window.innerWidth);
  }
  /* Right */
  else if (deltaX > threshold && currentIndex > 0) {
    currentIndex--;
    animateTo(window.innerWidth);
  }
  else {
    animateTo(0);
  }
});

function animateTo(offset) {
  inner.style.transition = "transform 0.25s ease";
  inner.style.transform =
    `translate(-50%, -50%) translateX(${offset}px)`;

  setTimeout(() => {
    updateLightboxImages();
    inner.style.transition = "none";
    inner.style.transform = "translate(-50%, -50%) translateX(0)";
  }, 250);
}

/* Click outside to close */
lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

/* Prevent background scroll on mobile */
lightbox.addEventListener("touchmove", e => {
  e.preventDefault();
}, { passive: false });

/* Start */
loadImages();
    resetPosition();
}

/* Touch events */
lightbox.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

lightbox.addEventListener("touchmove", (e) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

lightbox.addEventListener("touchend", (e) => {
    handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

/* Mouse events (desktop drag) */
lightbox.addEventListener("mousedown", (e) => {
    handleStart(e.clientX, e.clientY);
});

window.addEventListener("mousemove", (e) => {
    handleMove(e.clientX, e.clientY);
});

window.addEventListener("mouseup", (e) => {
    handleEnd(e.clientX, e.clientY);
});
