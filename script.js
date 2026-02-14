<script>
const optimizedBase = "/experimental-md/images-optimized/";
const originalBase = "https://raw.githubusercontent.com/penandalokasi/experimental-md/main/images/";
const jsonPath = "/experimental-md/images.json";

const gallery = document.getElementById("gallery");

// Debug: confirm script runs
console.log("Gallery script started");

fetch(jsonPath)
  .then(res => {
    if (!res.ok) {
      throw new Error("JSON failed to load: " + res.status);
    }
    return res.json();
  })
  .then(files => {
    console.log("JSON loaded:", files.length, "items");

    if (!files || files.length === 0) {
      gallery.innerHTML = "<p>No images found</p>";
      return;
    }

    files.forEach((file, index) => {
      const optimizedUrl = optimizedBase + file.optimized;
      const originalUrl = originalBase + file.original;

      const item = document.createElement("div");
      item.className = "gallery-item";

      let media;

      // webm = video
      if (file.optimized.toLowerCase().endsWith(".webm")) {
        media = document.createElement("video");
        media.src = optimizedUrl;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = "metadata";
        media.className = "thumb";
      } else {
        media = document.createElement("img");
        media.src = optimizedUrl;
        media.loading = "lazy";
        media.className = "thumb";
      }

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
  })
  .catch(err => {
    console.error(err);
    gallery.innerHTML = "<p>Gallery failed to load. Check console.</p>";
  });
</script>
