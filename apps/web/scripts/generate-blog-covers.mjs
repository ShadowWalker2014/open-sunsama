#!/usr/bin/env node
/**
 * Designed blog covers built from real product screenshots.
 *
 * Every post in src/content/blog/<slug>/ gets three files in public/:
 *   blog-<slug>.webp       2400x1200 light cover
 *   blog-<slug>-dark.webp  2400x1200 dark cover
 *   blog-<slug>-og.jpg     1200x630 social card (same composition, re-laid out)
 *
 * Each cover is one system: brand background (warm off-white or near-black, orange
 * mesh glow, dot texture), the Open Sunsama mark, an eyebrow, a short headline with
 * the homepage's orange accent, and 2-4 pieces cut from the real screenshots in
 * public/landing/ and src/lib/blog-media.json (sharp extracts them at full resolution),
 * layered as cards. Chips and the terminal card are HTML, like the homepage hero.
 * Nothing is AI-generated and no UI is redrawn.
 *
 *   cd apps/web
 *   node scripts/generate-blog-covers.mjs                    # every post
 *   node scripts/generate-blog-covers.mjs my-new-post        # one or more slugs
 *   node scripts/generate-blog-covers.mjs --list             # slug -> topic, composition, headline
 *
 * New post? Add its short headline to HEADLINES below (wrap the accent words in
 * [brackets]); without one the script shortens the title itself. The topic, and so
 * the composition, comes from slug keywords first, then tags (TOPICS); pin a post's
 * look in OVERRIDES. Then point the post's frontmatter `image` at /blog-<slug>.webp.
 *
 * Env: OUT_DIR (default public/), ONLY=light,dark,og to render a subset.
 * Uses Playwright + sharp from scripts/readme-media (cd scripts/readme-media && bun install).
 * Fonts load from jsDelivr, so it needs network access.
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(new URL("../../../scripts/readme-media/package.json", import.meta.url));
const { chromium } = require("playwright");
const sharp = require("sharp");

const WEB = path.resolve(import.meta.dirname, "..");
const BLOG_DIR = path.join(WEB, "src/content/blog");
const PUBLIC = path.join(WEB, "public");
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : PUBLIC;
const ONLY = new Set((process.env.ONLY ?? "light,dark,og").split(","));
const CUT_DIR = path.join(tmpdir(), "opensunsama-cover-cuts");
const MAX_COVER_KB = 180;
const MAX_OG_KB = 150;

// Brand tokens from src/index.css: --primary, --gradient-start/-end, --background.
const THEMES = {
  light: {
    bg: "hsl(30 60% 98.6%)",
    fg: "hsl(220 13% 18%)",
    muted: "hsl(220 9% 46%)",
    primary: "hsl(24 95% 53%)",
    accentFrom: "hsl(24 95% 53%)",
    accentTo: "hsl(38 96% 54%)",
    rgb: "249 115 22",
    mesh: [
      "radial-gradient(52% 70% at 80% 58%, rgb(249 115 22 / 0.30), transparent 70%)",
      "radial-gradient(36% 50% at 100% 0%, rgb(251 191 36 / 0.30), transparent 70%)",
      "radial-gradient(40% 60% at 0% 100%, rgb(253 186 116 / 0.28), transparent 70%)",
      "radial-gradient(30% 40% at 28% 12%, rgb(255 237 213 / 0.9), transparent 70%)",
    ],
    dots: "rgb(120 72 36 / 0.16)",
    cardBorder: "rgb(15 23 42 / 0.08)",
    cardShadow:
      "0 1px 2px rgb(15 23 42 / .05), 0 22px 50px -16px rgb(15 23 42 / .24), 0 34px 90px -30px rgb(249 115 22 / .55)",
    liftShadow: "0 30px 60px -18px rgb(15 23 42 / .38), 0 40px 90px -30px rgb(249 115 22 / .7)",
    chipBg: "rgb(255 255 255 / 0.95)",
    chipBorder: "rgb(15 23 42 / 0.08)",
    chipShadow: "0 16px 40px -12px rgb(15 23 42 / 0.28), 0 2px 6px -1px rgb(15 23 42 / 0.06)",
  },
  dark: {
    bg: "hsl(228 14% 7%)",
    fg: "hsl(220 13% 93%)",
    muted: "hsl(220 9% 62%)",
    primary: "hsl(24 95% 60%)",
    accentFrom: "hsl(24 95% 60%)",
    accentTo: "hsl(43 96% 65%)",
    rgb: "250 134 58",
    mesh: [
      "radial-gradient(52% 70% at 80% 58%, rgb(249 115 22 / 0.30), transparent 70%)",
      "radial-gradient(36% 50% at 100% 0%, rgb(245 158 11 / 0.16), transparent 70%)",
      "radial-gradient(40% 60% at 0% 100%, rgb(234 88 12 / 0.14), transparent 70%)",
    ],
    dots: "rgb(255 255 255 / 0.07)",
    cardBorder: "rgb(255 255 255 / 0.1)",
    cardShadow:
      "0 1px 0 rgb(255 255 255 / .04) inset, 0 24px 60px -16px rgb(0 0 0 / .75), 0 34px 90px -30px rgb(249 115 22 / .45)",
    liftShadow: "0 30px 60px -18px rgb(0 0 0 / .8), 0 40px 90px -30px rgb(249 115 22 / .6)",
    chipBg: "hsl(228 14% 11% / 0.95)",
    chipBorder: "rgb(255 255 255 / 0.1)",
    chipShadow: "0 16px 40px -12px rgb(0 0 0 / 0.7)",
  },
};

// --- Real screenshots and the pieces cut from them -------------------------------------

function loadShots() {
  const shots = {};
  const manifestFile = path.join(WEB, "src/lib/blog-media.json");
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf-8")) : {};
  for (const [name, s] of Object.entries(manifest.shots ?? {})) {
    const light = path.join(PUBLIC, s.light);
    const dark = path.join(PUBLIC, s.dark);
    if (existsSync(light) && existsSync(dark)) shots[name] = { light, dark };
  }
  // public/landing/ holds 2880px captures of the same seeded day: sharper, so preferred.
  for (const file of readdirSync(path.join(PUBLIC, "landing"))) {
    const m = file.match(/^(.+)-light\.webp$/);
    const dark = m && path.join(PUBLIC, "landing", `${m[1]}-dark.webp`);
    if (m && existsSync(dark)) shots[m[1]] = { light: path.join(PUBLIC, "landing", file), dark };
  }
  return shots;
}

/**
 * Regions in source pixels. Board, calendar, focus, palette, ideas and task detail
 * are the 2880x1800 landing captures; mcp-settings (1600 wide), consent (1146) and
 * mobile (780) come from blog-media. A cut may stack several regions of one shot.
 */
const CUTS = {
  boardToday: { shot: "board", parts: [[62, 215, 565, 935]] }, // Today column
  boardThuFri: { shot: "board", parts: [[1195, 215, 1110, 660]] }, // tasks tagged P0-P3
  taskCard: { shot: "board", parts: [[94, 452, 520, 402]] }, // Finalize Q4 roadmap: timer + subtasks
  dayBlocks: { shot: "board", parts: [[2326, 100, 554, 960]] }, // Tuesday's time blocks
  blockLunch: { shot: "board", parts: [[2402, 583, 478, 101]] },
  weekGrid: { shot: "calendar-week", parts: [[503, 232, 1584, 100], [503, 548, 1584, 1050]] }, // day header + 9am-4pm
  focusCard: { shot: "focus", parts: [[700, 140, 960, 690]] },
  focusTimer: { shot: "focus", parts: [[1740, 196, 440, 100]] },
  palette: { shot: "command-palette", parts: [[864, 472, 1152, 856]] },
  taskModal: { shot: "task-detail", parts: [[768, 403, 1343, 610]] },
  ideasCols: { shot: "ideas", parts: [[505, 222, 1700, 590]] },
  mcpPanel: { shot: "mcp-settings", parts: [[432, 123, 1056, 360]] },
  mcpConnected: { shot: "mcp-settings", parts: [[432, 1104, 1056, 360]] },
  consentClaude: { shot: "consent-claude", parts: [[98, 238, 954, 1070]] },
  consentChatgpt: { shot: "consent-chatgpt", parts: [[98, 238, 954, 1070]] },
  mobile: { shot: "mobile-tasks", parts: [[0, 0, 780, 1688]] },
};

function cutSize(name) {
  const parts = CUTS[name].parts;
  return { w: parts[0][2], h: parts.reduce((sum, p) => sum + p[3], 0) };
}

/** Extract a cut at full resolution to a lossless PNG. */
async function extractCut(name, theme, shots) {
  const cut = CUTS[name];
  const src = shots[cut.shot]?.[theme];
  if (!src) throw new Error(`Missing screenshot ${cut.shot} (${theme}) for cut ${name}`);
  const { w, h } = cutSize(name);
  let top = 0;
  const layers = [];
  for (const [left, y, width, height] of cut.parts) {
    layers.push({ input: await sharp(src).extract({ left, top: y, width, height }).png().toBuffer(), left: 0, top });
    top += height;
  }
  const file = path.join(CUT_DIR, `${name}-${theme}.png`);
  await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toFile(file);
  return file;
}

// --- Chips (short real phrases from the product and the seeded demo day) -----------------

const ai = (title, sub) => ({ kind: "ai", title, sub });
const note = (icon, title, sub) => ({ kind: "note", icon, title, sub });
const kbd = (keys, text) => ({ kind: "kbd", keys, text });

const C = {
  claude: ai("Claude connected", "Planned 3 blocks for you"),
  chatgpt: ai("ChatGPT connected", "Planned your day"),
  anyAgent: note("github", "Open source", "Works with any AI agent"),
  github: note("github", "Open source", "Self-host with Docker"),
  anyMcp: note("plug", "Claude · ChatGPT · Cursor", "Any MCP client"),
  rolled: note("rotate", "Rolled over 2 tasks", "from yesterday"),
  today: note("sun", "Today · 8 tasks", "4:45 planned"),
  calendars: note("calendar", "Google, Outlook & iCloud", "in one calendar"),
  repeat: note("repeat", "Repeats every weekday", "Daily standup"),
  shutdown: note("moon", "Daily shutdown", "Tomorrow is planned"),
  someday: note("bulb", "Someday · 3 ideas", "Product bets"),
  devices: note("phone", "Web, desktop and phone browser", "Synced in real time"),
  subtasks: note("check", "2 of 4 subtasks done", "Finalize Q4 roadmap"),
  cmdk: kbd("⌘K", "Search everything"),
  cmdkIdeas: kbd("⌘K", "Search tasks and ideas"),
  quickAdd: kbd("⌘⇧T", "New task from anywhere"),
  space: kbd("Space", "Start or stop the timer"),
};

// --- Headlines: short versions of the titles, [accent] in brand orange ------------------

const HEADLINES = {
  "80-20-rule-productivity": "The [80/20 Rule] for Productivity",
  "akiflow-alternatives": "7 Best [Akiflow Alternatives]",
  "akiflow-vs-sunsama-vs-motion": "Akiflow vs Sunsama [vs Motion]",
  "asana-to-open-sunsama-migration": "Move From Asana to [Open Sunsama]",
  "asana-vs-sunsama": "Asana [vs Sunsama]",
  "basecamp-vs-sunsama": "Basecamp [vs Sunsama]",
  "benefits-of-planning-your-day": "12 Benefits of [Planning Your Day]",
  "best-calendar-apps-time-blocking": "9 Best [Time Blocking] Apps",
  "best-daily-planner-managers": "Best Daily Planners [for Managers]",
  "best-daily-planner-remote-workers": "Best Daily Planners [for Remote Work]",
  "best-daily-planner-solopreneurs": "Best Daily Planners [for Solopreneurs]",
  "best-focus-apps-deep-work": "Best Focus Apps for [Deep Work]",
  "best-free-daily-planner-apps": "The Best [Daily Planner] Apps",
  "best-free-sunsama-alternatives": "9 Best [Sunsama Alternatives]",
  "best-habit-tracker-task-management": "Habit Trackers With [Task Management]",
  "best-open-source-productivity-apps": "Best [Open Source] Productivity Apps",
  "best-pomodoro-apps-task-management": "Best [Pomodoro] Apps With Tasks",
  "best-productivity-apps-adhd": "Productivity Apps [for ADHD]",
  "best-productivity-apps-consultants": "Productivity Apps [for Consultants]",
  "best-productivity-apps-creatives": "Productivity Apps [for Creatives]",
  "best-productivity-apps-entrepreneurs": "Productivity Apps [for Entrepreneurs]",
  "best-productivity-apps-lawyers": "Productivity Apps [for Lawyers]",
  "best-task-management-apps-freelancers": "Task Management [for Freelancers]",
  "best-task-management-product-managers": "Task Management [for Product Managers]",
  "best-task-management-writers": "Task Management [for Writers]",
  "best-task-managers-with-mcp": "Best Task Managers [With MCP]",
  "best-time-blocking-apps-developers": "Time Blocking [for Developers]",
  "best-time-management-apps-students": "Time Management [for Students]",
  "best-work-life-balance-apps": "Apps for [Work-Life Balance]",
  "calendly-vs-sunsama": "Calendly [vs Sunsama]",
  "clickup-vs-sunsama": "ClickUp [vs Sunsama]",
  "clockify-vs-toggl-vs-open-sunsama": "Clockify vs Toggl [vs Open Sunsama]",
  "complete-daily-planning-guide": "The Complete Guide to [Daily Planning]",
  "complete-guide-time-blocking": "The Complete Guide to [Time Blocking]",
  "cron-calendar-vs-sunsama": "Cron Calendar [vs Sunsama]",
  "daily-planning-routine-guide": "A Daily Planning Routine [That Sticks]",
  "deep-work-cal-newport-guide": "Cal Newport's [Deep Work], Explained",
  "digital-minimalism-productivity": "Fewer Apps, [More Focus]",
  "eisenhower-matrix-guide": "The [Eisenhower Matrix], Explained",
  "energy-management-vs-time-management": "Manage Energy, [Not Just Time]",
  "evening-routine-productivity": "An Evening Routine to [End Your Day Right]",
  "fantastical-vs-sunsama": "Fantastical [vs Sunsama]",
  "getting-started-with-time-blocking": "Getting Started With [Time Blocking]",
  "google-calendar-vs-sunsama": "Google Calendar [vs Sunsama]",
  "gtd-method-explained": "Getting Things Done, [Explained]",
  "how-to-avoid-burnout": "How to [Avoid Burnout]",
  "how-to-be-more-organized": "How to Be [More Organized]",
  "how-to-build-daily-planning-system": "Build a [Daily Planning System]",
  "how-to-create-daily-schedule": "A Daily Schedule [That Works]",
  "how-to-manage-multiple-projects": "Manage [Multiple Projects] Calmly",
  "how-to-plan-your-day": "How to [Plan Your Day]",
  "how-to-protect-focus-time": "How to Protect [Your Focus Time]",
  "how-to-reduce-meetings": "Fewer Meetings, [More Focus]",
  "how-to-say-no-at-work": "How to [Say No] at Work",
  "how-to-set-daily-goals": "Daily Goals [You'll Actually Hit]",
  "how-to-stop-working-late": "How to [Stop Working Late]",
  "how-to-track-your-time": "How to [Track Your Time]",
  "how-to-weekly-review": "How to Do a [Weekly Review]",
  "jira-vs-sunsama": "Jira [vs Sunsama]",
  "linear-vs-sunsama": "Linear [vs Sunsama]",
  "maker-vs-manager-schedule": "Maker's Schedule vs [Manager's Schedule]",
  "mastering-daily-planning": "Mastering [Daily Planning]",
  "monday-vs-sunsama": "Monday.com [vs Sunsama]",
  "morgen-vs-sunsama": "Morgen [vs Sunsama]",
  "morning-routine-productivity": "A Morning Routine for [a Focused Day]",
  "motion-alternatives": "8 Best [Motion Alternatives]",
  "motion-vs-sunsama": "Motion [vs Sunsama]",
  "notion-calendar-vs-sunsama": "Notion Calendar [vs Sunsama]",
  "notion-to-open-sunsama-migration": "Move From Notion to [Open Sunsama]",
  "notion-vs-sunsama-daily-planning": "Notion vs Sunsama for [Daily Planning]",
  "obsidian-vs-notion-task-management": "Obsidian vs Notion [for Tasks]",
  "open-source-todoist-alternatives": "Open Source [Todoist Alternatives]",
  "plan-your-day-with-chatgpt": "Plan Your Day [With ChatGPT]",
  "plan-your-day-with-claude": "Plan Your Day [With Claude]",
  "pomodoro-technique-guide": "The [Pomodoro Technique], Explained",
  "productive-working-from-home": "Stay Productive [Working From Home]",
  "reclaim-ai-alternatives": "7 Best [Reclaim.ai Alternatives]",
  "reclaim-ai-vs-motion-vs-sunsama": "Reclaim vs Motion [vs Sunsama]",
  "replace-sunsama-open-sunsama": "Switch From Sunsama to [Open Sunsama]",
  "science-of-productivity": "The [Science] of Productivity",
  "second-brain-productivity": "Build a [Second Brain]",
  "self-hosted-productivity-apps": "[Self-Hosted] Productivity Apps",
  "signs-need-better-time-management": "10 Signs You Need [Better Time Management]",
  "signs-of-burnout": "12 [Signs of Burnout]",
  "signs-of-poor-work-habits": "15 Signs of [Poor Work Habits]",
  "single-tasking-guide": "The Case for [Single-Tasking]",
  "stop-procrastinating-time-blocking": "Stop Procrastinating With [Time Blocking]",
  "structured-vs-sunsama": "Structured [vs Sunsama]",
  "sunsama-mcp": "Sunsama MCP for [Claude and ChatGPT]",
  "sunsama-review": "Sunsama Review: [Is It Worth It?]",
  "superhuman-vs-sunsama": "Superhuman [vs Sunsama]",
  "task-batching-guide": "Task Batching, [Explained]",
  "things-3-vs-sunsama": "Things 3 [vs Sunsama]",
  "ticktick-vs-sunsama": "TickTick [vs Sunsama]",
  "time-blocking-vs-todo-lists": "Time Blocking vs [To-Do Lists]",
  "time-blocking-with-ai": "AI Time Blocking, [You Stay in Control]",
  "time-management-methods-compared": "Time Management Methods, [Compared]",
  "todoist-to-open-sunsama-migration": "Switch From Todoist to [Open Sunsama]",
  "trello-vs-sunsama": "Trello [vs Sunsama]",
  "what-is-a-routine": "What Is a [Routine]?",
  "what-is-a-to-do-list": "What Is a [To-Do List]?",
  "what-is-daily-planner": "What Is a [Daily Planner]?",
  "what-is-deep-focus": "What Is [Deep Focus]?",
  "what-is-focus": "What Is [Focus]?",
  "what-is-goal-setting": "What Is [Goal Setting]?",
  "what-is-personal-productivity": "What Is [Personal Productivity]?",
  "what-is-prioritization": "What Is [Prioritization]?",
  "what-is-productivity": "What Is [Productivity]?",
  "what-is-scheduling": "What Is [Scheduling]?",
  "what-is-self-discipline": "What Is [Self-Discipline]?",
  "what-is-task-management": "What Is [Task Management]?",
  "what-is-time-blocking": "What Is [Time Blocking]?",
  "what-is-time-management": "What Is [Time Management]?",
  "what-is-work-life-balance": "What Is [Work-Life Balance]?",
  "what-is-work-management": "What Is [Work Management]?",
  "why-am-i-always-tired": "Why Am I [Always Tired]?",
  "why-am-i-so-unproductive": "Why Am I [So Unproductive]?",
  "why-cant-i-focus": "Why Can't I [Focus]?",
  "why-cant-i-stick-to-a-schedule": "Why Can't I [Stick to a Schedule]?",
  "why-do-i-always-feel-behind": "Why Do I Always [Feel Behind]?",
  "why-do-i-feel-overwhelmed": "Why Do I Feel [Overwhelmed]?",
  "why-do-i-keep-forgetting-things": "Why Do I Keep [Forgetting Things]?",
  "why-do-i-procrastinate": "Why Do I [Procrastinate]?",
  "why-is-it-hard-to-start-tasks": "Why Is It Hard to [Start Tasks]?",
  "why-is-it-hard-to-stay-motivated": "Why Is It Hard to [Stay Motivated]?",
  "why-todo-lists-dont-work": "Why Your To-Do List [Isn't Working]",
  "work-life-integration-vs-balance": "Work-Life Integration [vs Balance]",
};

/** Fallback for a post without a HEADLINES entry: trim the title, accent its last two words. */
function autoHeadline(title) {
  let text = title
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\b(in )?20\d\d\b:?/g, "")
    .trim();
  const [head, tail] = text.split(/:\s+/);
  if (tail && head.split(" ").length >= 2) text = head;
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const n = Math.min(2, words.length - 1);
  return `${words.slice(0, -n).join(" ")} [${words.slice(-n).join(" ")}]`;
}

// --- Compositions: pieces placed in the right-hand stage (x 580-1140, y 0-600) -------------
// Each item: { cut | chip | phone | terminal, x, y, w, r (deg), z, lift (picked-up look) }.
// Chips set x and y only. A flipped cover mirrors the stage so neighbours differ.

const COMPOSITIONS = {
  // Board day column + the day's time blocks: comparisons, alternatives, daily planning
  boardDay: (chip) => [
    { cut: "boardToday", x: 0, y: 64, w: 290, r: -3, z: 1 },
    { cut: "dayBlocks", x: 262, y: 40, w: 290, r: 2.5, z: 2 },
    chip && { chip, x: 30, y: 474, z: 3 },
  ],
  // Time blocks with a task card being dragged onto them: time blocking, scheduling
  dragBlock: (chip) => [
    { cut: "dayBlocks", x: 236, y: 36, w: 310, r: 2, z: 1 },
    { cut: "taskCard", x: 6, y: 196, w: 300, r: -5, z: 3, lift: true },
    chip && { chip, x: 20, y: 470, z: 4 },
  ],
  // Week calendar + a lifted block: calendars, routines, AI scheduling
  week: (chip) => [
    { cut: "weekGrid", x: 4, y: 40, w: 536, r: -2, z: 1 },
    { cut: "blockLunch", x: 300, y: 450, w: 240, r: 4, z: 3, lift: true },
    chip && { chip, x: 0, y: 462, z: 4 },
  ],
  // Focus page + the running timer: focus, deep work, pomodoro, procrastination
  focus: (chip) => [
    { cut: "focusCard", x: 0, y: 150, w: 520, r: -2, z: 1 },
    { cut: "focusTimer", x: 292, y: 82, w: 250, r: 3, z: 3, lift: true },
    chip && { chip, x: 36, y: 470, z: 4 },
  ],
  // Consent card + MCP URL panel + connected apps: Claude / ChatGPT posts
  consent: (chip, cut = "consentClaude") => [
    { cut, x: 0, y: 36, w: 300, r: -2.5, z: 3 },
    { cut: "mcpPanel", x: 240, y: 350, w: 316, r: 2, z: 2 },
    { cut: "mcpConnected", x: 250, y: 470, w: 300, r: 1, z: 1 },
    chip && { chip, x: 312, y: 104, z: 4 },
  ],
  // MCP settings panel + connected apps: MCP posts
  mcp: (chip, chip2) => [
    { cut: "mcpPanel", x: 0, y: 92, w: 470, r: -2, z: 1 },
    { cut: "mcpConnected", x: 90, y: 300, w: 450, r: 2, z: 2 },
    chip && { chip, x: 20, y: 478, z: 4 },
    chip2 && { chip: chip2, x: 250, y: 30, z: 4 },
  ],
  // Board column + terminal card: open source, self-hosted
  openSource: (chip) => [
    { cut: "boardToday", x: 0, y: 56, w: 280, r: -3, z: 1 },
    { terminal: true, x: 170, y: 270, w: 384, r: 2, z: 2 },
    chip && { chip, x: 250, y: 104, z: 3 },
  ],
  // Tasks tagged P0-P3 + the task card: prioritization, goals
  priorities: (chip) => [
    { cut: "boardThuFri", x: 0, y: 86, w: 470, r: -2, z: 1 },
    { cut: "taskCard", x: 250, y: 300, w: 290, r: 4, z: 2, lift: true },
    chip && { chip, x: 0, y: 440, z: 3 },
  ],
  // Task detail with subtasks + board: tasks, to-do lists, batching
  task: (chip) => [
    { cut: "taskModal", x: 0, y: 96, w: 530, r: -2, z: 2 },
    { cut: "boardThuFri", x: 136, y: 318, w: 410, r: 3, z: 1 },
    chip && { chip, x: 290, y: 38, z: 3 },
  ],
  // Ideas board + ⌘K palette: second brain, notes, creatives
  ideas: (chip) => [
    { cut: "ideasCols", x: 0, y: 70, w: 550, r: -2, z: 1 },
    { cut: "palette", x: 150, y: 230, w: 400, r: 3, z: 2 },
    chip && { chip, x: 0, y: 330, z: 3 },
  ],
  // ⌘K palette over the board: organization, GTD, projects
  palette: (chip) => [
    { cut: "boardToday", x: 330, y: 40, w: 220, r: 4, z: 1 },
    { cut: "palette", x: 0, y: 128, w: 440, r: -2, z: 2 },
    chip && { chip, x: 40, y: 484, z: 3 },
  ],
  // Phone + day blocks: students, remote work
  mobile: (chip) => [
    { cut: "dayBlocks", x: 0, y: 64, w: 290, r: -3, z: 1 },
    { phone: true, x: 318, y: 40, w: 214, z: 2 },
    chip && { chip, x: 130, y: 478, z: 3 },
  ],
  // Day blocks with lunch lifted out: work-life balance, burnout
  balance: (chip) => [
    { cut: "dayBlocks", x: 250, y: 40, w: 300, r: 2.5, z: 1 },
    { cut: "blockLunch", x: 0, y: 268, w: 310, r: -4, z: 2, lift: true },
    chip && { chip, x: 20, y: 400, z: 3 },
  ],
  // Task card with its timer + time blocks: time tracking
  tracking: (chip) => [
    { cut: "dayBlocks", x: 310, y: 150, w: 230, r: 3, z: 1 },
    { cut: "taskCard", x: 0, y: 150, w: 340, r: -3, z: 2 },
    { cut: "focusTimer", x: 180, y: 70, w: 250, r: 2, z: 3, lift: true },
    chip && { chip, x: 30, y: 470, z: 4 },
  ],
};

// --- Topics: first `slug` match wins, then first `tags` match; else daily planning. -------
// `looks` rotate through the topic's posts: [composition, chip, extra].

const TOPICS = [
  {
    id: "open-source",
    eyebrow: "Open source",
    slug: /open-source|self-hosted|replace-sunsama/,
    tags: /^(open-source|self-hosted|docker|privacy)$/,
    looks: [["openSource", C.github], ["boardDay", C.anyAgent]],
  },
  { id: "claude", eyebrow: "AI + MCP", slug: /claude/, looks: [["consent", C.claude, "consentClaude"]] },
  { id: "chatgpt", eyebrow: "AI + MCP", slug: /chatgpt/, looks: [["consent", C.chatgpt, "consentChatgpt"]] },
  { id: "mcp", eyebrow: "AI + MCP", slug: /mcp/, tags: /^mcp$/, looks: [["mcp", C.claude, C.anyMcp]] },
  {
    id: "ai",
    eyebrow: "AI planning",
    slug: /-ai$|with-ai|ai-time/,
    tags: /^(ai|claude|chatgpt)$/,
    looks: [["dragBlock", C.claude], ["week", C.chatgpt]],
  },
  {
    id: "ai-scheduling",
    eyebrow: "AI scheduling",
    slug: /motion|reclaim|akiflow/,
    tags: /^ai-scheduling$/,
    looks: [["week", C.claude], ["dragBlock", C.chatgpt], ["boardDay", C.claude]],
  },
  {
    id: "calendar",
    eyebrow: "Calendar",
    slug: /fantastical|google-calendar|notion-calendar|cron|morgen|calendly|structured|calendar-apps/,
    tags: /^calendar$/,
    looks: [["week", C.calendars], ["dragBlock", C.calendars]],
  },
  {
    id: "mobile",
    eyebrow: "Daily planning",
    slug: /students|remote|working-from-home/,
    tags: /^(remote-work|wfh|students)$/,
    looks: [["mobile", C.devices], ["mobile", C.quickAdd]],
  },
  {
    id: "wellness",
    eyebrow: "Work-life balance",
    slug: /burnout|work-life|tired|energy|working-late|say-no|overwhelm|feel-behind/,
    tags: /^(burnout|wellness|work-life-balance|mental-health|energy|overwhelm|boundaries)$/,
    looks: [["balance", C.shutdown], ["boardDay", C.shutdown], ["balance", C.today]],
  },
  {
    id: "habits",
    eyebrow: "Routines",
    slug: /habit|routine|morning|evening/,
    tags: /^(habits|routine|morning-routine|evening-routine)$/,
    looks: [["week", C.repeat], ["priorities", C.rolled], ["balance", C.shutdown]],
  },
  {
    id: "focus",
    eyebrow: "Focus",
    slug: /focus|deep-work|pomodoro|single-tasking|procrastinat|adhd|minimalism|start-tasks|motivat|self-discipline|unproductive/,
    tags: /^(focus|deep-work|deep-focus|pomodoro|procrastination|concentration|adhd|motivation|single-tasking)$/,
    looks: [["focus", C.space], ["focus", C.subtasks], ["tracking", null]],
  },
  {
    id: "tracking",
    eyebrow: "Time tracking",
    slug: /track|clockify|toggl|freelancer|consultant|lawyer/,
    tags: /^(time-tracking)$/,
    looks: [["tracking", null], ["tracking", C.today]],
  },
  {
    id: "ideas",
    eyebrow: "Ideas",
    slug: /second-brain|obsidian|notion|forgetting|creatives|writers/,
    tags: /^(second-brain|knowledge-management|notes|memory)$/,
    looks: [["ideas", C.someday], ["ideas", C.cmdkIdeas]],
  },
  {
    id: "organize",
    eyebrow: "Organization",
    slug: /organized|gtd|multiple-projects|weekly-review|work-management|product-managers/,
    tags: /^(organization|gtd|project-management|work-management|weekly-review)$/,
    looks: [["palette", C.cmdk], ["task", C.rolled]],
  },
  {
    id: "priorities",
    eyebrow: "Prioritization",
    slug: /priorit|eisenhower|80-20|goal/,
    tags: /^(prioritization|goals|goal-setting|pareto|eisenhower-matrix)$/,
    looks: [["priorities", C.rolled], ["task", C.rolled]],
  },
  {
    id: "time-blocking",
    eyebrow: "Time blocking",
    slug: /time-blocking|schedul|maker|meetings|time-management|daily-schedule/,
    tags: /^(time-blocking|scheduling|time-management|calendar|meetings)$/,
    looks: [["dragBlock", null], ["week", C.claude], ["dragBlock", C.rolled]],
  },
  {
    id: "compare",
    eyebrow: "Comparison",
    slug: /-vs-|alternatives|review|migration/,
    tags: /^(comparison|alternatives|migration|review)$/,
    looks: [["boardDay", C.anyAgent], ["boardDay", C.claude], ["dragBlock", C.anyAgent], ["task", C.anyAgent]],
  },
  {
    id: "tasks",
    eyebrow: "Tasks",
    slug: /task|to-do|todo|work-habits/,
    tags: /^(task-management|to-do-list|to-do-lists)$/,
    looks: [["task", C.rolled], ["priorities", C.rolled]],
  },
  {
    id: "planning",
    eyebrow: "Daily planning",
    slug: /./,
    looks: [["boardDay", C.today], ["dragBlock", C.claude], ["boardDay", C.rolled], ["week", C.today]],
  },
];

/**
 * Hand-picked looks for the posts that bring the most search traffic and the ones
 * written on this branch: [composition, chip, extra, flip].
 */
const OVERRIDES = {
  "best-open-source-productivity-apps": ["openSource", C.github],
  "best-calendar-apps-time-blocking": ["week", C.calendars],
  "best-free-sunsama-alternatives": ["boardDay", C.anyAgent],
  "best-time-management-apps-students": ["mobile", C.devices],
  "best-pomodoro-apps-task-management": ["focus", C.space],
  "best-productivity-apps-creatives": ["ideas", C.someday],
  "structured-vs-sunsama": ["dragBlock", C.calendars],
  "things-3-vs-sunsama": ["task", C.quickAdd],
  "best-focus-apps-deep-work": ["focus", C.subtasks, null, true],
  "best-task-management-apps-freelancers": ["tracking", null],
  "best-productivity-apps-entrepreneurs": ["boardDay", C.claude, null, true],
  "what-is-a-routine": ["week", C.repeat],
  "what-is-goal-setting": ["priorities", C.rolled],
  "what-is-prioritization": ["priorities", C.today, null, true],
  "sunsama-mcp": ["consent", C.claude, "consentClaude"],
  "best-task-managers-with-mcp": ["mcp", C.claude, C.anyMcp],
  "time-blocking-with-ai": ["dragBlock", C.claude],
  "plan-your-day-with-claude": ["consent", C.claude, "consentClaude", true],
  "plan-your-day-with-chatgpt": ["consent", C.chatgpt, "consentChatgpt"],
  "what-is-time-blocking": ["dragBlock", null, null, true],
  "akiflow-alternatives": ["boardDay", C.claude],
  "motion-alternatives": ["week", C.claude],
  "reclaim-ai-alternatives": ["dragBlock", C.chatgpt, null, true],
  "sunsama-review": ["boardDay", C.rolled, null, true],
  "motion-vs-sunsama": ["week", C.claude, null, true],
  "akiflow-vs-sunsama-vs-motion": ["dragBlock", C.claude],
  "open-source-todoist-alternatives": ["task", C.github],
  "self-hosted-productivity-apps": ["openSource", C.github, null, true],
};

function topicFor(post) {
  const tags = post.tags.map((t) => t.toLowerCase());
  return (
    TOPICS.find((t) => t.slug?.test(post.slug)) ??
    TOPICS.find((t) => t.tags && tags.some((tag) => t.tags.test(tag))) ??
    TOPICS.at(-1)
  );
}

function eyebrowFor(post, topic) {
  if (/-vs-/.test(post.slug)) return "Comparison";
  if (/alternatives/.test(post.slug)) return "Alternatives";
  if (/migration|replace-/.test(post.slug)) return "Switching guide";
  if (/^[a-z0-9]+-review$/.test(post.slug)) return "Review";
  return topic.eyebrow;
}

/** Each post's look: its override, else the next look of its topic (mirrored every other lap). */
function planCovers(posts) {
  const seen = {};
  return posts.map((post) => {
    const topic = topicFor(post);
    const i = (seen[topic.id] = (seen[topic.id] ?? -1) + 1);
    const lap = Math.floor(i / topic.looks.length);
    const [comp, chip, extra, flip] = OVERRIDES[post.slug] ?? [...topic.looks[i % topic.looks.length], lap % 2 === 1];
    return {
      post,
      topic,
      comp,
      flip: Boolean(flip),
      items: COMPOSITIONS[comp](chip, extra ?? undefined).filter(Boolean),
      eyebrow: eyebrowFor(post, topic),
      headline: HEADLINES[post.slug] ?? autoHeadline(post.title),
    };
  });
}

// --- Posts -------------------------------------------------------------------------------

/** Same reader as scripts/blog-content.ts: frontmatter is `export const frontmatter = {...};`. */
function readPosts() {
  return readdirSync(BLOG_DIR)
    .filter((slug) => existsSync(path.join(BLOG_DIR, slug, "index.mdx")))
    .sort()
    .map((slug) => {
      const source = readFileSync(path.join(BLOG_DIR, slug, "index.mdx"), "utf-8");
      const match = source.match(/export const frontmatter = (\{[\s\S]*?\n\});/);
      if (!match) throw new Error(`No frontmatter export in ${slug}`);
      const fm = new Function(`return (${match[1]});`)();
      return { slug, title: fm.title, tags: fm.tags ?? [] };
    });
}

// --- HTML --------------------------------------------------------------------------------

const ICONS = {
  sparkles:
    '<path d="M9.94 14.06 8.5 20l-1.44-5.94L1 12.5l6.06-1.56L8.5 5l1.44 5.94L16 12.5z"/><path d="M19 3v4M21 5h-4M18 16v3M19.5 17.5h-3"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  github:
    '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
};

const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function chipHtml(chip, style) {
  const attr = `class="chip${chip.kind === "kbd" ? " kbd" : ""}" style="${style}"`;
  if (chip.kind === "kbd") return `<div ${attr}><kbd>${esc(chip.keys)}</kbd><b>${esc(chip.text)}</b></div>`;
  const ico = chip.kind === "ai" ? "sparkles" : chip.icon;
  return `<div ${attr}><span class="ico">${icon(ico)}</span><span><b>${esc(chip.title)}</b><small>${esc(chip.sub)}</small></span></div>`;
}

// A code snippet, rendered as text: the real commands from the README and docker-compose.yml.
const TERMINAL = `<div class="term"><div class="term-bar"><i></i><i></i><i></i><span>open-sunsama</span></div><pre><span class="p">$</span> git clone github.com/ShadowWalker2014/open-sunsama
<span class="p">$</span> docker compose up -d --build
<span class="ok">✔</span> Container open-sunsama-postgres-1  <span class="ok">Started</span>
<span class="ok">✔</span> Container open-sunsama-api-1       <span class="ok">Started</span>
<span class="ok">✔</span> Container open-sunsama-web-1       <span class="ok">Started</span></pre></div>`;

/** [accent] words get the brand gradient; accents up to 18 characters never break across lines. */
const headlineHtml = (text) =>
  esc(text).replace(/\[([^\]]+)\]/g, (_, a) => `<span class="accent${a.length <= 18 ? " keep" : ""}">${a}</span>`);

const STAGE_X = 580;
const STAGE_W = 560;

function itemHtml(item, flip, cuts, dy) {
  const top = item.y + dy;
  if (item.chip) {
    // Chips anchor to the side they sit on, so a mirrored cover mirrors them too.
    const side = flip ? `right:${1200 - STAGE_X - STAGE_W + item.x}px` : `left:${STAGE_X + item.x}px`;
    return chipHtml(item.chip, `z-index:${item.z};top:${top}px;${side}`);
  }
  const x = flip ? STAGE_W - item.x - item.w : item.x;
  const r = flip ? -(item.r ?? 0) : item.r ?? 0;
  const style = `z-index:${item.z};top:${top}px;left:${STAGE_X + x}px;width:${item.w}px;transform:rotate(${r}deg)`;
  if (item.terminal) return `<div class="piece" style="${style}">${TERMINAL}</div>`;
  if (item.phone) return `<div class="piece phone" style="${style}"><img src="${pathToFileURL(cuts.mobile).href}"></div>`;
  const { w, h } = cutSize(item.cut);
  return `<div class="piece card${item.lift ? " lift" : ""}" style="${style};aspect-ratio:${w}/${h}"><img src="${pathToFileURL(cuts[item.cut]).href}"></div>`;
}

function css(t, H) {
  const face = (weight, file) => {
    const mono = file.startsWith("GeistMono");
    return `@font-face{font-family:${mono ? "GeistMono" : "Geist"};font-weight:${weight};src:url(https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/${mono ? "geist-mono" : "geist-sans"}/${file}.woff2)}`;
  };
  return `
  ${face(500, "Geist-Medium")}${face(600, "Geist-SemiBold")}${face(500, "GeistMono-Medium")}
  *{box-sizing:border-box;margin:0}
  html,body{background:${t.bg};font-family:Geist,system-ui,sans-serif;color:${t.fg};-webkit-font-smoothing:antialiased}
  .canvas{position:relative;width:1200px;height:${H}px;overflow:hidden;background:${t.mesh.join(",")},${t.bg}}
  .dots{position:absolute;inset:0;background-image:radial-gradient(circle,${t.dots} 1.1px,transparent 1.5px);background-size:20px 20px;
    -webkit-mask-image:radial-gradient(70% 90% at 78% 50%,#000 10%,transparent 75%)}
  .brand{position:absolute;left:72px;top:48px;display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600;letter-spacing:-.01em}
  .brand img{width:28px;height:28px;border-radius:8px;box-shadow:0 4px 12px -4px rgb(${t.rgb} / .5)}
  .copy{position:absolute;left:72px;top:96px;bottom:56px;width:476px;display:flex;flex-direction:column;justify-content:center}
  .eyebrow{display:flex;align-items:center;gap:9px;margin-bottom:20px;font-size:14px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:${t.primary}}
  .eyebrow::before{content:"";width:18px;height:2px;border-radius:2px;background:${t.primary}}
  .headline{font-size:64px;font-weight:600;line-height:1.02;letter-spacing:-.04em;text-wrap:balance}
  .keep{white-space:nowrap}
  .accent{background:linear-gradient(120deg,${t.accentFrom},${t.accentTo});-webkit-background-clip:text;background-clip:text;color:transparent;padding-bottom:.06em}
  .site{position:absolute;left:72px;bottom:44px;font-size:16px;font-weight:500;color:${t.muted}}
  .piece{position:absolute;transform-origin:center}
  .card{border-radius:14px;overflow:hidden;background:${t.bg};box-shadow:0 0 0 1px ${t.cardBorder},${t.cardShadow}}
  .card img,.phone img{display:block;width:100%;height:100%}
  .lift{box-shadow:0 0 0 1.5px rgb(${t.rgb} / .55),${t.liftShadow}}
  .phone{padding:9px;border-radius:40px;background:#101216;box-shadow:0 0 0 1px rgb(255 255 255 / .12) inset,${t.cardShadow}}
  .phone img{border-radius:31px}
  .term{border-radius:14px;overflow:hidden;background:#0f1117;box-shadow:0 0 0 1px rgb(255 255 255 / .08),${t.cardShadow};color:#e6e8ee}
  .term-bar{display:flex;align-items:center;gap:6px;height:30px;padding:0 12px;background:#171a21;border-bottom:1px solid rgb(255 255 255 / .06)}
  .term-bar i{width:10px;height:10px;border-radius:50%}
  .term-bar i:nth-child(1){background:#ff5f57}.term-bar i:nth-child(2){background:#febc2e}.term-bar i:nth-child(3){background:#28c840}
  .term-bar span{margin:0 auto;font-size:11px;color:#8b91a0;transform:translateX(-18px)}
  .term pre{padding:14px 16px 16px;font-family:GeistMono,ui-monospace,monospace;font-size:11px;line-height:1.75;white-space:pre;overflow:hidden}
  .term .p{color:${THEMES.dark.primary}}.term .ok{color:#34d399}
  .chip{position:absolute;display:flex;align-items:center;gap:11px;padding:10px 17px 10px 11px;border-radius:15px;background:${t.chipBg};box-shadow:0 0 0 1px ${t.chipBorder},${t.chipShadow};white-space:nowrap}
  .chip b{display:block;font-size:15.5px;font-weight:600;line-height:1.25;letter-spacing:-.01em;color:${t.fg}}
  .chip small{display:block;margin-top:2px;font-size:13px;line-height:1.25;color:${t.muted}}
  .chip .ico{display:flex;align-items:center;justify-content:center;flex:none;width:32px;height:32px;border-radius:50%;background:rgb(${t.rgb} / .15);color:${t.primary}}
  .chip .ico svg{width:17px;height:17px}
  .chip.kbd{padding:11px 17px 11px 11px}
  kbd{display:inline-flex;align-items:center;height:28px;padding:0 9px;border-radius:7px;font-family:Geist,system-ui;font-size:14.5px;font-weight:600;color:${t.primary};background:rgb(${t.rgb} / .12);box-shadow:inset 0 0 0 1px rgb(${t.rgb} / .3)}
  `;
}

function pageHtml(plan, theme, cuts, kind) {
  const og = kind === "og";
  const H = og ? 630 : 600;
  const items = plan.items.map((item) => itemHtml(item, plan.flip, cuts, og ? 15 : 0)).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(THEMES[theme], H)}</style></head><body>
  <div class="canvas"><div class="dots"></div>
    <div class="brand"><img src="${pathToFileURL(path.join(PUBLIC, "open-sunsama-logo.png")).href}">Open Sunsama</div>
    <div class="copy"${og ? ' style="bottom:84px"' : ""}><div class="eyebrow">${esc(plan.eyebrow)}</div><h1 class="headline">${headlineHtml(plan.headline)}</h1></div>
    ${og ? '<div class="site">opensunsama.com/blog</div>' : ""}
    ${items}
  </div></body></html>`;
}

// --- Render ------------------------------------------------------------------------------

async function encode(png, file, kind) {
  const limit = (kind === "og" ? MAX_OG_KB : MAX_COVER_KB) * 1024;
  let buf;
  for (const q of kind === "og" ? [85, 80, 75, 70] : [82, 78, 74, 70, 66]) {
    buf =
      kind === "og"
        ? await sharp(png).resize(1200, 630, { kernel: "lanczos3" }).jpeg({ quality: q, mozjpeg: true }).toBuffer()
        : await sharp(png).webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
    if (buf.length <= limit) break;
  }
  writeFileSync(file, buf);
  return buf.length;
}

/** In-page: fit the headline (3 lines on covers, 4 on social cards) and check the safe area. */
function fitAndCheck(og) {
  const h1 = document.querySelector(".headline");
  const maxLines = og ? 4 : 3;
  let size = og ? 68 : 64;
  const fits = () => h1.getBoundingClientRect().height <= maxLines * size * 1.06 && h1.scrollWidth <= h1.clientWidth + 1;
  h1.style.fontSize = `${size}px`;
  while (size > 38 && !fits()) h1.style.fontSize = `${(size -= 2)}px`;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const safe = (r) => r.left >= 70 && r.right <= W - 40 && r.top >= 30 && r.bottom <= H - 30;
  const unsafe = [...document.querySelectorAll(".chip, .copy .headline, .brand")].filter((el) => !safe(el.getBoundingClientRect())).length;
  const text = document.querySelector(".headline").getBoundingClientRect();
  const covered = [...document.querySelectorAll(".piece, .chip")].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.left < text.right - 4 && r.right > text.left && r.top < text.bottom && r.bottom > text.top;
  }).length;
  return { size, unsafe, covered };
}

async function main() {
  const args = process.argv.slice(2);
  const only = new Set(args.filter((a) => !a.startsWith("--")));
  const posts = readPosts();
  const unknown = [...only].filter((s) => !posts.some((p) => p.slug === s));
  if (unknown.length) throw new Error(`No post folder for: ${unknown.join(", ")}`);
  const plans = planCovers(posts).filter((p) => !only.size || only.has(p.post.slug));

  if (args.includes("--list")) {
    for (const p of plans) {
      console.log(`${p.post.slug.padEnd(40)} ${p.topic.id.padEnd(14)} ${(p.comp + (p.flip ? "*" : "")).padEnd(11)} ${p.headline}`);
    }
    return;
  }

  const shots = loadShots();
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CUT_DIR, { recursive: true });
  const needed = new Set(plans.flatMap((p) => p.items.flatMap((i) => (i.cut ? [i.cut] : i.phone ? ["mobile"] : []))));
  const cuts = { light: {}, dark: {} };
  for (const theme of ["light", "dark"]) {
    for (const name of needed) cuts[theme][name] = await extractCut(name, theme, shots);
  }

  const browser = await chromium.launch();
  const page = async (height) => browser.newPage({ viewport: { width: 1200, height }, deviceScaleFactor: 2 });
  const pages = { "light-cover": await page(600), "dark-cover": await page(600), "light-og": await page(630) };
  const tmp = path.join(tmpdir(), `blog-cover-${process.pid}.html`);
  let total = 0;
  let count = 0;
  const warnings = [];

  for (const plan of plans) {
    const jobs = [
      ["light", "cover", `blog-${plan.post.slug}.webp`],
      ["dark", "cover", `blog-${plan.post.slug}-dark.webp`],
      ["light", "og", `blog-${plan.post.slug}-og.jpg`],
    ].filter(([theme, kind]) => ONLY.has(kind === "og" ? "og" : theme));
    for (const [theme, kind, name] of jobs) {
      const p = pages[`${theme}-${kind}`];
      writeFileSync(tmp, pageHtml(plan, theme, cuts[theme], kind));
      await p.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
      await p.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]));
      const check = await p.evaluate(fitAndCheck, kind === "og");
      if (check.unsafe) warnings.push(`${name}: ${check.unsafe} element(s) outside the 6% safe area`);
      if (check.covered) warnings.push(`${name}: product covers the headline`);
      const bytes = await encode(await p.screenshot({ type: "png" }), path.join(OUT, name), kind);
      total += bytes;
      count++;
      const limit = kind === "og" ? MAX_OG_KB : MAX_COVER_KB;
      if (bytes > limit * 1024) warnings.push(`${name}: ${Math.round(bytes / 1024)} KB (over ${limit} KB)`);
    }
    process.stdout.write(`\r${count} files`);
  }
  await browser.close();
  console.log(`\nWrote ${count} files, ${(total / 1024 / 1024).toFixed(1)} MB total, to ${path.relative(process.cwd(), OUT) || "."}`);
  for (const w of warnings) console.warn(`warning: ${w}`);
}

await main();
