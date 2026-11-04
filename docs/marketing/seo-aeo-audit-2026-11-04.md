# SEO and answer-engine audit — 4 November 2026

The production baseline is **6.6/10** on the scored dimensions below. This is an editorial assessment supported by observable checks, not a ranking prediction or an industry-standard metric. Unmeasured areas remain unscored. The technical work in this change targets **8.5/10**, subject to production verification; it does not establish improved rankings or citation rates.

## Method and scope

- Fetch every URL in the production sitemap: 165 URLs, including 132 articles, 14 content-module marketing pages, 12 documentation articles, and seven other pages.
- Inspect raw HTTP responses, titles, canonicals, headings, JSON-LD and crawler-readable content. Raw HTML findings describe the no-JavaScript response, not an absence of client-rendered schema.
- Inspect authenticated Google Search Console performance for two consecutive 28-day windows ending 2 November, plus the submitted sitemap. Inspect DataFast acquisition and signup goals over its last30d window. Private analytics stay outside this public repository.
- Review the leading search pages: calendar apps, planner apps, to-do lists, productivity apps, kanban boards, time-blocking apps, and the routine definition guide. This is a content sample; it is not fact-checking of all 132 articles.
- Read the project design guide, SEO content playbook, persona research, server and build implementation.

## Rubric

Use the same criteria at every review. A 10 requires current evidence for all listed acceptance criteria. Calculate the overall score as the weighted average of scored dimensions. Exclude unmeasured dimensions from the denominator and report them alongside the result.

| Dimension | Weight | Baseline /10 | Target after this change /10 | Evidence required for 10 |
| --- | ---: | ---: | ---: | --- |
| Crawl and HTTP behavior | 15 | 7 | 8 | Canonical public URLs return 200; unknown pages/assets return 404; duplicate URLs redirect; private routes excluded; indexing report has no unexplained failures |
| Crawler-readable content | 15 | 4 | 10 | Every sitemap URL exposes its real content, one H1, one title and a self-canonical without JavaScript; browser content agrees |
| Structured data | 10 | 6 | 9 | Valid, page-appropriate schema matches visible facts; stable identities; no invented ratings, offers, dates or versions; rich-result validation where applicable |
| On-page metadata and architecture | 10 | 7 | 8 | Distinct query-aligned titles/descriptions; useful heading hierarchy; working internal links and breadcrumbs; no important orphan pages |
| Search intent and useful answers | 15 | 8 | 8 | Clear answers and relevant next steps across every priority page; comparisons address real tradeoffs; decisions informed by query and conversion evidence |
| Evidence and editorial trust | 10 | 7 | 8 | Primary sources support factual claims; method, author and commercial relationship are clear; competitor facts are checked; useful original evidence |
| Brand and accessibility | 10 | 8 | 9 | Plain language, accurate license/platform claims, real product media, consistent design, zoom and keyboard access; mobile/theme/contrast checks complete |
| Measurement and AI visibility | 5 | 6 | 7 | Google and Bing indexing, query cohorts, organic signup attribution and a reproducible multi-engine citation panel are tracked |
| Performance | 5 | Unmeasured | Unmeasured | Mobile field LCP <2.5s, INP <200ms and CLS <0.1 at the 75th percentile; representative lab checks explain bottlenecks |
| Independent authority | 5 | Unmeasured | Unmeasured | Relevant independent mentions and referring domains audited; citations and third-party product facts checked |

Baseline weighted points: 595 / 90 = 6.61. Target weighted points: 765 / 90 = 8.50. These scores are explicitly judgment-based; the build gates below are binary and reproducible.

## Findings, ranked by impact

### P0 — Eighteen sitemap URLs return the homepage document to no-JavaScript crawlers

All 165 sitemap requests returned 200, but 18 had the same homepage title/canonical and no content H1. They were `/`, `/download`, `/alternative/sunsama`, `/docs`, all 12 `/docs/*` articles, `/privacy`, and `/terms`. The other 147 pages already had prerendered content.

This does not mean Google cannot render them. It does mean link-preview bots and crawlers that do not execute the app receive incomplete or misleading documents. The docs are particularly important for agents evaluating MCP and API capabilities.

**Change:** render the five standalone public pages from their actual React components at build time; render the docs from their existing MDX; preserve page-specific metadata, readable content and matching schema. No parallel hand-written marketing copy.

### P1 — Unknown URLs and missing assets look successful

A made-up URL and `/pricing.md` returned homepage HTML with status 200. The missing pricing document was not a pricing page. There is no basis for inventing paid plans or adding a pricing-led campaign.

**Change:** return 404 for missing public pages and assets; preserve known authentication/application routes; set server-side noindex headers for private/error responses; permanently redirect the legacy time-blocking URL and document aliases.

### P1 — Thirty-eight articles repeat the title as an H1

The blog layout already renders the title. Older MDX repeats it in the body, creating a second H1 in the browser and crawler output.

**Change:** let the layout own the H1 in both render paths, while retaining article sections and their heading text.

### P1 — Stale software facts and fabricated freshness

The shared HTML declared software version `1.0.0` and an unverified publication date. Documentation schema used the current visit date when no modification date was provided. Sitemap generation also substituted checkout/build time for unknown dates.

**Change:** remove unmaintained version/date assertions; omit unknown dates; accept explicit docs `updated` metadata; share TechArticle generation between static and client output. Keep known article and marketing modification dates.

### P1 — A high-impression article needs a direct, credible answer

The routine guide began with several paragraphs of generic setup. It made uncited claims about health, stress and habit formation, and buried its practical example. Search Console identifies it as an impression-heavy page with weak click-through.

**Change:** retain the URL, title and publication date. Lead with the definition, add clear routine/habit/ritual distinctions, practical steps, original research links, six visible FAQ answers and real product media. Avoid implying that habit research proves a fixed timeline for a complex routine. No promise of health benefits.

### P1 — Late default-font loading shifts the article on phones

Responsive QA found layout shift above 0.1 at 375px. Layout-shift entries pointed to the article header and cover moving when the external Geist font arrived.

**Change:** serve the same pinned Geist 1.1.0 files locally, preload the default text weights, and retain the SIL Open Font License. The revised article now measures CLS 0.000 at 375px and 0.001 at 768/1280px in both themes in the local lab. Field Core Web Vitals remain unmeasured.

### P2 — Older content and title length still need selective review

127 raw title strings exceed 70 characters, including the site suffix. Long titles are not automatically a search penalty; the concern is truncation and clarity. Preserve winning query wording and test targeted changes instead of truncating all titles mechanically.

Only 36 baseline pages exposed FAQPage in raw HTML. That is not itself a defect: add FAQ schema only when there are useful visible answers. FAQ/HowTo markup does not guarantee a Google rich result or an AI citation.

**Next:** review older articles by qualified search demand and signup contribution. Preserve the stronger recent comparison format: disclosure, sourced app cards, license caveats and fair alternatives. Do not expand generic definition content to chase impressions.

## Strengths worth keeping

- Robots allows public content for search and AI search agents. `llms.txt` already links useful product and integration pages.
- Google has a submitted sitemap: Success, 165 discovered URLs, last read 3 November. Discovered is not the same as indexed.
- Recent marketing pages and articles already provide semantic content, real media and structured data.
- The source-available/non-commercial license caveat and absence of native phone apps are stated plainly on relevant product pages.
- Search Console and DataFast are accessible. AI referral visitors and signup goals exist, but referral attribution alone cannot establish citation share.

## Validation and limits

Build now checks every sitemap URL for a generated document, one H1/title, the expected canonical, readable content and parseable JSON-LD. HTTP checks cover public routes, unknown URLs/assets, authentication/application routes, redirects, gzip and media ranges. These checks run in CI as part of the web build.

The revised routine article passes the existing readability gate (grade 4.6). Run normal typecheck, lint, unit tests, build, desktop size check, browser smoke tests and MCP OAuth tests. Test locally only against Railway development Postgres, without Docker. Use connected Chrome when the requested Cursor browser tool is unavailable. Responsive QA sampled the homepage, docs, Sunsama comparison and routine article at 375/768/1280px in both themes; all pass after the font change. The existing QA script was run with the repository's installed Playwright test package via a temporary module-resolution adapter.

Local smoke results: 27/28 pass. The remaining priority-edit test exposes a temporary-task-ID race over the shared remote dev database. Repeating that test on unchanged main also fails three times with invalid UUID errors. Do not weaken the test or change unrelated task behavior in this SEO change; required CI must still pass before merge. MCP OAuth: 158 passed, zero failed.

PageSpeed Insights returned HTTP 429 during this audit, so performance remains unmeasured. There is no verified Bing coverage, backlink audit, or controlled ChatGPT/Perplexity/Google AI citation panel in this report. No ranking or citation improvement can be claimed immediately after deployment.

## Remaining work to earn 10

1. Confirm all HTTP/content gates in production and inspect important URLs in Search Console after recrawl.
2. Audit the full indexing report and Bing Webmaster Tools. Resolve actual coverage issues before claiming indexation is complete.
3. Measure field and lab performance on the homepage, a comparison, docs and a media-rich article. Verify narrow mobile layouts, both themes, zoom and contrast.
4. Review priority comparison facts at primary sources and make authorship/methodology easier to inspect across older articles.
5. Audit independent authority and earn relevant third-party coverage; do not fabricate testimonials, user counts or backlinks.
6. Track a fixed query panel weekly, with engine, date, locale, prompt, answer, cited URL, competitor citations and signup outcomes. Re-run the same rubric with evidence.

Priority query panel: open source daily planner; open source planner app; open source calendar app; self hosted daily planner; self hosted Sunsama alternative; Sunsama open source alternative; Sunsama MCP; Sunsama API; time blocking app with API; daily planner for Claude; daily planner for ChatGPT; MCP task manager; open source kanban board; open source focus app; calendar time blocking app; Motion alternative; Akiflow alternative; Reclaim alternative; Todoist alternative with calendar; how to plan a workday around meetings.
