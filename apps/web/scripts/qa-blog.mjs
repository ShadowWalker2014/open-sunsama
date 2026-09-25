#!/usr/bin/env node
/**
 * Visual and performance QA for blog posts and landing pages.
 *
 * Opens each path at phone, tablet and desktop widths in light and dark mode
 * against a running web dev server, then reports layout shift (CLS), sideways
 * scroll, console errors and media that failed to load. Screenshots of the top
 * of each page and of every media block go to OUT_DIR so you can look at them.
 *
 *   node scripts/qa-blog.mjs /blog/sunsama-mcp /alternative/sunsama
 *   node scripts/qa-blog.mjs sunsama-mcp motion-alternatives   # bare slugs = /blog/<slug>
 *
 * Env: WEB_URL (default http://localhost:3107), OUT_DIR (default /tmp/qa-blog).
 * Uses the Playwright install in scripts/readme-media. Exits 1 if any page fails.
 */

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(new URL("../../../scripts/readme-media/package.json", import.meta.url));
const { chromium } = require("playwright");

const WEB = process.env.WEB_URL ?? "http://localhost:3107";
const OUT = process.env.OUT_DIR ?? "/tmp/qa-blog";
const WIDTHS = [375, 768, 1280];
const THEMES = ["light", "dark"];
const MAX_CLS = 0.1;

const paths = process.argv.slice(2).map((p) => (p.startsWith("/") ? p : `/blog/${p}`));
if (!paths.length) {
  console.error("Pass one or more paths or blog slugs.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const route of paths) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
      // A video request aborted while scrolling past a clip is not a failure
page.on("requestfailed", (r) => {
  if (/ERR_ABORTED/.test(r.failure()?.errorText ?? "") && /\.(mp4|webm)$/.test(r.url())) return;
  errors.push(`failed ${r.url().replace(WEB, "")}`);
});

      await page.goto(`${WEB}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);

      // Scroll through so lazy media loads and any late shift gets counted
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 700) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(120);
      }

      const result = await page.evaluate(() => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.offsetParent).map((img) => img.getAttribute("src"));
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                cls,
                overflow: document.documentElement.scrollWidth > window.innerWidth,
                brokenImages,
                media: document.querySelectorAll(".blog-prose figure, .blog-prose video").length,
              }),
            300
          )
        );
      });

      const name = `${route.replace(/\W+/g, "-").replace(/^-|-$/g, "")}-${width}-${theme}`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      const figures = page.locator(".blog-prose figure");
      for (let i = 0; i < Math.min(await figures.count(), 6); i++) {
        await figures.nth(i).scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        await figures.nth(i).screenshot({ path: path.join(OUT, `${name}-media-${i + 1}.png`) }).catch(() => {});
      }

      const ok = result.cls < MAX_CLS && !result.overflow && !result.brokenImages.length && !errors.length;
      if (!ok) failures++;
      console.log(
        `${ok ? "PASS" : "FAIL"}  ${route}  ${width}px ${theme}  cls ${result.cls.toFixed(3)}  media ${result.media}` +
          (result.overflow ? "  SIDEWAYS-SCROLL" : "") +
          (result.brokenImages.length ? `  broken: ${result.brokenImages.join(", ")}` : "") +
          (errors.length ? `  errors: ${errors.join(" | ")}` : "")
      );
      await context.close();
    }
  }
}

await browser.close();
console.log(`\nScreenshots in ${OUT}. ${failures ? `${failures} check(s) failed.` : "All checks passed."}`);
process.exit(failures ? 1 : 0);
