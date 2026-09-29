#!/usr/bin/env bun
/**
 * Writes one HTML file per blog post (dist/blog/<slug>.html) plus the blog
 * index (dist/blog.html), each a copy of dist/index.html with that page baked in:
 *
 * - title, description, canonical, Open Graph and Twitter tags;
 * - JSON-LD: BlogPosting, plus FAQPage, VideoObject and ItemList (ranked
 *   <OssApp> cards) when the post has them;
 * - the article itself as semantic HTML in <noscript>.
 *
 * Link-preview crawlers (Slack, LinkedIn, X, iMessage) and AI crawlers
 * (GPTBot, ClaudeBot, PerplexityBot) don't run JavaScript, so without this
 * they see an empty page. The <noscript> text is the same text readers see.
 * server.ts serves these files for their paths and falls back to index.html
 * for everything else.
 *
 * The tags mirror src/components/seo/seo-head.tsx. They carry data-rh="true"
 * so react-helmet-async adopts and replaces them on client-side navigation.
 * The JSON-LD scripts use the ids the <*Schema> components use, so the client
 * replaces them instead of adding duplicates.
 *
 * Run after build: bun run scripts/prerender-blog-meta.ts
 */

import { BLOG_MEDIA } from "../src/lib/blog-media";
import { itemListApps } from "../src/lib/oss-apps";
import { ossItemListJsonLd } from "../src/lib/oss-structured-data";
import {
  blogPostingJsonLd,
  faqPageJsonLd,
  videoObjectJsonLd,
} from "../src/lib/structured-data";
import {
  type BlogSource,
  headingId,
  lastUpdated,
  readBlogPosts,
  renderBody,
} from "./blog-content";
import { escapeAttr, formatDate, type PageMeta, readTemplate, writePage } from "./prerender-html";

/** Mirrors BlogArticleMeta + the article body + BlogFaqs in blog-layout.tsx */
async function renderArticle({ slug, source, frontmatter: post }: BlogSource) {
  const { html: body, videosUsed, oss } = await renderBody(source);
  const updated = post.updated && post.updated !== post.date ? post.updated : null;

  const byline = [
    escapeAttr(post.author),
    `<time datetime="${escapeAttr(post.date)}">${formatDate(post.date)}</time>`,
    updated && `Updated <time datetime="${escapeAttr(updated)}">${formatDate(updated)}</time>`,
    post.readingTime && `${post.readingTime} min read`,
  ].filter(Boolean);

  const faqs = post.faqs?.length
    ? [
        '<section aria-labelledby="faq">',
        '<h2 id="faq">Frequently asked questions</h2>',
        ...post.faqs.map(
          (faq) =>
            `<h3 id="${headingId(faq.question)}">${escapeAttr(faq.question)}</h3><p>${escapeAttr(faq.answer)}</p>`
        ),
        "</section>",
      ].join("")
    : "";

  const noscript = [
    "<article>",
    `<nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a></nav>`,
    `<h1>${escapeAttr(post.title)}</h1>`,
    `<p>${escapeAttr(post.description)}</p>`,
    `<p>${byline.join(" · ")}</p>`,
    post.image ? `<img src="${escapeAttr(post.image)}" alt="${escapeAttr(post.title)}">` : "",
    body,
    faqs,
    "</article>",
  ].join("\n");

  const jsonLd: Record<string, object> = {
    "article-schema": blogPostingJsonLd({
      title: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: lastUpdated(post),
      author: post.author,
      image: post.image,
      slug,
    }),
  };
  if (post.faqs?.length) jsonLd["faq-schema"] = faqPageJsonLd(post.faqs);
  for (const id of videosUsed) {
    const video = BLOG_MEDIA.videos[id];
    if (video) jsonLd[`video-schema-${id}`] = videoObjectJsonLd(video);
  }
  // Same id as <OssListProvider> (components/blog/media/oss-list.tsx), so the client replaces it
  const apps = itemListApps(oss.cards, oss.tables);
  if (apps.length) jsonLd["oss-itemlist-schema"] = ossItemListJsonLd(apps, { name: post.title, slug });

  return { noscript, jsonLd };
}

/** A plain list of every post, so crawlers landing on /blog can find them all */
function renderIndex(posts: BlogSource[]) {
  const items = posts.map(
    ({ slug, frontmatter: post }) =>
      `<li><a href="/blog/${slug}">${escapeAttr(post.title)}</a>: ${escapeAttr(post.description)}</li>`
  );
  return `<main><h1>Open Sunsama Blog</h1><ul>\n${items.join("\n")}\n</ul></main>`;
}

async function main() {
  const template = readTemplate();
  const posts = readBlogPosts().sort((a, b) =>
    lastUpdated(b.frontmatter).localeCompare(lastUpdated(a.frontmatter))
  );

  // Mirrors the SEOHead props in src/routes/blog.tsx
  const pages: PageMeta[] = [
    {
      path: "/blog",
      title: "Blog | Open Sunsama - Productivity Tips & Time Management",
      description:
        "Tips on productivity, time management, and building better daily habits. Learn how to plan your day effectively with time blocking and focus techniques.",
      ogType: "website",
      ogImage: "/og-image.png",
      noscript: renderIndex(posts),
    },
  ];

  // Mirrors the SEOHead props in src/components/blog/blog-layout.tsx
  for (const source of posts) {
    const post = source.frontmatter;
    pages.push({
      path: `/blog/${source.slug}`,
      title: `${post.title} | Open Sunsama Blog`,
      description: post.description,
      ogType: "article",
      ogImage: post.image?.replace(/\.webp$/, "-og.jpg") || "/og-image.png",
      publishedTime: post.date,
      modifiedTime: lastUpdated(post),
      author: post.author,
      ...(await renderArticle(source)),
    });
  }

  for (const page of pages) writePage(template, page);

  console.log(`Pre-rendered ${pages.length} blog pages (meta tags, JSON-LD, article HTML)`);
}

await main();
