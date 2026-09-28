/**
 * Shared by the prerender scripts (prerender-blog-meta.ts,
 * prerender-marketing.ts): each writes copies of dist/index.html with one
 * page's meta tags, JSON-LD and <noscript> HTML baked in, so link-preview and
 * AI crawlers that don't run JavaScript see the page. server.ts serves
 * dist/<path>.html for <path> when the file exists.
 *
 * The tags mirror src/components/seo/seo-head.tsx and src/hooks/useSEO.ts.
 * They carry data-rh="true" so react-helmet-async adopts and replaces them on
 * client-side navigation. JSON-LD scripts use the ids the client components
 * use, so the client replaces them instead of adding duplicates.
 */

import fs from "node:fs";
import path from "node:path";

export const BASE_URL = "https://opensunsama.com";
export const SITE_NAME = "Open Sunsama";
const ROOT_DIR = path.resolve(import.meta.dir, "..");
export const DIST_DIR = path.join(ROOT_DIR, "dist");

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  ogType: "website" | "article";
  ogImage: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  /** JSON-LD blocks for <head>, keyed by script id */
  jsonLd?: Record<string, object>;
  /** HTML for crawlers without JavaScript, put in <noscript> */
  noscript?: string;
}

export const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// Tags in index.html that each page replaces with its own
const REPLACED_TAGS: RegExp[] = [
  /<title>[\s\S]*?<\/title>/,
  /<link rel="canonical"[^>]*>/,
  ...[
    'name="title"',
    'name="description"',
    'property="og:type"',
    'property="og:url"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'property="og:image:width"',
    'property="og:image:height"',
    'property="og:image:alt"',
    'property="og:site_name"',
    'property="og:locale"',
    'name="twitter:card"',
    'name="twitter:url"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"',
    'name="twitter:image:alt"',
  ].map((key) => new RegExp(`<meta ${key} [^>]*>`)),
];

export function renderTags(page: PageMeta): string {
  const title = page.title.includes(SITE_NAME)
    ? page.title
    : `${page.title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${page.path}`;
  const image = page.ogImage.startsWith("http")
    ? page.ogImage
    : `${BASE_URL}${page.ogImage}`;

  const meta: [string, string, string][] = [
    ["name", "title", title],
    ["name", "description", page.description],
    ["property", "og:type", page.ogType],
    ["property", "og:url", url],
    ["property", "og:title", title],
    ["property", "og:description", page.description],
    ["property", "og:image", image],
    ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"],
    ["property", "og:image:alt", title],
    ["property", "og:site_name", SITE_NAME],
    ["property", "og:locale", "en_US"],
  ];
  if (page.ogType === "article" && page.publishedTime) {
    meta.push(["property", "article:published_time", page.publishedTime]);
  }
  if (page.ogType === "article" && page.modifiedTime) {
    meta.push(["property", "article:modified_time", page.modifiedTime]);
  }
  if (page.ogType === "article" && page.author) {
    meta.push(["property", "article:author", page.author]);
  }
  meta.push(
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:url", url],
    ["name", "twitter:title", title],
    ["name", "twitter:description", page.description],
    ["name", "twitter:image", image],
    ["name", "twitter:image:alt", title]
  );

  return [
    `<title>${escapeAttr(title)}</title>`,
    `<link data-rh="true" rel="canonical" href="${escapeAttr(url)}" />`,
    ...meta.map(
      ([attr, key, value]) =>
        `<meta data-rh="true" ${attr}="${key}" content="${escapeAttr(value)}" />`
    ),
  ].join("\n    ");
}

export function renderPage(template: string, page: PageMeta): string {
  let html = template;
  for (const tag of REPLACED_TAGS) {
    if (!tag.test(html)) {
      throw new Error(`index.html no longer contains ${tag}; update this script`);
    }
    html = html.replace(tag, "");
  }
  // Drop the blank lines left behind by the removed tags
  html = html.replace(/\n[ \t]*(?=\n)/g, "");
  const charset = '<meta charset="UTF-8" />';
  const root = '<div id="root"></div>';
  if (!html.includes(charset) || !html.includes(root) || !html.includes("</head>")) {
    throw new Error("index.html no longer has the charset tag, </head> or #root");
  }
  // Replacer functions, so a "$" in post text is never read as a pattern
  html = html.replace(charset, () => `${charset}\n    ${renderTags(page)}`);

  const scripts = Object.entries(page.jsonLd ?? {}).map(
    ([id, data]) =>
      // "<" escaped so no string in the data can close the script tag
      `<script type="application/ld+json" id="${id}">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`
  );
  if (scripts.length) {
    html = html.replace("</head>", () => `  ${scripts.join("\n    ")}\n  </head>`);
  }
  if (page.noscript) {
    html = html.replace(root, () => `${root}\n    <noscript>${page.noscript}</noscript>`);
  }
  return html;
}

/** Writes dist/<page.path>.html, creating folders for nested paths like /features/time-blocking. */
export function writePage(template: string, page: PageMeta) {
  const out = path.join(DIST_DIR, `${page.path}.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, renderPage(template, page), "utf-8");
  return out;
}

export function readTemplate() {
  return fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");
}
