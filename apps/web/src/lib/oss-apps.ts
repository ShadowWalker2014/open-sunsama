/**
 * The open source app registry behind <OssApp> and <OssTable> in blog posts.
 *
 * src/content/oss-apps.json holds one entry per app. People curate the
 * descriptive fields (tagline, platforms, API, MCP, screenshot source);
 * scripts/refresh-oss-apps.mjs refreshes stars, license, latest release,
 * last commit, language and archived status from each repo's API and stamps
 * checkedAt. Only relative imports here: the build scripts import this file.
 */

import data from "../content/oss-apps.json";
import { BLOG_MEDIA } from "./blog-media";

export type OssCategory =
  | "todo"
  | "planner"
  | "time-blocking"
  | "calendar"
  | "calendar-server"
  | "scheduling"
  | "kanban"
  | "project-management"
  | "focus"
  | "pomodoro"
  | "time-tracking"
  | "notes";

export type OssPlatform = "web" | "macos" | "windows" | "linux" | "ios" | "android" | "server";

/** active: recent commits and releases. maintenance: fixes only. unmaintained: the README says so. archived: the repo is read-only. */
export type OssStatus = "active" | "maintenance" | "unmaintained" | "archived";

export interface OssScreenshot {
  /** Public path under /oss/, or resolved from `blogShot` */
  light: string;
  dark?: string;
  width: number;
  height: number;
  /** Where the image came from, shown under it */
  source: string;
  sourceUrl?: string;
  /** Use a shot from blog-media.json instead of /oss/ (Open Sunsama's own screens) */
  blogShot?: string;
}

export interface OssApp {
  id: string;
  name: string;
  /** One plain sentence */
  tagline: string;
  categories: OssCategory[];
  website: string;
  repo: string;
  /** Monorepos: which tags are this app's releases (see scripts/refresh-oss-apps.mjs) */
  releaseTag?: { prefix: string; pattern: string };
  docs: string | null;
  /** SPDX id (or LicenseRef-*) and display name, from the repo's license file */
  license: { spdx: string; name: string };
  stars: number | null;
  latestRelease: { version: string; date: string } | null;
  /** ISO date of the newest commit on the default branch */
  lastCommit: string | null;
  primaryLanguage: string | null;
  platforms: OssPlatform[];
  /** How to self-host, or null when there is no server to host */
  selfHost: string | null;
  mobile: { available: boolean; how: string };
  sync: string;
  api: string[];
  mcp: { kind: "official" | "community" | "none"; url?: string; note?: string };
  status: OssStatus;
  /** One sentence the reader must know (e.g. only the clients are open source) */
  caveat?: string | null;
  screenshot: OssScreenshot;
  /** ISO date the dynamic facts were last refreshed */
  checkedAt: string;
  /** Research notes and sources, not rendered */
  notes?: string;
}

const OPEN_SUNSAMA = "open-sunsama";

function resolveScreenshot(shot: OssScreenshot): OssScreenshot {
  if (!shot.blogShot) return shot;
  const media = BLOG_MEDIA.shots[shot.blogShot];
  if (!media) return shot;
  return { ...shot, light: media.light, dark: media.dark, width: media.width, height: media.height };
}

export const OSS_APPS: Record<string, OssApp> = Object.fromEntries(
  (data.apps as unknown as OssApp[]).map((app) => [
    app.id,
    { ...app, screenshot: resolveScreenshot(app.screenshot) },
  ])
);

export function getOssApp(id: string): OssApp | undefined {
  return OSS_APPS[id];
}

/** Table order: Open Sunsama first when included, then as written. Unknown ids are dropped. */
export function tableOrder(ids: string[]): OssApp[] {
  const apps = ids.map(getOssApp).filter((a): a is OssApp => Boolean(a));
  return [
    ...apps.filter((a) => a.id === OPEN_SUNSAMA),
    ...apps.filter((a) => a.id !== OPEN_SUNSAMA),
  ];
}

// --- Display helpers (shared by the components and the crawler HTML) --------

export const PLATFORM_LABELS: Record<OssPlatform, string> = {
  web: "Web",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  ios: "iOS",
  android: "Android",
  server: "Server",
};

export const STATUS_LABELS: Record<OssStatus, string> = {
  active: "Active",
  maintenance: "Maintenance mode",
  unmaintained: "Unmaintained",
  archived: "Archived",
};

export const CATEGORY_LABELS: Record<OssCategory, string> = {
  todo: "To-do list",
  planner: "Daily planner",
  "time-blocking": "Time blocking",
  calendar: "Calendar",
  "calendar-server": "Calendar server",
  scheduling: "Scheduling",
  kanban: "Kanban board",
  "project-management": "Project management",
  focus: "Focus",
  pomodoro: "Pomodoro timer",
  "time-tracking": "Time tracking",
  notes: "Notes",
};

/** 22239 -> "22.2k", 950 -> "950" */
export function formatStars(stars: number | null): string {
  if (stars == null) return "n/a";
  if (stars < 1000) return String(stars);
  const k = stars / 1000;
  return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
}

/** "2026-09-24" -> "Sep 2026" */
export function monthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const PLATFORM_ORDER = Object.keys(PLATFORM_LABELS) as OssPlatform[];

/** "Web, macOS, Windows, Linux, iOS, Android, Server", always in that order */
export const platformList = (app: OssApp) =>
  PLATFORM_ORDER.filter((p) => app.platforms.includes(p))
    .map((p) => PLATFORM_LABELS[p])
    .join(", ");

export function releaseLabel(app: OssApp): string {
  if (!app.latestRelease) return "No tagged releases";
  const version = app.latestRelease.version;
  return `${version} · ${monthYear(app.latestRelease.date)}`;
}

export function mcpLabel(app: OssApp): string {
  if (app.mcp.kind === "official") return "Official";
  if (app.mcp.kind === "community") return "Community";
  return "None found";
}

/** SPDX ids link to spdx.org; custom licenses link to the repo. */
export function licenseUrl(app: OssApp): string {
  const spdx = app.license.spdx;
  if (!spdx.startsWith("LicenseRef-") && /^[A-Za-z0-9.+-]+$/.test(spdx)) {
    return `https://spdx.org/licenses/${spdx}.html`;
  }
  return app.repo;
}

/** Short license label for badges: the SPDX id, or the custom license's name. */
export function licenseShort(app: OssApp): string {
  const spdx = app.license.spdx;
  return spdx.startsWith("LicenseRef-") ? app.license.name : spdx;
}

/**
 * Link attributes for an outbound URL. Source code links are followed (they
 * credit the project); websites, docs and other links are nofollow. Our own
 * pages stay plain internal links.
 */
export function outboundLink(url: string, follow = false) {
  const own = url.match(/^https:\/\/opensunsama\.com(\/.*)?$/);
  if (own) return { href: own[1] || "/" };
  return { href: url, target: "_blank", rel: follow ? "noopener" : "nofollow noopener" };
}

export const isInactive = (app: OssApp) => app.status === "archived" || app.status === "unmaintained";

/**
 * The apps a post's ItemList JSON-LD lists: its <OssApp> cards by rank (ties
 * keep page order), or, in a post with only tables, the first <OssTable>'s order.
 */
export function itemListApps(cards: { id: string; rank?: number }[], tables: string[][]): OssApp[] {
  if (cards.length) {
    const seen = new Set<string>();
    return cards
      .map((card, order) => ({ ...card, order }))
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.order - b.order)
      .filter((card) => !seen.has(card.id) && seen.add(card.id))
      .map((card) => getOssApp(card.id))
      .filter((a): a is OssApp => Boolean(a));
  }
  return tables[0] ? tableOrder(tables[0]) : [];
}
