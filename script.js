<script>
const optimizedBase = "/experimental-md/images-optimized/";
const originalBase = "https://raw.githubusercontent.com/penandalokasi/experimental-md/main/images/";
const jsonPath = "/experimental-md/images-optimized/index.json";

const gallery = document.getElementById("gallery");

fetch(jsonPath)
  .then(res => res.json())
  .then(files => {
    files.forEach((file, index) => {
      const optimizedUrl = optimizedBase + file.optimized;
      const originalUrl = originalBase + file.original;

      const item = document.createElement("div");
      item.className = "gallery-item";

      // Detect video
      const isVideo = file.optimized.endsWith(".webm");

      let media;

      if (isVideo) {
        media = document.createElement("video");
        media.src = optimizedUrl;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.className = "thumb";
        media.addEventListener("mouseenter", () => media.play());
        media.addEventListener("mouseleave", () => media.pause());
      } else {
        media = document.createElement("img");
        media.src = optimizedUrl;
        media.loading = "lazy";
        media.className = "thumb";
      }

      // Open lightbox
      media.addEventListener("click", () => openLightbox(index));

      // Copy button (always visible)
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "Copy URL";
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(originalUrl);
      };

      item.appendChild(media);
      item.appendChild(copyBtn);
      gallery.appendChild(item);
    });

    window.galleryData = files;
  });

/* Lightbox */

const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightbox-content");
const lightboxCopy = document.getElementById("lightbox-copy");

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  showLightboxItem();
  lightbox.classList.add("active");
}

function closeLightbox() {
  lightbox.classList.remove("active");
  lightboxContent.innerHTML = "";
}

function showLightboxItem() {
  const file = window.galleryData[currentIndex];
  const optimizedUrl = optimizedBase + file.optimized;
  const originalUrl = originalBase + file.original;

  lightboxContent.innerHTML = "";

  const isVideo = file.optimized.endsWith(".webm");

  let media;

  if (isVideo) {
    media = document.createElement("video");
    media.src = optimizedUrl;
    media.controls = true;
    media.autoplay = true;
    media.loop = true;
    media.className = "lightbox-media";
  } else {
    media = document.createElement("img");
    media.src = optimizedUrl;
    media.className = "lightbox-media";
  }

  lightboxContent.appendChild(media);

  // Copy ORIGINAL url
  lightboxCopy.onclick = () => {
    navigator.clipboard.writeText(originalUrl);
  };
}

/* Navigation */

document.getElementById("lightbox-close").onclick = closeLightbox;
document.getElementById("lightbox-prev").onclick = () => {
  currentIndex = (currentIndex - 1 + window.galleryData.length) % window.galleryData.length;
  showLightboxItem();
};
document.getElementById("lightbox-next").onclick = () => {
  currentIndex = (currentIndex + 1) % window.galleryData.length;
  showLightboxItem();
};

/* Swipe support */

let startX = 0;
lightbox.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

lightbox.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      document.getElementById("lightbox-next").click();
    } else {
      document.getElementById("lightbox-prev").click();
    }
  }
});
</script>
