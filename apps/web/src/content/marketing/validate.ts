/**
 * Checks a marketing page's data before it ships. scripts/prerender-marketing.ts
 * runs this on every page during `bun run build`: errors fail the build,
 * warnings print. Keep the rules in step with src/components/marketing/README.md.
 */

import { BLOG_MEDIA } from "../../lib/blog-media";
import { plainText, type MarketingPageContent, type MediaRef } from "./types";

/** Hype words and claims the playbook bans (.skills/seo-content/playbook.md). */
const BANNED: Array<[RegExp, string]> = [
  // "free slots" and "free time" are fine; "free app" or "for free" sells on price
  [/\bfree\b(?![ -](slots?|time|space|hours?|up)\b)/i, 'sells on price ("free")'],
  [/\b(revolutionary|game[- ]changer|seamless(ly)?|leverage|robust|unlock|elevate|supercharge)\b/i, "hype word"],
  [/\b(app store|play store|ios app|android app)\b/i, "claims a native phone app (there is none; phones use the mobile web app)"],
  [/\b(we tested|in our testing|hands-on test)/i, "claims hands-on testing of other apps"],
];

/**
 * MIT, GPL or OSI next to "Open Sunsama" in one sentence misstates our license.
 * Competitors' licenses (Vikunja is AGPL, Super Productivity is MIT) are fine.
 */
function misstatesOurLicense(text: string): boolean {
  return text
    .split(/(?<=[.!?|])\s+/)
    .some((sentence) => /open sunsama/i.test(sentence) && /\b(MIT|GPL|OSI)\b/.test(sentence) && !/\bnot\b|n't/i.test(sentence));
}

function mediaExists(media: MediaRef): boolean {
  if ("clip" in media) return Boolean(BLOG_MEDIA.clips[media.clip]);
  if ("shot" in media) return Boolean(BLOG_MEDIA.shots[media.shot]);
  return Boolean(BLOG_MEDIA.videos[media.video]);
}

/** Every string in the page, for the banned-word scan. */
function collectText(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectText(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectText(item, out));
  return out;
}

export function validateMarketingPage(page: MarketingPageContent) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const media: MediaRef[] = [page.hero.media];

  if (!page.path.startsWith("/")) errors.push(`path "${page.path}" must start with /`);
  if (page.hero.accent && !page.hero.title.includes(page.hero.accent)) {
    errors.push(`hero.accent "${page.hero.accent}" is not part of hero.title`);
  }
  if (page.breadcrumbs.at(-1)?.href) errors.push("the last breadcrumb is this page and must not have an href");

  const ids = new Set<string>();
  for (const section of page.sections) {
    if (ids.has(section.id)) errors.push(`section id "${section.id}" is used twice`);
    ids.add(section.id);
    if (section.kind === "comparison") {
      if (section.columns[0] !== "Open Sunsama") errors.push(`${section.id}: the first column must be Open Sunsama`);
      for (const row of section.rows) {
        if (row.cells.length !== section.columns.length) {
          errors.push(`${section.id}: "${row.feature}" has ${row.cells.length} cells for ${section.columns.length} columns`);
        }
      }
      if (!/20\d\d/.test(section.sources)) errors.push(`${section.id}: sources must say when facts were checked`);
    }
    if (section.kind === "media-rows") media.push(...section.rows.map((row) => row.media));
    if (section.kind === "story") {
      for (const step of section.steps) media.push({ clip: step.clip, alt: step.title });
    }
    if (section.kind === "agent" && section.clip) media.push({ clip: section.clip, alt: section.heading });
  }

  for (const ref of media) {
    if (!mediaExists(ref)) errors.push(`media ${JSON.stringify(ref)} is not in src/lib/blog-media.json`);
  }
  if (!BLOG_MEDIA.shots[page.cta.shot]) errors.push(`cta.shot "${page.cta.shot}" is not in src/lib/blog-media.json`);

  const faqCount = page.faqs.items.length;
  if (faqCount < 4 || faqCount > 8) warnings.push(`${faqCount} FAQs; aim for 5-8`);
  if (page.related.links.length < 3) warnings.push("fewer than 3 related links");

  const titleLength = page.seo.title.length;
  if (titleLength < 30 || titleLength > 60) warnings.push(`seo.title is ${titleLength} characters; aim for 30-60`);
  const descriptionLength = plainText(page.seo.description).length;
  if (descriptionLength < 120 || descriptionLength > 160) {
    warnings.push(`seo.description is ${descriptionLength} characters; aim for 140-160`);
  }

  for (const text of collectText(page)) {
    for (const [pattern, reason] of BANNED) {
      const match = plainText(text).match(pattern);
      if (match) errors.push(`"${match[0]}" ${reason}: ${plainText(text).slice(0, 80)}`);
    }
    if (misstatesOurLicense(plainText(text))) {
      errors.push(`calls Open Sunsama's license MIT, GPL or OSI (it is non-commercial): ${plainText(text).slice(0, 80)}`);
    }
  }

  return { errors, warnings };
}
