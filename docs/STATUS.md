# Project status

Current phase: improve SEO and answer-engine readiness. Updated 4 November 2026.

| Work | Tier | State | Date | Spec |
| --- | --- | --- | --- | --- |
| SEO/AEO audit, complete crawler output and HTTP correctness | Core | browser-validated | 2026-11-04 | [PRD](../prd/seo-aeo-readiness/PRD.md) |

Baseline: 6.6/10 on measured dimensions; implementation target 8.5/10. See the [rubric and evidence](marketing/seo-aeo-audit-2026-11-04.md). Rankings and citation gains remain unverified until recrawl and measurement.

Available: GitHub, Railway, Google Search Console and DataFast. Unmeasured: field performance (PageSpeed API rate-limited), Bing coverage, independent authority and multi-engine citation share. Private acquisition metrics are kept outside the public repository.

The original checkout contains unrelated uncommitted content work. This change uses its own branch/worktree and does not include those edits.

Validation: typecheck, lint (warnings only), unit tests, all 165 static SEO checks, HTTP regression checks, and readability pass. Desktop bundle: 33.7 MB. MCP OAuth: 158 passed. Responsive QA: representative homepage/docs/comparison/article at 375/768/1280px in both themes; revised article CLS 0.000–0.001 after the font fix. Browser smoke: 27/28 passed locally; the priority-edit test opens a temporary task ID before save and fails against the shared dev database. Reproduced on unchanged main (three repeat failures), so it is not introduced here. CI and deployment verification remain pending.
