# Marketing kit

Every public page (features, compare, personas, download, legal, docs) uses the same shell and parts as the home page. The reference page is `/features/time-blocking`:

- Copy and data: `src/content/marketing/features/time-blocking.ts`
- Page: `src/routes/features/time-blocking.tsx` (one line: `<MarketingPageView page={page} />`)

## The parts

| Part | What it is |
| --- | --- |
| `MarketingLayout` | Skip link, `SiteHeader`, `<main id="main">`, grid-and-glow backdrop, `SiteFooter`. Use it for every public page. |
| `SiteHeader` / `SiteFooter` | The one header and footer. Below `lg` the header links move into a menu sheet. Docs passes `leading` and `section`. |
| `PageHero` | Eyebrow pill, h1 with the orange accent, one-line answer, "Get started" + tour video buttons, "Control it from" chips, and a real clip in the browser frame with the sunrise glow. |
| `Breadcrumbs` | Visible trail plus BreadcrumbList JSON-LD. |
| `AnswerBlock` | The direct answer under the hero, with a key-points card. AI answers quote this. |
| `StoryPinned` | The home page's pinned scroll walk-through: the frame stays put while each step's clip plays. Stacks on phones. |
| `MediaRows` / `MediaRow` | Text beside a real `Clip` or `Shot`, alternating sides. |
| `AgentPanel` | "Any AI agent can do this": MCP URL with copy, prompts, tools, the AI video and a clip. |
| `BenefitGrid` | The home page's hairline feature grid. |
| `ComparisonTable` | Open Sunsama in the first, highlighted column. Yes / partly / no marks with text. Scrolls sideways on phones with the feature column pinned. |
| `Steps` | Numbered how-to (start, switch). |
| `StatsStrip` | True numbers only: 24 MCP tools, 3 desktop apps, 1 URL for any agent, live GitHub stars. |
| `FaqSection` | Visible Q&A plus FAQPage JSON-LD from the same text. |
| `RelatedLinks` | Cards to features, compare pages, persona pages, guides and docs. |
| `CtaBand` | The home page's dark band with a real product screenshot. |
| `MarketingPageView` | All of the above, in order, from one content module. |

Tokens (`tokens.ts`) hold the shared class strings (`SECTION`, `H2`, `EYEBROW`, `PRIMARY_CTA`, `SUNRISE_GLOW` …). Use them; don't invent new sizes or colors.

## The content-module pattern

1. Put the page's words in `src/content/marketing/<group>/<page>.ts`, default-exporting `defineMarketingPage({...})` (types in `src/content/marketing/types.ts`). Pure data: no React, no CSS, no `@/` imports.
2. Text fields take two bits of markup: `[label](/path)` for links and `**bold**`.
3. Sections are an ordered list of `answer`, `story`, `media-rows`, `agent`, `benefits`, `comparison`, `stats`, `steps` or `custom`. A `custom` section is drawn by the page (`<MarketingPageView page={page} slots={{ "my-id": <MyBlock /> }} />`), but its heading and body still go into the prerendered HTML.
4. The page renders from the module: `<MarketingPageView page={page} />`, or compose the parts yourself with `<MarketingLayout>`, `<MarketingSeo page={page} />` and `<SectionRenderer>`.
5. `bun run build` finds every module automatically. `scripts/prerender-marketing.ts` validates it (`src/content/marketing/validate.ts`), then writes `dist/<path>.html` with meta tags, JSON-LD (BreadcrumbList, FAQPage, SoftwareApplication, VideoObject) and the page text in `<noscript>`. `scripts/generate-sitemap.ts` adds the path to the sitemap. `server.ts` serves the file for nested paths like `/for/adhd`.
6. When a page moves to a module, delete its entry in `SEO_CONFIGS` (`src/hooks/useSEO.ts`).

## Checklist before a page ships

**Copy** (read `.skills/seo-content/playbook.md` first)
- [ ] Grade-6 words. Paragraphs of 1-3 short sentences. Active voice, "you".
- [ ] Every heading states what IS ("Your meetings and your time blocks share one calendar"), never a topic or a denial.
- [ ] No hype words, no "free", no price selling. Lead with features, open source and AI native (any agent).
- [ ] Open Sunsama is the #1 pick: first in the direct answer, first column of every table, "What is the best X?" FAQ answered with Open Sunsama first.
- [ ] Honest about competitors and our gaps: no iOS or Android app (phones use the mobile web app), no auto-scheduler, calendar events are read-only over MCP, no task integrations, non-commercial license (never MIT, GPL or OSI).
- [ ] Only true numbers. No testimonials, logos, ratings or user counts.
- [ ] Competitor facts come from their site or docs, with sources and the month checked in `sources`.

**Media**
- [ ] Real recordings only: clip and shot ids from `src/lib/blog-media.json`. The validator fails the build on unknown ids.
- [ ] Hero uses the clip that proves the page's main claim. 2-4 more clips or shots further down.
- [ ] `alt` says what the media shows; `caption` is one short sentence.

**SEO and AEO**
- [ ] `seo.title` 30-60 characters with the main query first; `seo.description` 140-160 characters.
- [ ] The h1 and the first `answer` paragraph contain the exact query.
- [ ] 5-8 FAQs from real searches, plain-text answers of 1-3 sentences.
- [ ] 6-9 related links: other features, `/alternative/*`, persona pages and blog posts.
- [ ] `bun run build`, then check `dist/<path>.html` has the `<noscript>` text and JSON-LD.

**Conversion**
- [ ] "Get started" → `/register` in the hero and the CTA band. The second button plays a video or goes to docs, never a dead end.
- [ ] Every section ends somewhere useful: a link to the feature, docs or download.

**QA**
- [ ] `bun run typecheck` and lint on your files.
- [ ] `cd apps/web && OUT_DIR=/tmp/qa node scripts/qa-blog.mjs /your/path` passes at 375, 768 and 1280 in light and dark (CLS < 0.1, no sideways scroll, no console errors besides the GitHub star-count rate limit). Look at the screenshots, and check 1440 too.
- [ ] Tab through the page: every link and button shows a focus ring. With reduced motion on, clips show posters and nothing animates.
