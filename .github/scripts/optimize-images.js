// .github/scripts/optimize-images.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { glob } from "glob";  // ✅ fixed import

const srcDir = "images";
const outDir = "images-optimized";
const thumbDir = "images-thumbs";
const indexFile = "index.json";

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

const files = await glob(`${srcDir}/**/*.{jpg,jpeg,png,webp}`);

if (!files.length) {
  console.log("❌ No images found in /images folder.");
  process.exit(0);
}

const indexData = [];

for (const file of files) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);

  console.log(`🪄 Processing: ${file}`);

  const optimizedWebP = path.join(outDir, `${base}.webp`);
  const optimizedAVIF = path.join(outDir, `${base}.avif`);
  const thumbWebP = path.join(thumbDir, `${base}.webp`);
  const thumbAVIF = path.join(thumbDir, `${base}.avif`);

  try {
    // Full optimized versions
    await sharp(file)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optimizedWebP);

    await sharp(file)
      .resize({ width: 1920, withoutEnlargement: true })
      .avif({ quality: 60 })
      .toFile(optimizedAVIF);

    // Square thumbnails
    await sharp(file)
      .resize({ width: 480, height: 480, fit: "cover", position: "centre" })
      .webp({ quality: 60 })
      .toFile(thumbWebP);

    await sharp(file)
      .resize({ width: 480, height: 480, fit: "cover", position: "centre" })
      .avif({ quality: 50 })
      .toFile(thumbAVIF);

    indexData.push({
      original: path.relative(".", file).replace(/\\/g, "/"),
      optimized: {
        webp: path.relative(".", optimizedWebP).replace(/\\/g, "/"),
        avif: path.relative(".", optimizedAVIF).replace(/\\/g, "/")
      },
      thumbnail: {
        webp: path.relative(".", thumbWebP).replace(/\\/g, "/"),
        avif: path.relative(".", thumbAVIF).replace(/\\/g, "/")
      }
    });
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err);
  }
}

fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));
console.log(`✅ Done. ${indexData.length} images processed.`);
