// .github/scripts/optimize-images.js
// Robust image optimizer: Sharp for static images, FFmpeg for GIF->WebM conversion.
// Requires: node (ESM), sharp, glob. FFmpeg should be available on the runner.

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { glob } from "glob";
import { spawnSync } from "child_process";

const srcDir = "images";
const outDir = "images-optimized";
const thumbDir = "images-thumbs";
const indexFile = "index.json";

// ensure output dirs
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(thumbDir, { recursive: true });

/** Helper: run a command sync, return { ok, stdout, stderr, code } */
function runCmd(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  return {
    ok: res.status === 0,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    code: res.status
  };
}

// Check ffmpeg presence
const ffprobe = runCmd("ffmpeg", ["-version"]);
if (!ffprobe.ok) {
  console.warn("⚠️ ffmpeg not found or not runnable in PATH. GIF -> WebM conversion will fail.");
  console.warn("ffmpeg stdout/stderr:", ffprobe.stdout, ffprobe.stderr);
  // we don't exit here; we will attempt but log conversion failures per-file.
}

console.log("Searching for images...");

// Use a case-insensitive glob pattern for supported extensions (recursive)
const pattern = `${srcDir}/**/*.+(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG|WEBP|GIF)`;
const files = await glob(pattern, { nocase: true });

if (!files.length) {
  console.log("❌ No images found in /images folder. Exiting.");
  process.exit(0);
}

console.log(`Found ${files.length} file(s). Processing...`);

const indexData = [];

for (const file of files) {
  try {
    const extRaw = path.extname(file);
    const ext = extRaw.toLowerCase();
    const base = path.basename(file, extRaw);
    console.log(`\n---\nProcessing: ${file} (ext=${ext})`);

    // GIF processing -> convert to webm for both optimized and thumbnail
    if (ext === ".gif") {
      // Output paths
      const optimizedWebM = path.join(outDir, `${base}.webm`);
      const thumbWebM = path.join(thumbDir, `${base}.webm`);

      console.log("Detected GIF. Converting to WebM...");

      // Convert full GIF -> webm (VP9) (no audio)
      // Arguments: input, libvpx-vp9, quality tuned (crf), variable bitrate
      const fullArgs = [
        "-y",               // overwrite
        "-i", file,         // input file
        "-c:v", "libvpx-vp9",
        "-b:v", "0",        // use CRF mode
        "-crf", "35",       // quality
        "-an",              // strip audio if any
        optimizedWebM
      ];
      let r = runCmd("ffmpeg", fullArgs, { stdio: "pipe" });
      if (!r.ok) {
        console.error(`❌ ffmpeg failed converting full GIF -> WebM for ${file}`);
        console.error("ffmpeg stderr:", r.stderr.slice(0, 2000));
        // fallback: copy original GIF as optimized (not ideal, but prevents missing assets)
        try {
          fs.copyFileSync(file, path.join(outDir, `${base}.gif`));
          console.warn("Copied original GIF to images-optimized as fallback.");
          indexData.push({
            original: path.relative(".", file).replace(/\\/g, "/"),
            optimized: { gif: path.relative(".", path.join(outDir, `${base}.gif`)).replace(/\\/g, "/") },
            thumbnail: { gif: path.relative(".", path.join(thumbDir, `${base}.gif`)).replace(/\\/g, "/") },
            format: "gif"
          });
        } catch (copyErr) {
          console.error("❌ Also failed to copy fallback GIF:", copyErr);
        }
        continue; // move to next file
      } else {
        console.log("Converted full GIF ->", optimizedWebM);
      }

      // Create square-cropped thumbnail WebM (limit to 3s)
      // scale then crop to 480x480, set duration -t 3 (if shorter, ffmpeg will not fail)
      const thumbArgs = [
        "-y",
        "-i", file,
        "-vf", "scale=480:480:force_original_aspect_ratio=increase,crop=480:480,setsar=1",
        "-an",
        "-t", "3",
        "-c:v", "libvpx-vp9",
        "-b:v", "0",
        "-crf", "40",
        thumbWebM
      ];
      r = runCmd("ffmpeg", thumbArgs, { stdio: "pipe" });
      if (!r.ok) {
        console.error(`❌ ffmpeg failed creating thumbnail WebM for ${file}`);
        console.error("ffmpeg stderr:", r.stderr.slice(0, 2000));
        // fallback: generate a static thumbnail PNG using sharp (first frame)
        try {
          const thumbPng = path.join(thumbDir, `${base}.png`);
          await sharp(file, { animated: true, pages: 1 })
            .resize({ width: 480, height: 480, fit: "cover", position: "centre" })
            .png({ quality: 70 })
            .toFile(thumbPng);
          console.warn("Created static PNG thumbnail as fallback:", thumbPng);
          indexData.push({
            original: path.relative(".", file).replace(/\\/g, "/"),
            optimized: { webm: path.relative(".", optimizedWebM).replace(/\\/g, "/") },
            thumbnail: { png: path.relative(".", thumbPng).replace(/\\/g, "/") },
            format: "webm"
          });
        } catch (pngErr) {
          console.error("❌ Failed to create fallback PNG thumbnail:", pngErr);
        }
        continue;
      } else {
        console.log("Created thumbnail WebM ->", thumbWebM);
      }

      // Success
      indexData.push({
        original: path.relative(".", file).replace(/\\/g, "/"),
        optimized: { webm: path.relative(".", optimizedWebM).replace(/\\/g, "/") },
        thumbnail: { webm: path.relative(".", thumbWebM).replace(/\\/g, "/") },
        format: "webm"
      });

      continue; // done with this file
    }

    // Non-GIF static images: generate AVIF + WebP + square thumbnails
    const optimizedWebP = path.join(outDir, `${base}.webp`);
    const optimizedAVIF = path.join(outDir, `${base}.avif`);
    const thumbWebP = path.join(thumbDir, `${base}.webp`);
    const thumbAVIF = path.join(thumbDir, `${base}.avif`);

    console.log("Static image: generating WebP and AVIF (full + thumb) ...");

    // Full optimized
    await sharp(file)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optimizedWebP);
    await sharp(file)
      .resize({ width: 1920, withoutEnlargement: true })
      .avif({ quality: 60 })
      .toFile(optimizedAVIF);

    // Thumbnails (square)
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
      },
      format: "image"
    });
  } catch (err) {
    console.error(`❌ Error processing file ${file}:`, err);
  }
} // end for

// Write index.json
fs.writeFileSync(indexFile, JSON.stringify(indexData, null, 2));
console.log(`\n✅ Done. ${indexData.length} entries written to ${indexFile}`);
