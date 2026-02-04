#!/usr/bin/env bun
/**
 * Sitemap generation script
 * Dynamically includes all docs, blog posts, and static pages
 * Run after build: bun run scripts/generate-sitemap.ts
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITE_URL = "https://opensunsama.com";
const __dirname = path.dirname(new URL(import.meta.url).pathname);
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
    loc: "/free-time-blocking-app",
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
 * Get all MDX files from a directory recursively
 */
function getMdxFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getMdxFiles(fullPath));
    } else if (item.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract slug from file path
 */
function extractSlug(filePath: string, contentType: "docs" | "blog"): string {
  const contentDir = contentType === "docs" ? "content/docs" : "content/blog";
  const relativePath = filePath.split(contentDir)[1] || "";

  let slug = relativePath.replace(/^\//, "").replace(/\.mdx$/, "");

  if (slug.endsWith("/index")) {
    slug = slug.replace(/\/index$/, "");
  }

  return slug;
}

/**
 * Get file modification date from frontmatter or file system
 */
function getFileModDate(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    if (data.date) {
      const date = new Date(data.date);
      return date.toISOString().split("T")[0] ?? "";
    }

    if (data.lastModified) {
      const date = new Date(data.lastModified);
      return date.toISOString().split("T")[0] ?? "";
    }
  } catch {
    // Fallback to file system date
  }

  const stats = fs.statSync(filePath);
  return stats.mtime.toISOString().split("T")[0] ?? "";
}

/**
 * Generate sitemap XML content
 */
function generateSitemapXml(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split("T")[0];

  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod || today;
    return `  <url>
    <loc>${SITE_URL}${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
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
function main() {
  const srcDir = path.join(ROOT_DIR, "src");
  const distDir = path.join(ROOT_DIR, "dist");

  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log("Creating dist directory...");
    fs.mkdirSync(distDir, { recursive: true });
  }

  const entries: SitemapEntry[] = [...STATIC_PAGES];

  // Add docs pages (priority 0.6)
  const docsDir = path.join(srcDir, "content/docs");
  const docFiles = getMdxFiles(docsDir);

  for (const filePath of docFiles) {
    const slug = extractSlug(filePath, "docs");
    const lastmod = getFileModDate(filePath);

    entries.push({
      loc: `/docs/${slug}`,
      lastmod,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  // Add blog posts (priority 0.7)
  const blogDir = path.join(srcDir, "content/blog");
  const blogFiles = getMdxFiles(blogDir);

  for (const filePath of blogFiles) {
    const slug = extractSlug(filePath, "blog");
    const lastmod = getFileModDate(filePath);

    entries.push({
      loc: `/blog/${slug}`,
      lastmod,
      changefreq: "monthly",
      priority: 0.7,
    });
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
  console.log(`  - Docs: ${docFiles.length}`);
  console.log(`  - Blog posts: ${blogFiles.length}`);
  console.log(`\nSitemap written to: ${sitemapPath}`);
}

main();
