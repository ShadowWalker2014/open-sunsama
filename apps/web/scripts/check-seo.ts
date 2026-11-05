import fs from "node:fs";
import path from "node:path";
import { DIST_DIR } from "./prerender-html";

const sitemap = fs.readFileSync(path.join(DIST_DIR, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]!);
const errors: string[] = [];
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const file = path.join(DIST_DIR, pathname === "/" ? "index.html" : `${pathname}.html`);
  if (!fs.existsSync(file)) {
    errors.push(`${pathname}: missing prerendered document`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const titles = [...html.matchAll(/<title\b[^>]*>(.*?)<\/title>/g)];
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/g)];
  if (titles.length !== 1 || !titles[0]?.[1]) errors.push(`${pathname}: expected one title`);
  if (canonicals.length !== 1 || canonicals[0]?.[1] !== url) errors.push(`${pathname}: incorrect canonical`);
  if ((html.match(/<h1\b/g) ?? []).length !== 1) errors.push(`${pathname}: expected one H1`);
  if (!/<noscript>[\s\S]{200,}<\/noscript>/.test(html)) errors.push(`${pathname}: no readable crawler content`);
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]!); } catch { errors.push(`${pathname}: invalid JSON-LD`); }
  }
}
if (new Set(urls).size !== urls.length) errors.push("Sitemap contains duplicate URLs");
if (errors.length) throw new Error(errors.join("\n"));
console.log(`SEO gate passed: ${urls.length} canonical URLs with readable content, one H1, one title and valid JSON-LD`);
