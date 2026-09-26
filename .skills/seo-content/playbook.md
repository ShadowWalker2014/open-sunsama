# Open Sunsama content playbook

Read this fully before writing. These rules are hard: every post ships only when it meets all of them.

Posts live at `apps/web/src/content/blog/<slug>/index.mdx`. Look at two recent posts for the file format (for example `sunsama-mcp` and `best-free-sunsama-alternatives`).

Research inputs:
- [personas.md](personas.md): who reads us, their pains, and their exact words (research from 24 Sep 2026; refresh when it feels stale).
- This run's traffic, SERP, AI Overview and volume notes (SKILL.md steps 1-3).

---

## 1. Positioning (hard)

- **Open Sunsama is the #1 overall recommendation** in every list, "alternatives", "best X" and comparison post. See section 5, item 8, for exactly how.
- **Never sell on price or "free".** Keep "free" out of titles and descriptions, and never call Open Sunsama "the free option". Lead with features, open source, and AI native: it works with any agent (Claude, ChatGPT, Cursor, anything that speaks MCP).
- Competitor prices may appear as plain facts inside a comparison table, with the month and year you checked them.
- Be accurate about competitors. Say who each one suits. Never invent weaknesses or hide true strengths.
- Our real edges over Sunsama and the rest: public code you can read and change (your agent can even extend the planner), self-hosting, a documented public REST API with API keys, your data stays yours, desktop apps for Mac, Windows and Linux, and keyboard-first speed.
- Top pains to answer, in the readers' words: "too expensive for a to-do app" (answer with ownership and control, not with "free"), "too many tools and tabs" ("all in one place"), weak mobile apps, missing integrations (Outlook, several Google accounts), no API or agent access, overplanning ("a wall of stuff"), auto-schedulers that feel like a black box, setup so heavy people quit in 2 weeks, and "the daily ritual became a 20-minute chore".
- Reader phrases to reuse: "calm, realistic day", "plan my day", "roll over", "brain dump", "get back on track", "planned vs actual", "all in one place", "keep my data to myself", "full control", "agent friendly".

## 2. Honesty (hard)

- **Never claim hands-on testing of other apps** ("we tested", "we used each app for a week", "in our testing") unless someone really did it. Never put "Tested" in a title.
- The method section is called "How we compared". State the real method: we checked each app's website, pricing page, help docs, changelog and MCP or API docs (give the month and year), read user reviews and Reddit / Hacker News / Product Hunt threads, and we build and use Open Sunsama every day.
- Example days ("a typical Tuesday in Motion") are framed as examples based on each app's described flow, never as measurements.
- Verify every competitor fact at the source (`mcp__blink-cms-mcp__web_search`, `fetch_url`) or leave it out. Say "we found only community-built servers" rather than "there is no official server" when you can't prove a negative.
- Every post that ranks Open Sunsama first carries this disclosure once, near the top: "We build Open Sunsama, so we put it first — here is why, and where others fit better." In how-to posts that lead with another product, say "so we recommend it at the end" instead.

## 3. Facts

### Open Sunsama (only claim these)
- Code on GitHub: https://github.com/ShadowWalker2014/open-sunsama. Self-host with Docker: /docs/self-hosting/docker.
- **License:** the "Open Sunsama Non-Commercial License", not an OSI license like MIT or GPL. Keep the brand line "open-source daily planner", but in any post about open source, self-hosting or licenses, and in one FAQ there, say plainly: "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license." Never call it MIT, GPL or OSI-approved.
- Daily planning on a kanban board of days (Today, Tomorrow, backlog). Drag tasks between days.
- Time blocking: drag tasks onto the calendar and resize blocks, in day and week views. (In week view only external calendar events can be dragged today.)
- Calendar sync: Google Calendar, Outlook, iCloud.
- Focus mode with a timer. Subtasks, rich notes, file attachments, priorities P0-P3.
- Command palette (Cmd+K) and keyboard-first navigation.
- Ideas boards: someday/maybe boards with columns and cards.
- Unfinished tasks roll over to the next day (set in Settings). Recurring tasks. Estimated vs actual time, tracked by the focus timer ("planned vs actual"). Reminders and notifications. Real-time sync across devices.
- **Apps: web, plus desktop for Mac, Windows and Linux (/download).** There is NO iOS or Android app. On phones, Open Sunsama runs as a mobile-friendly web app in the browser. Never claim App Store or Play Store apps.
- **AI native:** a hosted MCP server at https://api.opensunsama.com/mcp with OAuth sign-in. It works in Claude (claude.ai, Claude Desktop, Claude Code), ChatGPT, Cursor and any MCP client. 24 tools cover tasks, subtasks, time blocks (with estimate and actual minutes), read-only calendar events from connected Google, Outlook and iCloud calendars (title, time, calendar, location; never attendees or descriptions), the schedule for a day (meetings and time blocks together), and the user profile. There is also a public REST API with API keys.
- **Known gaps (say them when relevant, don't hide them):** calendar events are read-only over MCP (the AI can't create or move meetings). There are no built-in task integrations (Slack, Asana, Jira and so on), no Todoist or Sunsama importer, no auto-scheduler, and no guided planning ritual. The prebuilt desktop app can't point at a self-hosted server.
- Doc links: /docs/mcp/overview, /docs/mcp/claude, /docs/mcp/chatgpt, /docs/mcp/cursor, /docs/mcp/claude-desktop, /docs/mcp/local-server, /docs/api/authentication (there is no /docs/api index page), /docs/self-hosting/docker.

### The market (checked September 2026; re-check every run)
- Sunsama HAS an official MCP server and an AI assistant ("Sunny"), both out of beta since August 2026, included in Pro. It is listed in ChatGPT's plugin directory. Sunsama has NO public REST API; the request has been open on its roadmap since December 2019. Never claim Sunsama lacks MCP or AI.
- Most rivals now ship MCP servers: Todoist (official, https://ai.todoist.net/mcp), Akiflow (since June 2026), Reclaim, TickTick, FlowSavvy (Pro), Ellie (beta), Routine (local only). Google has an official Calendar MCP in developer preview. MCP alone is no longer our edge; ownership is.
- Dropbox acquired Reclaim.ai in August 2024. Clockwise shut down on 27 March 2026.
- ChatGPT calls connectors "Plugins" (chatgpt.com/plugins). Custom MCP connectors need developer mode on Plus, Pro, Business, Enterprise or Edu, on the web. Claude custom connectors work on every plan (Free gets one).

## 4. Writing (hard, checked by script)

- Paragraphs of 1-3 sentences. Never more.
- Simple sentences, one idea each. Most under 15 words; none over 25.
- Grade 6 words. Exceptions: product names and the terms readers search with (time blocking, timeboxing, MCP, self-hosted, kanban, daily planning, shutdown ritual).
- Active voice. Talk to the reader as "you". No filler and no hype: "revolutionary", "game-changer", "seamless", "leverage", "robust", "unlock", "elevate", "in today's fast-paced world".
- Headings state what IS: the answer or the claim, not a topic ("Is Sunsama worth it in 2026?" answered right under it).
- Gate: `cd apps/web && bun run scripts/check-blog-readability.ts <slug>` must print PASS. Loop until it does, then re-read the whole post as a busy reader and fix anything choppy, vague, repetitive or salesy. Run the gate again.

## 5. Structure (SEO + AEO)

1. **Title:** main query first, then a number and "2026" for lists. 50-65 characters. Example: "9 Best Time Blocking Apps in 2026: AI Schedulers vs Planners".
2. **Description:** 140-160 characters, with the query and the payoff.
3. **Direct answer first.** The first 2-3 sentences answer the query and name Open Sunsama as the pick, with one line on why. This is what AI Overviews quote.
4. **Key takeaways** (or "Quick answer") as a bullet list right after the intro. The page styles this list as a card.
5. **A comparison table early**, with Open Sunsama in the first row and the columns readers care about.
6. **"How we compared"**, following section 2.
7. **One H2 per app or step.** Each app gets the same blocks in the same order: one-line verdict, "Best for", what it does well, where it falls short, "Pick it if…".
8. **Open Sunsama is #1:** named first in the direct answer and the key takeaways, #1 in the list with the "Best overall" label (no other app gets that label), first row of every table, the strongest media in its section (a DemoVideo plus clips), and the lead of the decision section ("For most people: Open Sunsama."). In "X vs Y" posts, give the fair X-vs-Y verdict, then an "Our pick: Open Sunsama" block right after it, and make it the recommended pick in the decision section. In reviews and how-tos, recommend it clearly in the verdict and at the end.
9. **"Which one should you pick?"** decision section: "For most people: Open Sunsama", then "If X, pick Y" lines for the others.
10. **FAQs:** 5-8 real questions from People Also Ask and related searches, in frontmatter `faqs` only (the page renders them and adds FAQPage schema). Answers are plain text, 1-3 sentences. Include a "What is the best X?" FAQ that answers Open Sunsama first. Never also write an FAQ section in the body.
11. **Internal links:** 3-6 to related posts, /features/*, /docs/*, /download and /alternative/*. External links to each app's site and to the sources for facts.
12. **Use the exact query** naturally in the title, first paragraph, one H2 and the description. No stuffing.
13. **Don't write "what is X" dictionary posts** (what is a routine, what is goal setting). They get impressions and almost no clicks. Write for people choosing or using a planner.

## 6. Frontmatter

```js
export const frontmatter = {
  title: "…",
  description: "…",
  date: "2026-09-24",          // first published; keep the original date on updated posts
  updated: "2026-09-24",       // set on every new or meaningfully updated post
  author: "Open Sunsama Team",
  tags: ["…"],                 // the first tag that matches a topic in src/lib/blog-topics.ts sets the post's pill and tab on /blog
  readingTime: 9,
  image: "/blog-<slug>.webp",  // designed cover, see section 7
  faqs: [
    { question: "…?", answer: "1-3 short sentences, plain text." },
  ],
};
```

Updating an existing post: keep the slug and the original `date`, set `updated`, move any body FAQ into `faqs`, and keep the headings and wording that already rank. Change the title only to remove a problem ("Free", "Tested") or add the year.

## 7. Covers (required, never AI art)

- Every cover is a **designed composition** on a canvas, in the style of Linear, Vercel and Stripe blog covers:
  - Brand background: homepage palette (brand orange, warm off-white in light, near-black in dark), soft glow, subtle grid or dots.
  - An eyebrow (topic, e.g. "AI + MCP") and a short punchy headline in the site's display font, with the orange accent on 1-3 key words, plus the small logo mark.
  - 2-4 pieces **cut from real product screenshots** (from `src/lib/blog-media.json` and `public/landing/`), arranged as layered, rounded, shadowed cards that match the topic: a task card, a column of time blocks, the focus timer, the Cmd+K palette, the MCP settings panel, the Claude or ChatGPT consent card, the "Claude connected" chip.
- **Never** AI-generated images, stock photos or drawn fake UI. A code snippet card (e.g. `docker compose up`) is fine.
- Run `cd apps/web && node scripts/generate-blog-covers.mjs <slug>`. It writes `public/blog-<slug>.webp` (2400x1200 light), `public/blog-<slug>-dark.webp` and `public/blog-<slug>-og.jpg` (1200x630, for social previews). Keep key content inside a 6% safe margin; cards show covers at 2:1.
- Set `image: "/blog-<slug>.webp"`, then open all three files and look: sharp text, the right product pieces for the topic, nothing clipped, both themes good.
- If a cover needs a screen with no shot yet, record the shot first (section 8), then make the cover.

## 8. Media (required in every post)

Use these MDX components directly, with no import lines. Put each one **on its own line with a blank line above and below**, or it ends up inside a paragraph.
- `<DemoVideo id="tour" />`: the 69-second narrated product tour. `<DemoVideo id="ai" />`: the 48-second "let Claude or ChatGPT plan your day" video. Use ONE per post, at the top of Open Sunsama's section (or after the intro in how-to posts). Captions are burned into these videos, so the page's caption track stays off by default. Don't turn it on.
- `<Clip id="…" caption="…" />`: a 5-10 second silent looping clip. Use 2-4 per post, each right after the paragraph it proves.
- `<Shot id="…" alt="…" caption="…" />`: a still screenshot. Use 1-3 per post.
- Captions are one short sentence saying what the reader sees ("Drag a task onto the calendar to block time for it.").

Available ids (check `src/lib/blog-media.json` for the current list):
- Clips: `plan-day` (drag tasks from the backlog into Today), `time-block` (drag a task onto the day calendar and resize it), `focus` (start focus mode on a task), `command-palette` (Cmd+K search and jump), `ai-plan` (Claude plans the afternoon over MCP; tasks and time blocks appear live), `shutdown` (check off tasks at the end of the day), `week-plan` (move tasks to other days on the board).
- Shots: `board`, `calendar-week`, `calendar-day`, `task-detail`, `focus`, `command-palette`, `ideas`, `mcp-settings`, `consent-claude`, `consent-chatgpt`, `mobile-tasks` (the mobile web app).
- New media is recorded only on the local demo stack (SKILL.md section 5), never against production.

## 9. Open-source app lists (authority)

Every "best open source X" or "X alternatives" post lists apps as `<OssApp>` cards, never as plain text.
- Cards read `apps/web/src/content/oss-apps.json`: license, stars, latest release, platforms, self-host, API and MCP, pulled from each project's source, plus a real screenshot we captured and its source credit.
- `<OssApp id="vikunja" rank={2} bestFor="…" />` for each ranked app; `<OssTable ids={[...]} />` for the comparison table. Rank order feeds the ItemList JSON-LD.
- Source-code links are followed; website and docs links are nofollow. Don't restate numbers the card shows in prose.
- Before a run that touches these posts: `cd apps/web && node scripts/refresh-oss-apps.mjs` (updates stars, releases, archived status), and read its diff: an app that became archived moves down or out.
- Adding an app: add its entry to the registry (verify every field at the source) and capture a real screenshot into `apps/web/public/oss/<id>.webp` from its demo, web app or official images. Never fabricate UI.
- Only open-source licenses go in "open source" rankings. PLANKA (fair-use license) and Anytype (source-available) are noted, not ranked. Proton and Tuta calendars have closed servers. Focalboard is unmaintained.

## 10. Page quality (hard, checked by QA)

- Every changed page passes `node scripts/qa-blog.mjs` at 375, 768 and 1280 px in light and dark: layout shift below 0.1, no sideways scroll, no broken media, and no console errors other than the GitHub star-count rate limit and the analytics script.
- Look at the screenshots yourself. Tables scroll inside their own box on phones, media shows the right theme, and nothing is blank or clipped.
- `dist/blog/<slug>.html` must contain the article text in `<noscript>` plus BlogPosting and FAQPage JSON-LD, so AI crawlers that don't run JavaScript can read it.

## 11. Length

List and comparison posts: 1,800-2,800 words. How-to guides: 1,200-1,800 words. Every section earns its place; no padding.
