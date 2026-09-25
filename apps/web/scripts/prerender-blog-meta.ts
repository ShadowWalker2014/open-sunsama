#!/usr/bin/env bun
/**
 * Writes one HTML file per blog post (dist/blog/<slug>.html) plus the blog
 * index (dist/blog.html), each a copy of dist/index.html with that page baked in:
 *
 * - title, description, canonical, Open Graph and Twitter tags;
 * - JSON-LD: BlogPosting, plus FAQPage and VideoObject when the post has them;
 * - the article itself as semantic HTML in <noscript>.
 *
 * Link-preview crawlers (Slack, LinkedIn, X, iMessage) and AI crawlers
 * (GPTBot, ClaudeBot, PerplexityBot) don't run JavaScript, so without this
 * they see an empty page. The <noscript> text is the same text readers see.
 * server.ts serves these files for their paths and falls back to index.html
 * for everything else.
 *
 * The tags mirror src/components/seo/seo-head.tsx. They carry data-rh="true"
 * so react-helmet-async adopts and replaces them on client-side navigation.
 * The JSON-LD scripts use the ids the <*Schema> components use, so the client
 * replaces them instead of adding duplicates.
 *
 * Run after build: bun run scripts/prerender-blog-meta.ts
 */

import fs from "node:fs";
import path from "node:path";
import { BLOG_MEDIA } from "../src/lib/blog-media";
import {
  blogPostingJsonLd,
  faqPageJsonLd,
  videoObjectJsonLd,
} from "../src/lib/structured-data";
import {
  type BlogSource,
  headingId,
  lastUpdated,
  readBlogPosts,
  renderBody,
} from "./blog-content";

const BASE_URL = "https://opensunsama.com";
const SITE_NAME = "Open Sunsama";
const ROOT_DIR = path.resolve(import.meta.dir, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

interface PageMeta {
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

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const formatDate = (iso: string) =>
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

/** Mirrors BlogArticleMeta + the article body + BlogFaqs in blog-layout.tsx */
async function renderArticle({ slug, source, frontmatter: post }: BlogSource) {
  const { html: body, videosUsed } = await renderBody(source);
  const updated = post.updated && post.updated !== post.date ? post.updated : null;

  const byline = [
    escapeAttr(post.author),
    `<time datetime="${escapeAttr(post.date)}">${formatDate(post.date)}</time>`,
    updated && `Updated <time datetime="${escapeAttr(updated)}">${formatDate(updated)}</time>`,
    post.readingTime && `${post.readingTime} min read`,
  ].filter(Boolean);

  const faqs = post.faqs?.length
    ? [
        '<section aria-labelledby="faq">',
        '<h2 id="faq">Frequently asked questions</h2>',
        ...post.faqs.map(
          (faq) =>
            `<h3 id="${headingId(faq.question)}">${escapeAttr(faq.question)}</h3><p>${escapeAttr(faq.answer)}</p>`
        ),
        "</section>",
      ].join("")
    : "";

  const noscript = [
    "<article>",
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a></nav>`,
    `<h1>${escapeAttr(post.title)}</h1>`,
    `<p>${escapeAttr(post.description)}</p>`,
    `<p>${byline.join(" · ")}</p>`,
    post.image ? `<img src="${escapeAttr(post.image)}" alt="${escapeAttr(post.title)}">` : "",
    body,
    faqs,
    "</article>",
  ].join("\n");

  const jsonLd: Record<string, object> = {
    "article-schema": blogPostingJsonLd({
      title: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: lastUpdated(post),
      author: post.author,
      image: post.image,
      slug,
    }),
  };
  if (post.faqs?.length) jsonLd["faq-schema"] = faqPageJsonLd(post.faqs);
  for (const id of videosUsed) {
    const video = BLOG_MEDIA.videos[id];
    if (video) jsonLd[`video-schema-${id}`] = videoObjectJsonLd(video);
  }

  return { noscript, jsonLd };
}

/** A plain list of every post, so crawlers landing on /blog can find them all */
function renderIndex(posts: BlogSource[]) {
  const items = posts.map(
    ({ slug, frontmatter: post }) =>
      `<li><a href="/blog/${slug}">${escapeAttr(post.title)}</a>: ${escapeAttr(post.description)}</li>`
  );
  return `<main><h1>Open Sunsama Blog</h1><ul>\n${items.join("\n")}\n</ul></main>`;
}

async function main() {
  const template = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf-8");
  const posts = readBlogPosts().sort((a, b) =>
    lastUpdated(b.frontmatter).localeCompare(lastUpdated(a.frontmatter))
  );

  // Mirrors the SEOHead props in src/routes/blog.tsx
  const pages: PageMeta[] = [
    {
      path: "/blog",
      title: "Blog | Open Sunsama - Productivity Tips & Time Management",
      description:
        "Tips on productivity, time management, and building better daily habits. Learn how to plan your day effectively with time blocking and focus techniques.",
      ogType: "website",
      ogImage: "/og-image.png",
      noscript: renderIndex(posts),
    },
  ];

  // Mirrors the SEOHead props in src/components/blog/blog-layout.tsx
  for (const source of posts) {
    const post = source.frontmatter;
    pages.push({
      path: `/blog/${source.slug}`,
      title: `${post.title} | Open Sunsama Blog`,
      description: post.description,
      ogType: "article",
      ogImage: post.image?.replace(/\.webp$/, "-og.jpg") || "/og-image.png",
      publishedTime: post.date,
      modifiedTime: lastUpdated(post),
      author: post.author,
      ...(await renderArticle(source)),
    });
  }

  for (const page of pages) {
    const out = path.join(DIST_DIR, `${page.path}.html`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, renderPage(template, page), "utf-8");
  }

  console.log(`Pre-rendered ${pages.length} blog pages (meta tags, JSON-LD, article HTML)`);
}

await main();
