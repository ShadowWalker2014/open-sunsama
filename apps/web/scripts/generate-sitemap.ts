#!/usr/bin/env bun
/**
 * Sitemap generation script
 * Dynamically includes all docs, blog posts, and static pages
 * Run after build: bun run scripts/generate-sitemap.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readDocs } from "./docs-content";
import { lastUpdated, readBlogPosts } from "./blog-content";
import { loadMarketingPages } from "./prerender-marketing";

const SITE_URL = "https://opensunsama.com";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

// Static pages with their priorities
const STATIC_PAGES: SitemapEntry[] = [
  // Core Pages (priority 1.0)
  { loc: "/", lastmod: "", changefreq: "weekly", priority: 1.0 },
  { loc: "/download", lastmod: "", changefreq: "weekly", priority: 1.0 },
  { loc: "/blog", lastmod: "", changefreq: "weekly", priority: 1.0 },
  { loc: "/docs", lastmod: "", changefreq: "weekly", priority: 0.9 },

  // Landing Pages (priority 0.9)
  {
    loc: "/alternative/sunsama",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    loc: "/alternative/motion",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    loc: "/alternative/reclaim",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    loc: "/alternative/akiflow",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    loc: "/alternative/todoist",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  { loc: "/for/adhd", lastmod: "", changefreq: "weekly", priority: 0.9 },
  { loc: "/for/developers", lastmod: "", changefreq: "weekly", priority: 0.9 },
  {
    loc: "/for/remote-workers",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    loc: "/open-source-task-manager",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.9,
  },

  // Feature Pages (priority 0.8)
  { loc: "/features/kanban", lastmod: "", changefreq: "weekly", priority: 0.8 },
  {
    loc: "/features/time-blocking",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    loc: "/features/focus-mode",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    loc: "/features/ai-integration",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    loc: "/features/command-palette",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    loc: "/features/calendar-sync",
    lastmod: "",
    changefreq: "weekly",
    priority: 0.8,
  },

  // Legal Pages (priority 0.3)
  { loc: "/privacy", lastmod: "", changefreq: "yearly", priority: 0.3 },
  { loc: "/terms", lastmod: "", changefreq: "yearly", priority: 0.3 },
];

/**
 * Generate sitemap XML content
 */
function generateSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    return `  <url>
    <loc>${SITE_URL}${entry.loc}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

/**
 * Main function to generate sitemap
 */
async function main() {
  const distDir = path.join(ROOT_DIR, "dist");

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log("Creating dist directory...");
    fs.mkdirSync(distDir, { recursive: true });
  }

  const entries: SitemapEntry[] = STATIC_PAGES.map((entry) => ({ ...entry }));

  // Marketing pages with a content module (src/content/marketing): add any
  // that are missing and date them by their last content change
  const marketingPages = await loadMarketingPages();
  for (const { page } of marketingPages) {
    const existing = entries.find((entry) => entry.loc === page.path);
    if (existing) existing.lastmod = page.updated;
    else entries.push({ loc: page.path, lastmod: page.updated, changefreq: "weekly", priority: 0.8 });
  }

  // Add docs pages (priority 0.6)
  const docPages = readDocs();
  for (const { slug, meta } of docPages) {
    entries.push({
      loc: `/docs/${slug}`,
      lastmod: meta.updated ?? "",
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  // Add blog posts (priority 0.7). lastmod is the frontmatter `updated ?? date`.
  const blogPosts = readBlogPosts();
  const toDay = (iso: string) => new Date(iso).toISOString().split("T")[0] ?? "";

  for (const { slug, frontmatter } of blogPosts) {
    entries.push({
      loc: `/blog/${slug}`,
      lastmod: toDay(lastUpdated(frontmatter)),
      changefreq: "monthly",
      priority: 0.7,
    });
  }

  // The blog index changes whenever a post does
  const blogIndex = entries.find((entry) => entry.loc === "/blog");
  if (blogIndex && blogPosts.length) {
    blogIndex.lastmod = blogPosts
      .map((post) => toDay(lastUpdated(post.frontmatter)))
      .sort()
      .at(-1) ?? "";
  }

  // Sort entries by priority (descending) then by loc (alphabetically)
  entries.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.loc.localeCompare(b.loc);
  });

  // Generate and write sitemap
  const sitemapContent = generateSitemapXml(entries);
  const sitemapPath = path.join(distDir, "sitemap.xml");

  fs.writeFileSync(sitemapPath, sitemapContent, "utf-8");

  console.log(`Generated sitemap.xml with ${entries.length} URLs`);
  console.log(`  - Static pages: ${STATIC_PAGES.length}`);
  console.log(`  - Marketing pages with content modules: ${marketingPages.length}`);
  console.log(`  - Docs: ${docPages.length}`);
  console.log(`  - Blog posts: ${blogPosts.length}`);
  console.log(`\nSitemap written to: ${sitemapPath}`);
}

await main();
