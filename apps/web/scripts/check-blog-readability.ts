#!/usr/bin/env bun
/**
 * Readability gate for blog posts. Checks the prose of each post against the
 * house style: short paragraphs, short sentences, grade 6 words.
 *
 *   bun run scripts/check-blog-readability.ts [slug ...]
 *
 * With no slugs it checks every post and prints a summary table. Exits 1 when
 * a named post fails, so writers can loop until it passes.
 *
 * Product and category terms (MCP, time blocking, Sunsama...) don't count
 * against the grade: readers search with those words, so we keep them.
 */

import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.resolve(import.meta.dir, "../src/content/blog");

const LIMITS = {
  grade: 6.5, // Flesch-Kincaid grade of the prose
  maxSentencesPerParagraph: 3,
  maxWordsPerSentence: 25, // any single sentence
  avgWordsPerSentence: 14,
};

// Words customers use and search for. Counted as one syllable.
const TERMS = new Set(
  `sunsama open-source opensource self-hosted self-host self-hosting docker kanban mcp oauth api apis
  claude chatgpt cursor anthropic openai gemini perplexity akiflow motion reclaim todoist ticktick morgen
  structured amie notion obsidian trello asana clickup linear jira routine ellie lifestack flowsavvy
  vikunja tududi joplin openproject planner planners planning calendar calendars timeboxing time-blocking
  pomodoro productivity integration integrations automation automatic automatically workflow workflows
  adhd github developer developers application applications desktop android ios macos windows linux
  subtasks subtask notification notifications keyboard shortcut shortcuts dashboard priority priorities
  recurring reminders reminder analytics alternative alternatives comparison comparisons features
  assistant assistants agent agents connector connectors server servers schedule scheduling scheduled
  outlook icloud google microsoft privacy`
    .split(/\s+/)
    .filter(Boolean)
);

function syllables(raw: string): number {
  const word = raw.toLowerCase().replace(/[^a-z-]/g, "");
  if (!word) return 0;
  if (TERMS.has(word) || TERMS.has(word.replace(/s$/, ""))) return 1;
  if (word.length <= 3) return 1;
  const cleaned = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Paragraphs of body prose: no frontmatter, headings, lists, tables, code, JSX or blank lines. */
function proseParagraphs(source: string): string[] {
  const body = source
    .replace(/export const frontmatter = \{[\s\S]*?\n\};/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^import .*$/gm, "");
  return body
    .split(/\n\s*\n/)
    .map((block) =>
      // Keep a block's prose lines; lists, tables and quotes are checked by eye, not here
      block
        .split("\n")
        .filter((line) => !/^\s*(- |\* |\d+\. |\||>)/.test(line))
        .join("\n")
        .trim()
    )
    .filter((block) => block && !/^(#|<|!\[|---)/.test(block))
    .map((block) =>
      block
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_`]/g, "")
        .replace(/\s+/g, " ")
    );
}

function sentences(paragraph: string): string[] {
  return paragraph
    .replace(/\b(e\.g|i\.e|vs|etc|Mr|Dr)\./g, "$1")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 1);
}

interface Report {
  slug: string;
  grade: number;
  avgWords: number;
  longParagraphs: string[];
  longSentences: string[];
  pass: boolean;
}

function check(slug: string): Report {
  const source = fs.readFileSync(path.join(BLOG_DIR, slug, "index.mdx"), "utf-8");
  const paragraphs = proseParagraphs(source);
  const allSentences = paragraphs.flatMap(sentences);
  const words = allSentences.flatMap((s) => s.split(/\s+/).filter((w) => /[a-z]/i.test(w)));
  const syllableCount = words.reduce((sum, w) => sum + syllables(w), 0);
  const avgWords = words.length / Math.max(1, allSentences.length);
  const grade = 0.39 * avgWords + 11.8 * (syllableCount / Math.max(1, words.length)) - 15.59;

  const longParagraphs = paragraphs.filter((p) => sentences(p).length > LIMITS.maxSentencesPerParagraph);
  const longSentences = allSentences.filter((s) => s.split(/\s+/).length > LIMITS.maxWordsPerSentence);
  const pass =
    grade <= LIMITS.grade &&
    avgWords <= LIMITS.avgWordsPerSentence &&
    longParagraphs.length === 0 &&
    longSentences.length === 0;

  return { slug, grade, avgWords, longParagraphs, longSentences, pass };
}

const named = process.argv.slice(2);
const slugs = named.length
  ? named
  : fs.readdirSync(BLOG_DIR).filter((d) => fs.existsSync(path.join(BLOG_DIR, d, "index.mdx")));

let failed = 0;
for (const slug of slugs) {
  const r = check(slug);
  if (!r.pass) failed++;
  const status = r.pass ? "PASS" : "FAIL";
  console.log(`${status}  ${slug}  grade ${r.grade.toFixed(1)}  avg ${r.avgWords.toFixed(1)} words/sentence`);
  if (named.length && !r.pass) {
    for (const p of r.longParagraphs) console.log(`  paragraph over ${LIMITS.maxSentencesPerParagraph} sentences: "${p.slice(0, 90)}..."`);
    for (const s of r.longSentences) console.log(`  sentence over ${LIMITS.maxWordsPerSentence} words: "${s.slice(0, 110)}..."`);
  }
}

console.log(`\n${slugs.length - failed}/${slugs.length} pass (grade <= ${LIMITS.grade}, <= ${LIMITS.maxSentencesPerParagraph} sentences per paragraph, <= ${LIMITS.maxWordsPerSentence} words per sentence)`);
if (named.length && failed) process.exit(1);
