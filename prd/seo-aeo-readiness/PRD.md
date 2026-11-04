# SEO and answer-engine readiness

Make the public site's actual information accessible to search crawlers, link previews and AI assistants while preserving Open Sunsama's copy, product facts and design.

Acceptance:

- Every sitemap URL serves its own title, canonical, readable body and one H1 without JavaScript.
- Product and documentation content agrees with browser-rendered content.
- Unknown public pages/assets return 404; known app/auth routes remain usable and carry noindex headers.
- Legacy and duplicate document URLs permanently redirect to canonical routes.
- Structured data describes real content and does not invent ratings, pricing, dates or versions.
- Modification dates come from content metadata, never visits, builds or checkout time.
- The routine guide retains its URL/publication date and answers directly with sourced facts and practical examples.
- Build gates prevent regressions; normal CI and local smoke/OAuth tests pass; desktop bundle stays below 60 MB.
- Production responses and user-visible changes are checked after deployment.

[Baseline, rubric, evidence and remaining work](../../docs/marketing/seo-aeo-audit-2026-11-04.md). A 10/10 assessment also requires measured performance, indexing, independent authority and citation outcomes; passing the implementation checks alone is insufficient.
