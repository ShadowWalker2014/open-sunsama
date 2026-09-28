#!/usr/bin/env bun
/**
 * Prerenders every marketing page that has a content module in
 * src/content/marketing (any .ts file there whose default export is a
 * MarketingPageContent). For each it writes dist/<path>.html with:
 *
 * - title, description, canonical, Open Graph and Twitter tags;
 * - JSON-LD: BreadcrumbList, FAQPage, SoftwareApplication and VideoObject,
 *   with the same ids the page's components use at runtime;
 * - the page's text as semantic HTML in <noscript>, for AI crawlers
 *   (GPTBot, ClaudeBot, PerplexityBot) that don't run JavaScript.
 *
 * It also validates each page (src/content/marketing/validate.ts): errors fail
 * the build, warnings print.
 *
 * Run after build: bun run scripts/prerender-marketing.ts
 */

import fs from "node:fs";
import path from "node:path";
import { BLOG_MEDIA } from "../src/lib/blog-media";
import { marketingJsonLd } from "../src/content/marketing/json-ld";
import {
  markLabel,
  parseInline,
  plainText,
  type ComparisonCell,
  type MarketingPageContent,
  type MarketingSection,
  type MediaRef,
} from "../src/content/marketing/types";
import { validateMarketingPage } from "../src/content/marketing/validate";
import { escapeAttr as esc, readTemplate, SITE_NAME, writePage } from "./prerender-html";

/** Mirrors externalRel in src/components/marketing/rich-text.tsx: code hosts followed, other outbound links nofollow. */
function relAttr(href: string): string {
  if (!/^https?:/.test(href)) return "";
  const codeHost = /^https?:\/\/(www\.)?(github\.com|gitlab\.com|codeberg\.org)\//.test(href);
  return codeHost ? ' rel="noopener"' : ' rel="nofollow noopener"';
}


const CONTENT_DIR = path.resolve(import.meta.dir, "../src/content/marketing");

function listModules(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listModules(full);
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [full] : [];
  });
}

function isPage(value: unknown): value is MarketingPageContent {
  const page = value as Partial<MarketingPageContent> | undefined;
  return Boolean(page && typeof page.path === "string" && page.hero && Array.isArray(page.sections));
}

/** Every marketing page with a content module, sorted by path. Also used by generate-sitemap.ts. */
export async function loadMarketingPages(): Promise<Array<{ file: string; page: MarketingPageContent }>> {
  const pages: Array<{ file: string; page: MarketingPageContent }> = [];
  for (const file of listModules(CONTENT_DIR)) {
    const mod = (await import(file)) as { default?: unknown };
    if (isPage(mod.default)) pages.push({ file, page: mod.default });
  }
  return pages.sort((a, b) => a.page.path.localeCompare(b.page.path));
}

// ---------------------------------------------------------------------------
// Text -> HTML (mirrors components/marketing/rich-text.tsx)
// ---------------------------------------------------------------------------

function inline(text: string): string {
  return parseInline(text)
    .map((token) => {
      if (token.type === "link") return `<a href="${esc(token.href)}"${relAttr(token.href)}>${esc(token.label)}</a>`;
      if (token.type === "strong") return `<strong>${esc(token.value)}</strong>`;
      return esc(token.value);
    })
    .join("");
}

const paragraphs = (items: string[] = []) => items.map((p) => `<p>${inline(p)}</p>`).join("");

function figure(media: MediaRef): string {
  if ("video" in media) {
    const video = BLOG_MEDIA.videos[media.video];
    return video
      ? `<figure><img src="${esc(video.poster)}" alt="${esc(video.title)}"><figcaption>${esc(video.title)}</figcaption></figure>`
      : "";
  }
  const src = "clip" in media ? BLOG_MEDIA.clips[media.clip]?.light.poster : BLOG_MEDIA.shots[media.shot]?.light;
  if (!src) return "";
  return `<figure><img src="${esc(src)}" alt="${esc(media.alt)}"><figcaption>${esc(media.caption ?? media.alt)}</figcaption></figure>`;
}

function heading(section: { heading: string; eyebrow?: string; lead?: string }) {
  return [
    section.eyebrow ? `<p>${esc(section.eyebrow)}</p>` : "",
    `<h2>${esc(section.heading)}</h2>`,
    section.lead ? `<p>${inline(section.lead)}</p>` : "",
  ].join("");
}

function cell(value: ComparisonCell): string {
  if (typeof value === "string") return markLabel[value];
  return [value.mark ? markLabel[value.mark] : "", esc(value.text)].filter(Boolean).join(": ");
}

function renderSection(section: MarketingSection): string {
  switch (section.kind) {
    case "answer":
      return `<section id="${section.id}">${heading(section)}${paragraphs(section.body)}${
        section.points?.length
          ? `<h3>${esc(section.pointsTitle ?? "Key points")}</h3><ul>${section.points.map((p) => `<li>${inline(p)}</li>`).join("")}</ul>`
          : ""
      }</section>`;
    case "story":
      return `<section id="${section.id}">${heading(section)}<ol>${section.steps
        .map(
          (step) =>
            `<li><h3>${esc(step.title)}</h3><p>${inline(step.body)}</p>${figure({ clip: step.clip, alt: step.title })}${
              step.link ? `<p><a href="${esc(step.link.href)}"${relAttr(step.link.href)}>${esc(step.link.label)}</a></p>` : ""
            }</li>`
        )
        .join("")}</ol></section>`;
    case "media-rows":
      return `<section id="${section.id}">${heading(section)}${section.rows
        .map(
          (row) =>
            `<h3>${esc(row.title)}</h3>${paragraphs(row.body)}${
              row.bullets ? `<ul>${row.bullets.map((b) => `<li>${inline(b)}</li>`).join("")}</ul>` : ""
            }${figure(row.media)}${row.link ? `<p><a href="${esc(row.link.href)}"${relAttr(row.link.href)}>${esc(row.link.label)}</a></p>` : ""}`
        )
        .join("")}</section>`;
    case "benefits":
      return `<section id="${section.id}">${heading(section)}<ul>${section.items
        .map(
          (item) =>
            `<li><strong>${item.href ? `<a href="${esc(item.href)}"${relAttr(item.href)}>${esc(item.title)}</a>` : esc(item.title)}</strong>: ${inline(item.body)}</li>`
        )
        .join("")}</ul></section>`;
    case "comparison":
      return `<section id="${section.id}">${heading(section)}<table><caption>${esc(section.heading)}</caption><thead><tr><th scope="col">Feature</th>${section.columns
        .map((c) => `<th scope="col">${esc(c)}</th>`)
        .join("")}</tr></thead><tbody>${section.rows
        .map((row) => `<tr><th scope="row">${esc(row.feature)}</th>${row.cells.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table><p>${inline(section.sources)}</p></section>`;
    case "steps":
      return `<section id="${section.id}">${heading(section)}<ol>${section.steps
        .map((step) => `<li><h3>${esc(step.title)}</h3><p>${inline(step.body)}</p></li>`)
        .join("")}</ol></section>`;
    case "stats":
      return `<section id="${section.id}"><ul>${section.items
        .map((item) =>
          "live" in item
            ? `<li><a href="https://github.com/ShadowWalker2014/open-sunsama">Source code on GitHub</a></li>`
            : `<li>${esc(item.value)} ${esc(item.label)}</li>`
        )
        .join("")}</ul></section>`;
    case "agent":
      return `<section id="${section.id}">${heading(section)}${paragraphs(section.body)}<p>MCP server URL: <code>https://api.opensunsama.com/mcp</code></p><h3>Prompts to try</h3><ul>${section.prompts
        .map((p) => `<li>${esc(p)}</li>`)
        .join("")}</ul>${
        section.tools?.length ? `<p>Tools it calls: ${section.tools.map((t) => `<code>${esc(t)}</code>`).join(", ")}</p>` : ""
      }${section.clip ? figure({ clip: section.clip, alt: section.clipCaption ?? section.heading }) : ""}${
        section.links?.length
          ? `<ul>${section.links.map((l) => `<li><a href="${esc(l.href)}"${relAttr(l.href)}>${esc(l.label)}</a></li>`).join("")}</ul>`
          : ""
      }</section>`;
    case "custom":
      return `<section id="${section.id}">${heading(section)}${paragraphs(section.body)}</section>`;
  }
}

const SITE_NAV: Array<[string, string]> = [
  ["Home", "/"],
  ["Time blocking", "/features/time-blocking"],
  ["Kanban board", "/features/kanban"],
  ["Focus mode", "/features/focus-mode"],
  ["Calendar sync", "/features/calendar-sync"],
  ["AI and MCP", "/features/ai-integration"],
  ["Docs", "/docs"],
  ["Blog", "/blog"],
  ["Download", "/download"],
];

export function renderNoscript(page: MarketingPageContent): string {
  const crumbs = [{ label: "Home", href: "/" }, ...page.breadcrumbs]
    .map((c) => (c.href ? `<a href="${esc(c.href)}"${relAttr(c.href)}>${esc(c.label)}</a>` : esc(c.label)))
    .join(" / ");
  return [
    `<nav aria-label="Site">${SITE_NAV.map(([label, href]) => `<a href="${href}">${label}</a>`).join(" · ")}</nav>`,
    "<main><article>",
    `<nav aria-label="Breadcrumb">${crumbs}</nav>`,
    `<header><p>${esc(page.hero.eyebrow)}</p><h1>${esc(page.hero.title)}</h1><p>${inline(page.hero.answer)}</p>`,
    `<p><a href="/register">Get started</a> · <a href="/download">Download for desktop</a></p>${figure(page.hero.media)}</header>`,
    ...page.sections.map(renderSection),
    `<section id="faq"><h2>${esc(page.faqs.heading)}</h2>${page.faqs.items
      .map((f) => `<h3>${esc(f.question)}</h3><p>${inline(f.answer)}${f.link ? ` <a href="${esc(f.link.href)}"${relAttr(f.link.href)}>${esc(f.link.label)}</a>` : ""}</p>`)
      .join("")}</section>`,
    `<section id="related"><h2>${esc(page.related.heading)}</h2><ul>${page.related.links
      .map((l) => `<li><a href="${esc(l.href)}"${relAttr(l.href)}>${esc(l.title)}</a>: ${esc(l.description)}</li>`)
      .join("")}</ul></section>`,
    `<section><h2>${esc(page.cta.heading)}</h2><p>${esc(page.cta.body)}</p><p><a href="/register">Get started</a></p></section>`,
    "</article></main>",
  ].join("\n");
}

async function main() {
  const pages = await loadMarketingPages();
  const template = readTemplate();
  let failed = false;

  for (const { file, page } of pages) {
    const { errors, warnings } = validateMarketingPage(page);
    const name = path.relative(CONTENT_DIR, file);
    for (const warning of warnings) console.warn(`  warn  ${name}: ${warning}`);
    for (const error of errors) console.error(`  ERROR ${name}: ${error}`);
    if (errors.length) {
      failed = true;
      continue;
    }
    writePage(template, {
      path: page.path,
      // Same title useSEO sets in the browser
      title: `${page.seo.title} | ${SITE_NAME}`,
      description: plainText(page.seo.description),
      ogType: "website",
      ogImage: page.seo.ogImage ?? "/og-image.png",
      jsonLd: marketingJsonLd(page),
      noscript: renderNoscript(page),
    });
  }

  if (failed) {
    console.error("Marketing pages failed validation; fix the content modules above.");
    process.exit(1);
  }
  console.log(`Pre-rendered ${pages.length} marketing page(s): ${pages.map((p) => p.page.path).join(", ")}`);
}

if (import.meta.main) await main();
