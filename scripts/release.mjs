#!/usr/bin/env node
// Cut a desktop release: bump the version, sync every app, commit, tag, push.
// The tag push starts .github/workflows/desktop-release.yml.
//
//   bun run release            # patch: 1.0.12 -> 1.0.13
//   bun run release minor      # 1.0.12 -> 1.1.0
//   bun run release 2.0.0      # exact version
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const sh = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] }).trim();
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

const branch = sh("git rev-parse --abbrev-ref HEAD");
if (branch !== "main") fail(`Releases are cut from main (you are on ${branch}).`);

const dirty = sh("git status --porcelain --untracked-files=no");
if (dirty) fail(`Commit or stash these changes first:\n${dirty}`);

run("git fetch --quiet origin main --tags");
if (sh("git rev-parse HEAD") !== sh("git rev-parse origin/main")) fail("Local main differs from origin/main. Pull or push first.");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const arg = process.argv[2] ?? "patch";
const next =
  arg === "patch" ? `${major}.${minor}.${patch + 1}` :
  arg === "minor" ? `${major}.${minor + 1}.0` :
  arg === "major" ? `${major + 1}.0.0` :
  /^\d+\.\d+\.\d+$/.test(arg) ? arg :
  fail(`Unknown version "${arg}". Use patch, minor, major, or x.y.z.`);

if (sh(`git tag --list v${next}`)) fail(`Tag v${next} already exists.`);

pkg.version = next;
writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
run("bun run version:sync");

const agents = readFileSync("AGENTS.md", "utf8").replace(/\*\*Current version:\*\* v[\d.]+/, `**Current version:** v${next}`);
writeFileSync("AGENTS.md", agents);

run("git add package.json AGENTS.md apps/*/package.json apps/*/src-tauri/tauri.conf.json");
run(`git commit --quiet -m "release: v${next}"`);
run(`git tag -a v${next} -m "Release v${next}"`);
run("git push --quiet origin main");
run(`git push --quiet origin v${next}`);

console.log(`\n✓ Released v${next}. Build: https://github.com/ShadowWalker2014/open-sunsama/actions/workflows/desktop-release.yml`);
