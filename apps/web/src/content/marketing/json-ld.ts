/**
 * JSON-LD for a marketing page, keyed by the <script> id each kit component
 * uses. The page's components emit the same ids at runtime (Breadcrumbs,
 * FaqSection, MarketingSeo), so the client replaces the prerendered scripts
 * instead of duplicating them.
 */

import { BLOG_MEDIA } from "../../lib/blog-media";
import {
  breadcrumbListJsonLd,
  faqPageJsonLd,
  softwareApplicationJsonLd,
  videoObjectJsonLd,
} from "../../lib/structured-data";
import { plainText, type MarketingPageContent } from "./types";

export const JSON_LD_IDS = {
  breadcrumbs: "breadcrumb-schema",
  faq: "faq-schema",
  software: "software-schema",
} as const;

export function faqJsonLd(page: MarketingPageContent) {
  return faqPageJsonLd(
    page.faqs.items.map(({ question, answer }) => ({ question, answer: plainText(answer) }))
  );
}

export function softwareJsonLd(page: MarketingPageContent) {
  return softwareApplicationJsonLd({
    description: plainText(page.seo.description),
    url: page.path,
    featureList: page.software?.featureList ?? [],
  });
}

/** Narrated videos the page shows: the hero's second button (the tour by default) and agent sections. */
export function pageVideos(page: MarketingPageContent): string[] {
  const ids = new Set<string>();
  const secondary = page.hero.secondary;
  if (!secondary || "video" in secondary) ids.add(secondary?.video ?? "tour");
  if ("video" in page.hero.media) ids.add(page.hero.media.video);
  if (page.sections.some((section) => section.kind === "agent")) ids.add("ai");
  return [...ids];
}

export function marketingJsonLd(page: MarketingPageContent): Record<string, object> {
  const blocks: Record<string, object> = {
    [JSON_LD_IDS.breadcrumbs]: breadcrumbListJsonLd(page.breadcrumbs, page.path),
    [JSON_LD_IDS.faq]: faqJsonLd(page),
  };
  if (page.software) blocks[JSON_LD_IDS.software] = softwareJsonLd(page);
  for (const id of pageVideos(page)) {
    const video = BLOG_MEDIA.videos[id];
    // Same id as components/seo/video-schema.tsx
    if (video) blocks[`video-schema-${id}`] = videoObjectJsonLd(video);
  }
  return blocks;
}
