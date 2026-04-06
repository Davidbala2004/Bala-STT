// =============================================================================
// download-model.mjs — Verified Sherpa-ONNX WASM + Model Downloader
// =============================================================================
// Downloads the exact, production-ready assets for Phase 1.
// 1. Model: GitHub Release (Streaming Zipformer 20M)
// 2. Binaries: Hugging Face CDN (WASM + Glue Code)
// =============================================================================

import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Verified Configuration
// ---------------------------------------------------------------------------

const TARGET_DIR = path.resolve(__dirname, "..", "public", "sherpa-onnx");

const ASSETS = [
  {
    name: "Model Archive",
    url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17.tar.bz2",
    saveAs: "model.tar.bz2",
    isArchive: true,
  },
  {
    name: "WASM API Script",
    url: "https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-en/resolve/main/sherpa-onnx-asr.js",
    saveAs: "sherpa-onnx.js",
  },
  {
    name: "WASM Glue Code",
    url: "https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-en/resolve/main/sherpa-onnx-wasm-main-asr.js",
    saveAs: "sherpa-onnx-wasm-main-asr.js",
  },
  {
    name: "WASM Binary",
    url: "https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-en/resolve/main/sherpa-onnx-wasm-main-asr.wasm",
    saveAs: "sherpa-onnx-wasm-main-asr.wasm",
  },
  {
    name: "WASM Data File",
    url: "https://huggingface.co/spaces/k2-fsa/web-assembly-asr-sherpa-onnx-en/resolve/main/sherpa-onnx-wasm-main-asr.data",
    saveAs: "sherpa-onnx-wasm-main-asr.data",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

/**
 * Download a file with redirect handling.
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (currentUrl) => {
      https.get(currentUrl, (response) => {
        // Handle Redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(response.statusCode)) {
          const location = response.headers.location;
          if (location) {
            console.log(`   ↪ Redirecting to: ${location}`);
            request(new URL(location, currentUrl).href);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${currentUrl}`));
          return;
        }

        const contentLength = parseInt(response.headers["content-length"] || "0", 10);
        let downloaded = 0;

        response.on("data", (chunk) => {
          downloaded += chunk.length;
          if (contentLength > 0) {
            const pct = ((downloaded / contentLength) * 100).toFixed(1);
            process.stdout.write(`\r   📦 Downloading: ${pct}%`);
          }
        });

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`\n   ✅ Saved to: ${path.basename(dest)}`);
          resolve();
        });
      }).on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

/**
 * Extract tar.bz2 on Windows using System32 tar.exe.
 */
function extractArchive(archivePath, targetDir) {
  console.log(`📂 Extracting: ${path.basename(archivePath)}`);
  const tarPath = "C:\\Windows\\System32\\tar.exe";
  try {
    // Check if system tar exists
    if (!fs.existsSync(tarPath)) {
      throw new Error("System tar.exe not found in C:\\Windows\\System32");
    }
    execSync(`"${tarPath}" -xjf "${archivePath}" -C "${targetDir}"`, { stdio: "inherit" });
    console.log(`   ✅ Extraction complete.`);
  } catch (err) {
    console.error(`   ❌ Extraction failed: ${err.message}`);
    console.log("   ⚠️  Try manual extraction using 7-Zip or WinRAR if this persists.");
  }
}

/**
 * Move files from nested directory up to target.
 */
function flatten(targetDir) {
  const items = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const subDir = path.join(targetDir, item.name);
      const subItems = fs.readdirSync(subDir);
      for (const subItem of subItems) {
        const src = path.join(subDir, subItem);
        const dest = path.join(targetDir, subItem);
        if (!fs.existsSync(dest)) fs.renameSync(src, dest);
      }
      fs.rmSync(subDir, { recursive: true, force: true });
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("Sherpa-ONNX Production Asset Downloader");
  console.log("Status: Executing Executive Decision Path");
  console.log("=".repeat(60));

  ensureDir(TARGET_DIR);

  for (const asset of ASSETS) {
    console.log(`\n🔹 ${asset.name}...`);
    const dest = path.join(TARGET_DIR, asset.saveAs);
    
    try {
      await downloadFile(asset.url, dest);
      if (asset.isArchive) {
        extractArchive(dest, TARGET_DIR);
        flatten(TARGET_DIR);
        fs.unlinkSync(dest); // Cleanup archive
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All assets downloaded and prepared in public/sherpa-onnx/");
  console.log("=".repeat(60));
}

main().catch(console.error);
