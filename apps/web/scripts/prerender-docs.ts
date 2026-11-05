import { breadcrumbListJsonLd, docsArticleJsonLd } from "../src/lib/structured-data";
import { SECTION_META } from "../src/types/docs";
import { renderBody } from "./blog-content";
import { readDocs } from "./docs-content";
import { escapeAttr as esc, readTemplate, writePage } from "./prerender-html";

const docs = readDocs();
const template = readTemplate();
const links = docs.map(({ slug, meta }) => `<li><a href="/docs/${esc(slug)}">${esc(meta.title)}</a>: ${esc(meta.description)}</li>`).join("\n");
writePage(template, {
  path: "/docs",
  title: "Documentation | Open Sunsama",
  description: "Comprehensive documentation for Open Sunsama. Learn about the REST API, MCP tools for AI agents, self-hosting, and more.",
  ogType: "website",
  ogImage: "/og-image.png",
  noscript: `<main><h1>Open Sunsama Documentation</h1><p>Learn how to integrate with Open Sunsama's REST API, connect AI agents using MCP tools, and self-host your own instance.</p><ul>${links}</ul></main>`,
});
for (const { slug, meta, source } of docs) {
  const { html } = await renderBody(source);
  const url = `/docs/${slug}`;
  writePage(template, {
    path: url,
    title: `${meta.title} | Open Sunsama Docs`,
    description: meta.description,
    ogType: "article",
    ogImage: "/og-image.png",
    ...(meta.updated ? { modifiedTime: meta.updated } : {}),
    noscript: `<main><article><nav><a href="/">Home</a> / <a href="/docs">Docs</a></nav><h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p>${html}</article><nav aria-label="Documentation"><ul>${links}</ul></nav></main>`,
    jsonLd: {
      "docs-schema": docsArticleJsonLd({ title: meta.title, description: meta.description, slug, section: SECTION_META[meta.section]?.name ?? meta.section, dateModified: meta.updated }),
      "breadcrumb-schema": breadcrumbListJsonLd([{ label: "Docs", href: "/docs" }, { label: meta.title }], url),
    },
  });
}
console.log(`Pre-rendered ${docs.length + 1} documentation pages`);
