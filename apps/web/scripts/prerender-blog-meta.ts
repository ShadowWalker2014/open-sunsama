#!/usr/bin/env bun
/**
 * Writes one HTML file per blog post (dist/blog/<slug>.html) plus the blog
 * index (dist/blog.html), each a copy of dist/index.html with that page's
 * title, description, canonical, Open Graph and Twitter tags baked in.
 *
 * Link-preview crawlers (Slack, LinkedIn, X, iMessage) don't run JavaScript,
 * so the tags SEOHead sets at runtime never reach them. server.ts serves
 * these files for their paths and falls back to index.html for everything else.
 *
 * The tags mirror src/components/seo/seo-head.tsx. They carry data-rh="true"
 * so react-helmet-async adopts and replaces them on client-side navigation.
 *
 * Run after build: bun run scripts/prerender-blog-meta.ts
 */

import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://opensunsama.com";
const SITE_NAME = "Open Sunsama";
const ROOT_DIR = path.resolve(import.meta.dir, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const BLOG_DIR = path.join(ROOT_DIR, "src/content/blog");

interface PageMeta {
  path: string;
  title: string;
  description: string;
  ogType: "website" | "article";
  ogImage: string;
  publishedTime?: string;
  author?: string;
}

interface Frontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
}

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Frontmatter is a JS object literal: `export const frontmatter = {...};` */
function readFrontmatter(file: string): Frontmatter {
  const source = fs.readFileSync(file, "utf-8");
  const match = source.match(/export const frontmatter = (\{[\s\S]*?\n\});/);
  if (!match?.[1]) throw new Error(`No frontmatter export in ${file}`);
  const data = new Function(`return (${match[1]});`)() as Frontmatter;
  if (!data.title || !data.description) {
    throw new Error(`Frontmatter in ${file} is missing title or description`);
  }
  return data;
}

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

function renderTags(page: PageMeta): string {
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

function renderPage(template: string, page: PageMeta): string {
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
  if (!html.includes(charset)) {
    throw new Error("index.html no longer contains the charset meta tag");
  }
  return html.replace(charset, `${charset}\n    ${renderTags(page)}`);
}

function main() {
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");

  // Mirrors the SEOHead props in src/routes/blog.tsx
  const pages: PageMeta[] = [
    {
      path: "/blog",
      title: "Blog | Open Sunsama - Productivity Tips & Time Management",
      description:
        "Tips on productivity, time management, and building better daily habits. Learn how to plan your day effectively with time blocking and focus techniques.",
      ogType: "website",
      ogImage: "/og-image.png",
    },
  ];

  // Mirrors the SEOHead props in src/components/blog/blog-layout.tsx
  for (const slug of fs.readdirSync(BLOG_DIR)) {
    const file = path.join(BLOG_DIR, slug, "index.mdx");
    if (!fs.existsSync(file)) continue;
    const post = readFrontmatter(file);
    pages.push({
      path: `/blog/${slug}`,
      title: `${post.title} | Open Sunsama Blog`,
      description: post.description,
      ogType: "article",
      ogImage: post.image?.replace(/\.webp$/, "-og.jpg") || "/og-image.png",
      publishedTime: post.date,
      author: post.author,
    });
  }

  for (const page of pages) {
    const out = path.join(DIST_DIR, `${page.path}.html`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, renderPage(template, page), "utf-8");
  }

  console.log(`Pre-rendered meta tags for ${pages.length} blog pages`);
}

main();
