import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionFiles = [
  "package.json",
  "apps/api/package.json",
  "apps/web/package.json",
  "apps/desktop/package.json",
  "apps/desktop/src-tauri/tauri.conf.json",
];

const versions = versionFiles.map((relativePath) => {
  const filePath = path.join(root, relativePath);
  const document = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { filePath: relativePath, version: document.version };
});

const expectedVersion = versions[0].version;
const mismatches = versions.filter(
  ({ version }) => version !== expectedVersion
);

if (!expectedVersion || mismatches.length > 0) {
  console.error("Version mismatch detected:");
  for (const { filePath, version } of versions) {
    console.error(`  ${filePath}: ${version ?? "missing"}`);
  }
  process.exit(1);
}

console.log(`All checked versions match: ${expectedVersion}`);
