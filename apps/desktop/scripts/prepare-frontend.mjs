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

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [{ path, size: statSync(path).size }];
  });
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
const shipped = files(dest);
const total = shipped.reduce((sum, f) => sum + f.size, 0);
console.log(`${basename(dest)}: ${mb(total)} MB`);

// Guard: the desktop frontend is ~20 MB. If it grows past the limit, someone added large
// files to apps/web/public that the desktop app would ship. Exclude them in
// isMarketingAsset above (or shrink them) instead of raising the limit.
const LIMIT_MB = 60;
if (total > LIMIT_MB * 1024 * 1024) {
  console.error(`\n✗ Desktop frontend is ${mb(total)} MB (limit ${LIMIT_MB} MB). Largest files:`);
  shipped
    .sort((a, b) => b.size - a.size)
    .slice(0, 15)
    .forEach((f) => console.error(`  ${mb(f.size).padStart(7)} MB  ${relative(dest, f.path)}`));
  process.exit(1);
}
