/**
 * Shared data for the /alternative/* compare pages. Each page keeps two
 * blocks the generic kit has no section type for:
 *
 * - the verdict: "Switch to Open Sunsama if…" / "Stay with <X> if…" cards;
 * - "What you give up": the true gaps, in plain words, ending with the license.
 *
 * Both render through a page slot (components/alternative/compare-parts.tsx),
 * and their text also goes into the section `body`, so the prerendered HTML
 * carries every word. Pure data: no React, no "@/" imports.
 */

import type { CustomSection, TextLink } from "../types";

export interface Verdict {
  /** The rival's name, as readers write it ("Akiflow", "Reclaim"). */
  rival: string;
  /** Full sentences that start with "You …". */
  switchIf: string[];
  stayIf: string[];
  /** Where each card sends the reader next (e.g. the daily loop below, or the rival's alternatives guide). */
  switchLink?: TextLink;
  stayLink?: TextLink;
}

export interface GiveUp {
  title: string;
  body: string;
  link?: TextLink;
}

export interface AlternativeExtras {
  verdict: Verdict;
  giveUps: GiveUp[];
}

export const GITHUB_LICENSE_URL = "https://github.com/ShadowWalker2014/open-sunsama/blob/main/LICENSE";

/** Said the same way on every page (playbook, section 3). */
export const LICENSE_GIVE_UP: GiveUp = {
  title: "A license for company use",
  body: "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
  link: { label: "Read the license", href: GITHUB_LICENSE_URL },
};

export const LICENSE_FAQ = {
  question: "Is Open Sunsama really open source?",
  answer:
    "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
  link: { label: "See the code", href: "https://github.com/ShadowWalker2014/open-sunsama" },
};

/** "You want X." -> "you want X." so it reads after "Switch to Open Sunsama if". */
function lowerFirst(text: string): string {
  return /^Your? /.test(text) ? `y${text.slice(1)}` : text;
}

export function verdictSection(
  verdict: Verdict,
  copy: { id?: string; eyebrow?: string; heading: string; lead?: string }
): CustomSection {
  return {
    kind: "custom",
    id: copy.id ?? "verdict",
    eyebrow: copy.eyebrow ?? "Should you switch?",
    heading: copy.heading,
    lead: copy.lead,
    body: [
      ...verdict.switchIf.map((item) => `Switch to Open Sunsama if ${lowerFirst(item)}`),
      ...verdict.stayIf.map((item) => `Stay with ${verdict.rival} if ${lowerFirst(item)}`),
    ],
  };
}

export function giveUpSection(
  giveUps: GiveUp[],
  copy: { id?: string; eyebrow?: string; heading: string; lead?: string }
): CustomSection {
  return {
    kind: "custom",
    id: copy.id ?? "give-up",
    eyebrow: copy.eyebrow ?? "What you give up",
    heading: copy.heading,
    lead: copy.lead,
    body: giveUps.map((item) => `**${item.title}.** ${item.body}${item.link ? ` [${item.link.label}](${item.link.href})` : ""}`),
  };
}
