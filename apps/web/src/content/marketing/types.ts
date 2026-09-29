/**
 * Content model for marketing pages (features, compare, personas).
 *
 * Every marketing page keeps its words in a data module next to this file
 * (for example ./features/time-blocking.ts) whose default export is a
 * `MarketingPageContent`. The React page renders from it, and
 * scripts/prerender-marketing.ts turns the same data into meta tags, JSON-LD
 * and <noscript> HTML for crawlers that don't run JavaScript.
 *
 * Keep these modules pure data: no React, no CSS, no "@/" imports (the build
 * script imports them with Bun, outside Vite). See
 * src/components/marketing/README.md for the checklist.
 *
 * Text fields accept two bits of inline markup, rendered the same way on the
 * page and in the prerendered HTML:
 *   [label](/path)   a link (internal paths or https URLs)
 *   **words**        bold
 */

import type { FAQItem } from "../../lib/structured-data";

/** Icons the kit can draw. Mapped to lucide icons in components/marketing/icons.ts. */
export type IconName =
  | "bot"
  | "calendar"
  | "calendar-clock"
  | "check"
  | "clock"
  | "code"
  | "command"
  | "database"
  | "download"
  | "github"
  | "hourglass"
  | "keyboard"
  | "layout"
  | "lightbulb"
  | "link"
  | "list"
  | "monitor"
  | "refresh"
  | "repeat"
  | "server"
  | "shield"
  | "smartphone"
  | "sparkles"
  | "terminal"
  | "timer"
  | "zap";

export interface TextLink {
  label: string;
  href: string;
}

/**
 * Real product media from src/lib/blog-media.json. Never a mockup.
 * `alt` describes what the picture or clip shows; `caption` is one short
 * sentence under it ("Drag a task onto the calendar to block time for it.").
 */
export type MediaRef =
  | { clip: string; alt: string; caption?: string }
  | { shot: string; alt: string; caption?: string }
  | { video: "tour" | "ai" };

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/** A small floating card beside the hero frame (desktop only), echoing the app's own UI. */
export interface HeroChip {
  tone: "block" | "agent" | "timer";
  title: string;
  detail: string;
}

export interface PageHeroContent {
  /** Pill above the h1, e.g. "Time blocking". */
  eyebrow: string;
  /** Small orange label inside the pill, e.g. "Feature". */
  badge?: string;
  /** The h1. Put the page's main query in it. */
  title: string;
  /** A substring of `title` drawn in the brand gradient. Usually the last words. */
  accent?: string;
  /** One or two sentences that answer the query directly. AI answers quote this. */
  answer: string;
  /** Hero picture: usually a clip. */
  media: MediaRef;
  chips?: HeroChip[];
  /** The second button. Defaults to the 1-minute tour video. */
  secondary?: { video: "tour" | "ai"; label: string } | TextLink;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

interface SectionBase {
  /** Anchor id, unique on the page. */
  id: string;
  /** Short label above the heading, e.g. "How it works". */
  eyebrow?: string;
  /** An h2 that states what IS: the answer, not the topic. */
  heading: string;
  /** One or two sentences under the heading. */
  lead?: string;
}

/** The direct answer, right under the hero: short paragraphs plus key points. */
export interface AnswerSection extends SectionBase {
  kind: "answer";
  body: string[];
  points?: string[];
  pointsTitle?: string;
}

export interface StoryStep {
  icon?: IconName;
  eyebrow: string;
  title: string;
  body: string;
  /** Clip id; its poster shows until it plays. */
  clip: string;
  link?: TextLink;
}

/** Pinned scroll walk-through: the frame stays put while each step's clip plays. */
export interface StorySection extends SectionBase {
  kind: "story";
  steps: StoryStep[];
}

export interface MediaRow {
  title: string;
  body: string[];
  bullets?: string[];
  media: MediaRef;
  link?: TextLink;
}

/** Text beside real media, alternating sides. */
export interface MediaRowsSection extends SectionBase {
  kind: "media-rows";
  rows: MediaRow[];
}

export interface Benefit {
  icon: IconName;
  title: string;
  body: string;
  href?: string;
}

/** Hairline grid of short benefits, like the home page features. */
export interface BenefitsSection extends SectionBase {
  kind: "benefits";
  items: Benefit[];
}

export type Mark = "yes" | "partial" | "no";
/** A mark, or text with an optional mark: { mark: "partial", text: "Via your agent" }. */
export type ComparisonCell = Mark | { mark?: Mark; text: string };

export interface ComparisonRow {
  feature: string;
  /** One cell per column, Open Sunsama first. */
  cells: ComparisonCell[];
}

export interface ComparisonSection extends SectionBase {
  kind: "comparison";
  /** Column names, Open Sunsama first. */
  columns: string[];
  rows: ComparisonRow[];
  /** Where competitor facts come from and when they were checked. Required. */
  sources: string;
}

export interface StepsSection extends SectionBase {
  kind: "steps";
  steps: Array<{ title: string; body: string }>;
}

/** Only true numbers. `live: "github-stars"` shows the current star count. */
export type StatItem = { value: string; label: string } | { live: "github-stars"; label: string };

export interface StatsSection {
  kind: "stats";
  id: string;
  items: StatItem[];
}

/** "Any AI agent can do this for you": MCP URL, example prompts, a real clip. */
export interface AgentSection extends SectionBase {
  kind: "agent";
  body: string[];
  prompts: string[];
  /** MCP tools the agent uses for this job, e.g. ["get_schedule_for_day", "create_time_block"]. */
  tools?: string[];
  clip?: string;
  clipCaption?: string;
  links?: TextLink[];
}

/** Rendered by a page-supplied slot. Heading and body still go into the prerendered HTML. */
export interface CustomSection extends SectionBase {
  kind: "custom";
  body?: string[];
}

export type MarketingSection =
  | AnswerSection
  | StorySection
  | MediaRowsSection
  | BenefitsSection
  | ComparisonSection
  | StepsSection
  | StatsSection
  | AgentSection
  | CustomSection;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface RelatedLink {
  kind: "feature" | "compare" | "persona" | "guide" | "docs";
  title: string;
  description: string;
  href: string;
}

export interface MarketingFaq extends FAQItem {
  /** Optional follow-up link shown after the answer (not part of the JSON-LD answer). */
  link?: TextLink;
}

export interface MarketingPageContent {
  /** Route, e.g. "/features/time-blocking". Also the canonical path. */
  path: string;
  /** ISO date of the last real content change (sitemap lastmod). */
  updated: string;
  seo: {
    /** 50-60 characters before " | Open Sunsama". Main query first. */
    title: string;
    /** 140-160 characters with the query and the payoff. */
    description: string;
    ogImage?: string;
  };
  /** Trail after Home. The last item is this page (no href). */
  breadcrumbs: Array<{ label: string; href?: string }>;
  hero: PageHeroContent;
  sections: MarketingSection[];
  faqs: { heading: string; lead?: string; items: MarketingFaq[] };
  related: { heading: string; lead?: string; links: RelatedLink[] };
  cta: { heading: string; body: string; shot: string; shotAlt: string };
  /** Emit SoftwareApplication JSON-LD with these features. */
  software?: { featureList: string[] };
}

/** Identity helper so data modules get type-checked with a readable error. */
export function defineMarketingPage(page: MarketingPageContent): MarketingPageContent {
  return page;
}

// ---------------------------------------------------------------------------
// Inline markup
// ---------------------------------------------------------------------------

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "link"; label: string; href: string };

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;

/** Splits "See [the docs](/docs) **now**" into text, link and strong tokens. */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index) });
    if (match[1] !== undefined && match[2] !== undefined) {
      tokens.push({ type: "link", label: match[1], href: match[2] });
    } else if (match[3] !== undefined) {
      tokens.push({ type: "strong", value: match[3] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

/** The text without markup, for JSON-LD, alt text and meta tags. */
export function plainText(text: string): string {
  return parseInline(text)
    .map((token) => (token.type === "link" ? token.label : token.value))
    .join("");
}

export const markLabel: Record<Mark, string> = { yes: "Yes", partial: "Partly", no: "No" };
