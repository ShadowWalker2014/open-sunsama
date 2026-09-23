// Copies the web build into apps/desktop/dist without the marketing-site images.
// The blog hero PNGs alone are ~570 MB; bundling them made every installer ~600 MB
// and pushed the Linux build past 5 hours.
import { cpSync, rmSync, statSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(desktopDir, "../web/dist");
const dest = join(desktopDir, "dist");

const isMarketingAsset = (path) => {
  const rel = relative(src, path).split("\\").join("/");
  return rel.startsWith("blog-") || rel === "landing" || rel.startsWith("landing/") || rel === "og-image.png";
};

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true, filter: (path) => !isMarketingAsset(path) });

const sizeOf = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const path = join(dir, entry.name);
    return total + (entry.isDirectory() ? sizeOf(path) : statSync(path).size);
  }, 0);

console.log(`${basename(dest)}: ${(sizeOf(dest) / 1024 / 1024).toFixed(1)} MB (web dist was ${(sizeOf(src) / 1024 / 1024).toFixed(1)} MB)`);
