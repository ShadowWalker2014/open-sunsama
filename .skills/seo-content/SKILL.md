# SEO + AEO Content Sprint

How we find what to write, write it, prove it with real product media, check it, and ship it. First run: 24 Sep 2026 (PR "seo/content-sprint"). The weekly routine runs this same process.

Read [playbook.md](playbook.md) before writing a word. It has the hard rules: positioning, license wording, product facts, writing style, page structure, frontmatter, and media components. [personas.md](personas.md) has who reads us and the exact words they use.

---

## Quick Reference

| Step | Tool | Output |
|------|------|--------|
| Traffic | `datafast` CLI, Google Search Console in Chrome | What is rising, what is slipping, what to update |
| Volume | Google Keyword Planner in Chrome (Circo, Inc account) | Monthly search buckets |
| SERP | `mcp__blink-cms-mcp__google_serp` | Top 8 per query, related searches |
| AI answers | Real Google in Chrome | AI Overview text and the sites it cites |
| Teardown | Browser pane | Why the top 3-5 pages rank |
| Write | MDX in `apps/web/src/content/blog/<slug>/index.mdx` | Posts that pass the gate |
| Readability gate | `cd apps/web && bun run scripts/check-blog-readability.ts <slug>` | PASS/FAIL per post |
| Media | `scripts/readme-media/blog-media.mjs` on a local seeded stack | Shots, clips, narrated videos in `apps/web/public/blog-media/` |
| Covers | `cd apps/web && node scripts/generate-blog-covers.mjs <slug>` | Light, dark and social covers from real product screenshots |
| Open-source registry | `cd apps/web && node scripts/refresh-oss-apps.mjs` | Fresh license, stars, releases and status for every app in `oss-apps.json` (playbook section 9) |
| QA | `node apps/web/scripts/qa-blog.mjs <slug...>` | CLS, overflow, console errors, screenshots at 375/768/1280 in light and dark |
| Ship | PR → squash merge to `main` → Railway deploys `web` | Live pages |

---

## 1. Read the traffic

```bash
datafast --json analytics overview --website 6980f5476c3beb852cf00100 --period last30d
datafast --json analytics referrers --website 6980f5476c3beb852cf00100 --period last30d
datafast --json analytics pages --website 6980f5476c3beb852cf00100 --period last30d --referrer Google --limit 30
datafast --json analytics referrers --website 6980f5476c3beb852cf00100 --period last30d --goal signup
```

Search Console (Chrome, logged in): `https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aopensunsama.com&metrics=CLICKS%2CIMPRESSIONS%2CCTR%2CPOSITION&time_granularity=DAY&num_of_months=3`. Set rows per page to 500, then read the table with JS (`table tbody tr` cells). Add `&breakdown=page` for pages and `&breakdown=date` for days. Compare the last 28 days to the 28 before.

Look for:
- **Striking distance:** queries at position 5-20 with real impressions. A better page can reach the top 3.
- **Rising queries** we have no page for.
- **Pages losing clicks or position**, and posts whose `updated` date is over 90 days old but still earn impressions. These are the update candidates.
- **Impressions with no clicks** on "what is X" posts: don't write more of those. The searcher wants a dictionary.
- Signups by referrer: which pages bring people who sign up.

## 2. Pick the work

Start every run with `cd apps/web && node scripts/refresh-oss-apps.mjs` so the open-source cards stay current, and commit the refreshed registry with the run.


- **3 new posts** for the queries with the best mix of volume, intent (people choosing an app), and weak competition (Reddit, small vendor blogs, directories).
- **1-3 updates, 5 at most**: the most important outdated posts (impressions or signups at stake, stale facts, old date on page 1).
- Check `apps/web/src/content/blog/` so a new post doesn't compete with an existing one for the same query. Update the existing post instead.
- Skip price-led queries ("free X", "X pricing") and queries owned by Zapier, PCMag, Wirecutter or app stores.

## 3. Research each query

1. **Volume:** Keyword Planner → "Get search volume and forecasts" → paste the queries → read the rows (the table is virtualised: scroll and collect). It saves a plan in the Ads account; that is harmless.
2. **SERP:** `google_serp` with `num: 10`. Note who ranks, the page type, dates, and related searches.
3. **AI Overview:** open `https://www.google.com/search?q=<query>&hl=en&gl=us` in Chrome. Find the "AI Overview" block and read its text and cited sites. Nearly every commercial answer is a list of "Best for <use case>: <app>" slots. Aim for the slot Open Sunsama truly wins.
4. **Teardown:** open the top 3-5 organic pages in the browser pane. Record words, images, tables, FAQs, schema, the updated date, and the hook. The page must beat all of them on usefulness, proof and clarity.

## 4. Write

Follow [playbook.md](playbook.md). Then loop the readability gate until it prints PASS, re-read the post as a busy reader, fix anything choppy or vague, and run the gate again.

For updated posts: keep the slug and the original `date`, set `updated` to today, move any body FAQ into frontmatter `faqs`, and keep the headings and wording that already rank.

## 5. Media

Every post needs one narrated `<DemoVideo>`, 2-4 `<Clip>`s and 1-3 `<Shot>`s. Reuse ids from `apps/web/src/lib/blog-media.json` when they fit. Record new ones only when a post needs something not there.

Local stack (never record against production, never use Docker): start the `api-demo` (port 3101) and `web-demo` (port 3107) configs from `.claude/launch.json` with `preview_start`. They run `scripts/dev-local.mjs`, which uses the Railway development database, runs migrations on start, and blanks Redis, email, S3 and OAuth secrets so nothing touches production. Then seed and record:

```bash
cd scripts/readme-media
DEMO_API_URL=http://localhost:3101 DEMO_PASSWORD='DemoPass!2026x' DEMO_TODAY=<today> DEMO_RESET=1 bun run seed-demo.ts
node blog-media.mjs   # see its header for options
```

Look at 3 frames of every new clip in both themes before using it. No localhost URLs, no error toasts, no empty states.

### Covers

Covers come from real product screenshots only. Never use AI-generated or stock images.

```bash
cd apps/web && node scripts/generate-blog-covers.mjs <slug> <slug> ...
```

It writes `public/blog-<slug>.webp`, `public/blog-<slug>-dark.webp` and `public/blog-<slug>-og.jpg`. Set `image: "/blog-<slug>.webp"` in each post, then open the files and check them. A post that needs a new screen gets that shot recorded first.

## 6. QA

```bash
cd apps/web && bun run build && bun run typecheck
node scripts/qa-blog.mjs <slug> <slug> ...   # needs the web dev server on :3107
```

Pass bar for every changed page, at 375, 768 and 1280px in light and dark:
- CLS below 0.1, no horizontal scroll, no console errors.
- Media shows in the right theme; nothing broken or blank in the screenshots (open them and look).
- `dist/blog/<slug>.html` contains the article text in `<noscript>` plus BlogPosting and FAQPage JSON-LD.

## 7. Ship

```bash
git checkout -b seo/weekly-<date> && git add -A && git commit
git push -u origin HEAD && gh pr create
gh pr checks --watch --fail-fast   # CI is required; fix any failure before merging
gh pr merge --squash --delete-branch
```

Railway deploys the `web` service from `main` in a few minutes. Confirm each page is live: `curl -s https://opensunsama.com/blog/<slug> | grep -c "<title text>"` and check the `<noscript>` article text is there. The blog is not in the desktop app bundle (`prepare-frontend.mjs` drops `blog-*`), so no desktop release is needed.

## Gotchas

- `apps/api/.env` points at the production database. Only run the API through `api-demo` (or `bun run dev:local`).
- Sunsama, Todoist, Akiflow, Reclaim and others have their own MCP servers now. Our edges are public code, self-hosting, a public REST API, your data, and any agent. Check facts every run; they change monthly.
- MDX media components go on their own line with blank lines around them, or they end up inside a `<p>`.
- The license is non-commercial, not OSI. Use the wording in the playbook.
- Open Sunsama is the #1 overall pick in every list and comparison post, with the disclosure line. Never claim hands-on testing of other apps.
- There is no iOS or Android app. On phones it is a mobile web app.
- Captions are burned into the narrated videos, so the `<track>` stays off by default.
