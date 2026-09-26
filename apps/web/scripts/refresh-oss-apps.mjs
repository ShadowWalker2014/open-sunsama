#!/usr/bin/env node
/* eslint-disable no-console -- a CLI that reports what it changed */
/**
 * Refreshes the facts in src/content/oss-apps.json that change on their own:
 * stars, license, latest release, last commit, primary language and archived
 * status, from each app's repo API. Stamps checkedAt and prints what changed.
 *
 *   node scripts/refresh-oss-apps.mjs            # every app
 *   node scripts/refresh-oss-apps.mjs vikunja    # only these ids
 *   node scripts/refresh-oss-apps.mjs --dry-run  # print the diff, write nothing
 *
 * GitHub goes through `gh api` (authenticated, 5,000 requests an hour) and
 * falls back to the public API (60 an hour; set GITHUB_TOKEN to raise it).
 * GitLab hosts (gitlab.com, gitlab.gnome.org, invent.kde.org, framagit.org)
 * use the GitLab v4 API, and Codeberg/Gitea hosts the Gitea v1 API.
 *
 * Latest release: the newest stable GitHub release, or a newer version tag when
 * a project only tags. Monorepos set `releaseTag: { prefix, pattern }` on the
 * app to pick their own tags (Thunderbird, Proton, Tuta; Focalboard, whose
 * v8 release ships only the Mattermost plugin).
 *
 * Curated fields (tagline, platforms, API, MCP, screenshot) are never touched.
 * A license the repo API reports is written only when it disagrees with the
 * curated SPDX id; "NOASSERTION" (custom or multi-license repos) keeps ours.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/content/oss-apps.json");
// Local calendar date (the day the facts were checked), not UTC
const TODAY = new Date().toLocaleDateString("en-CA");
const GITLAB_HOSTS = new Set(["gitlab.com", "gitlab.gnome.org", "invent.kde.org", "framagit.org", "gitlab.freedesktop.org"]);
const GITEA_HOSTS = new Set(["codeberg.org", "gitea.com"]);
/** No commits for this long turns an "active" app into "maintenance". */
const STALE_DAYS = 365;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = new Set(args.filter((a) => !a.startsWith("--")));

// --- HTTP -----------------------------------------------------------------

let ghCli = true;

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "open-sunsama-oss-refresh", ...headers } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** GitHub REST GET; null on 404. */
async function github(endpoint) {
  if (ghCli) {
    try {
      const out = execFileSync("gh", ["api", endpoint], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 64 * 1024 * 1024,
      });
      return JSON.parse(out);
    } catch (err) {
      const stderr = String(err.stderr ?? "");
      if (stderr.includes("Not Found") || stderr.includes("HTTP 404")) return null;
      if (err.code === "ENOENT" || stderr.includes("auth login")) {
        console.warn("gh CLI unavailable; using the public GitHub API");
        ghCli = false;
      } else {
        throw new Error(`gh api ${endpoint}: ${stderr.trim() || err.message}`);
      }
    }
  }
  const token = process.env.GITHUB_TOKEN;
  return getJson(`https://api.github.com/${endpoint}`, {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
}

const day = (iso) => (iso ? iso.slice(0, 10) : null);


// --- Hosts ------------------------------------------------------------------

/** Numeric version compare for arrays like [6, 10, 2]. */
function compareVersions(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

const versionParts = (name) => name.match(/(\d+(?:\.\d+)*)/)?.[1]?.split(".").map(Number) ?? null;

/** A tag ref's commit date (lightweight or annotated tag). */
async function tagDate(full, object) {
  if (object.type === "tag") {
    const tag = await github(`repos/${full}/git/tags/${object.sha}`);
    return day(tag?.tagger?.date);
  }
  // git/commits is the light endpoint: no file list
  const commit = await github(`repos/${full}/git/commits/${object.sha}`);
  return day(commit?.committer?.date);
}

/**
 * Newest release for a repo that tags one app among many (monorepos) or
 * doesn't publish GitHub releases for it: `releaseTag.pattern` is a regex whose
 * capture groups are the version numbers, e.g. "^THUNDERBIRD_(\\d+)_(\\d+)(?:_(\\d+))?_RELEASE$".
 */
async function newestMatchingTag(full, { prefix, pattern }) {
  const re = new RegExp(pattern);
  const refs = (await github(`repos/${full}/git/matching-refs/tags/${encodeURIComponent(prefix)}`)) ?? [];
  const best = refs
    .map((ref) => {
      const name = ref.ref.replace("refs/tags/", "");
      const m = name.match(re);
      return m ? { name, object: ref.object, v: m.slice(1).filter(Boolean).map(Number) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => compareVersions(b.v, a.v))[0];
  if (!best) return null;
  return { version: best.v.join("."), date: await tagDate(full, best.object) };
}

async function fromGithub(owner, repo, app) {
  const info = await github(`repos/${owner}/${repo}`);
  if (!info) throw new Error(`repo not found: ${owner}/${repo}`);
  const full = info.full_name;
  const [releases, tags, commits] = await Promise.all([
    app.releaseTag ? null : github(`repos/${full}/releases?per_page=20`),
    app.releaseTag ? null : github(`repos/${full}/tags?per_page=100`),
    github(`repos/${full}/commits?per_page=1`),
  ]);

  let latestRelease = null;
  if (app.releaseTag) {
    latestRelease = await newestMatchingTag(full, app.releaseTag);
  } else {
    // Newest stable GitHub release by date...
    const release = (releases ?? [])
      .filter((r) => !r.draft && !r.prerelease)
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))[0];
    if (release) latestRelease = { version: release.tag_name, date: day(release.published_at ?? release.created_at) };
    // ...unless the project stopped publishing releases and only tags now (e.g. Nextcloud Calendar)
    const tag = (tags ?? [])
      .map((t) => ({ t, v: /^v?\d+(\.\d+)*$/.test(t.name) ? versionParts(t.name) : null }))
      .filter((x) => x.v)
      .sort((a, b) => compareVersions(b.v, a.v))[0];
    const releaseV = latestRelease && versionParts(latestRelease.version);
    if (tag && (!releaseV || compareVersions(tag.v, releaseV) > 0)) {
      latestRelease = { version: tag.t.name, date: await tagDate(full, { type: "commit", sha: tag.t.commit.sha }) };
    }
  }

  const spdx = info.license?.spdx_id;
  return {
    canonical: info.html_url,
    stars: info.stargazers_count,
    archived: info.archived,
    license: spdx && spdx !== "NOASSERTION" ? { spdx, name: info.license.name } : null,
    latestRelease,
    lastCommit: day(commits?.[0]?.commit?.committer?.date),
    primaryLanguage: info.language ?? null,
  };
}

async function fromGitlab(host, projectPath) {
  const api = `https://${host}/api/v4/projects/${encodeURIComponent(projectPath)}`;
  const info = await getJson(`${api}?license=true`);
  if (!info) throw new Error(`project not found: ${host}/${projectPath}`);
  const [releases, commits, languages] = await Promise.all([
    getJson(`${api}/releases?per_page=1`),
    getJson(`${api}/repository/commits?per_page=1`),
    getJson(`${api}/languages`),
  ]);
  let latestRelease = releases?.[0] ? { version: releases[0].tag_name, date: day(releases[0].released_at) } : null;
  if (!latestRelease) {
    const tags = await getJson(`${api}/repository/tags?per_page=1&order_by=updated&sort=desc`);
    if (tags?.[0]) latestRelease = { version: tags[0].name, date: day(tags[0].commit?.committed_date) };
  }
  const language = Object.entries(languages ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const key = info.license?.key;
  return {
    canonical: info.web_url,
    stars: info.star_count,
    archived: info.archived,
    // GitLab license keys are lowercase SPDX-ish ids ("gpl-3.0"); used only to flag changes
    license: key && key !== "other" ? { spdx: key.toUpperCase(), name: info.license.name, loose: true } : null,
    latestRelease,
    lastCommit: day(commits?.[0]?.committed_date),
    primaryLanguage: language,
  };
}

async function fromGitea(host, owner, repo) {
  const api = `https://${host}/api/v1/repos/${owner}/${repo}`;
  const info = await getJson(api);
  if (!info) throw new Error(`repo not found: ${host}/${owner}/${repo}`);
  const [releases, commits, languages] = await Promise.all([
    getJson(`${api}/releases?limit=1`),
    getJson(`${api}/commits?limit=1&stat=false`),
    getJson(`${api}/languages`),
  ]);
  const language = Object.entries(languages ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    canonical: info.html_url,
    stars: info.stars_count,
    archived: info.archived,
    license: null,
    latestRelease: releases?.[0] ? { version: releases[0].tag_name, date: day(releases[0].published_at) } : null,
    lastCommit: day(commits?.[0]?.commit?.committer?.date ?? commits?.[0]?.created),
    primaryLanguage: language,
  };
}

function fetchRepo(app) {
  const url = new URL(app.repo);
  const parts = url.pathname.replace(/^\/|\/$|\.git$/g, "").split("/");
  if (url.hostname === "github.com") return fromGithub(parts[0], parts[1], app);
  if (GITLAB_HOSTS.has(url.hostname)) return fromGitlab(url.hostname, parts.join("/"));
  if (GITEA_HOSTS.has(url.hostname)) return fromGitea(url.hostname, parts[0], parts[1]);
  throw new Error(`unsupported host ${url.hostname}`);
}

// --- Diff + apply -----------------------------------------------------------

/** "AGPL-3.0" (GitHub) matches a curated "AGPL-3.0-or-later"; "GPL-3.0" doesn't match "AGPL-3.0". */
function sameLicense(curated, reported) {
  const a = curated.toLowerCase();
  const b = reported.toLowerCase();
  const matches = (id) => id === b || id.startsWith(`${b}-`);
  return matches(a) || a.split(/\s+(?:and|or|with)\s+|[()]/).some((part) => matches(part.trim()));
}

const daysSince = (iso) => (Date.parse(TODAY) - Date.parse(iso)) / 86_400_000;

function apply(app, fresh) {
  const changes = [];
  const set = (key, value, label = key) => {
    const before = JSON.stringify(app[key] ?? null);
    const after = JSON.stringify(value ?? null);
    if (before !== after) {
      changes.push(`${label}: ${before} -> ${after}`);
      app[key] = value;
    }
  };

  if (fresh.stars != null && fresh.stars !== app.stars) {
    const delta = app.stars == null ? "" : ` (${fresh.stars - app.stars >= 0 ? "+" : ""}${fresh.stars - app.stars})`;
    changes.push(`stars: ${app.stars ?? "-"} -> ${fresh.stars}${delta}`);
    app.stars = fresh.stars;
  }
  set("latestRelease", fresh.latestRelease, "release");
  set("lastCommit", fresh.lastCommit, "last commit");
  set("primaryLanguage", fresh.primaryLanguage, "language");

  if (fresh.license && !sameLicense(app.license.spdx, fresh.license.spdx)) {
    if (fresh.license.loose) {
      changes.push(`LICENSE CHECK: repo reports ${fresh.license.spdx}, registry says ${app.license.spdx} (not changed; verify by hand)`);
    } else {
      changes.push(`LICENSE: ${app.license.spdx} -> ${fresh.license.spdx} (verify the LICENSE file)`);
      app.license = { spdx: fresh.license.spdx, name: fresh.license.name };
    }
  }

  if (fresh.archived && app.status !== "archived") {
    changes.push(`STATUS: ${app.status} -> archived (repo is archived)`);
    app.status = "archived";
    app.caveat ??= "The repository is archived: no more updates or fixes.";
  } else if (!fresh.archived && app.status === "archived") {
    changes.push(`STATUS CHECK: registry says archived but the repo is not (not changed; verify by hand)`);
  } else if (app.status === "active" && fresh.lastCommit && daysSince(fresh.lastCommit) > STALE_DAYS) {
    changes.push(`STATUS: active -> maintenance (no commits since ${fresh.lastCommit})`);
    app.status = "maintenance";
  }

  if (fresh.canonical && fresh.canonical.replace(/\/$/, "") !== app.repo.replace(/\/$/, "")) {
    changes.push(`REPO MOVED: ${app.repo} -> ${fresh.canonical}`);
    app.repo = fresh.canonical;
  }

  app.checkedAt = TODAY;
  return changes;
}

async function main() {
  const data = JSON.parse(readFileSync(FILE, "utf-8"));
  const apps = data.apps.filter((a) => !only.size || only.has(a.id));
  if (only.size && apps.length !== only.size) {
    const missing = [...only].filter((id) => !apps.some((a) => a.id === id));
    console.error(`Unknown ids: ${missing.join(", ")}`);
    process.exit(1);
  }

  let changed = 0;
  const failed = [];
  // A few at a time: fast, and gentle on rate limits
  for (let i = 0; i < apps.length; i += 6) {
    await Promise.all(
      apps.slice(i, i + 6).map(async (app) => {
        try {
          const changes = apply(app, await fetchRepo(app));
          if (changes.length) changed++;
          console.log(`${changes.length ? "~" : "="} ${app.id}${changes.length ? `\n    ${changes.join("\n    ")}` : ""}`);
        } catch (err) {
          failed.push(app.id);
          console.log(`! ${app.id}: ${err.message}`);
        }
      })
    );
  }

  console.log(`\n${apps.length} apps checked, ${changed} changed, ${failed.length} failed${failed.length ? ` (${failed.join(", ")})` : ""}.`);
  if (dryRun) {
    console.log("Dry run: nothing written.");
  } else {
    writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Wrote ${path.relative(process.cwd(), FILE)}`);
  }
  if (failed.length) process.exitCode = 1;
}

await main();
