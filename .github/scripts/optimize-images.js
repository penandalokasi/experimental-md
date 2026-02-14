// .github/scripts/optimize-images.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import glob from "glob";

const srcDir = "images";
const outDir = "images-optimized";
const thumbDir = "images-thumbs";
const indexFile = "index.json";

// Create output directories
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

// Collect all supported image files
const files = glob.sync(`${srcDir}/**/*.{jpg,jpeg,png,webp}`, { nodir: true });

if (!files.length) {
  console.log("❌ No images found in /images folder.");
  process.exit(0);
}

const indexData = [];

for (const file of files) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const optimizedName = `${base}.webp`;
  const thumbName = `${base}.webp`;

  const optimizedPath = path.join(outDir, optimizedName);
  const thumbPath = path.join(thumbDir, thumbName);

  console.log(`🪄 Processing: ${file}`);

  try {
    // Full optimized image
    await sharp(file)
      .resize({
        width: 1920,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(optimizedPath);

    // Square thumbnail
    await sharp(file)
      .resize({
        width: 480,
        height: 480,
        fit: "cover",
        position: "centre"
      })
      .webp({ quality: 60 })
      .toFile(thumbPath);

    indexData.push({
      original: path.relative(".", file).replace(/\\/g, "/"),
      optimized: path.relative(".", optimizedPath).replace(/\\/g, "/"),
      thumbnail: path.relative(".", thumbPath).replace(/\\/g, "/")
    });
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err);
  }
}

// Save JSON index
fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));
console.log(`✅ Done. ${indexData.length} images processed.`);
