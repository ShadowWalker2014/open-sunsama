import { Link } from "@tanstack/react-router";
import { type ReactNode, useLayoutEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader, SkipLink } from "@/components/marketing/site-header";
import { ArticleSchema, Breadcrumbs, SEOHead } from "@/components/seo";
import { lastUpdated } from "@/lib/blog";
import type { BlogPost } from "@/types/blog";
import {
  TableOfContents,
  extractHeadings,
  type TOCHeading,
} from "./table-of-contents";
import { ShareButtons } from "./share-buttons";
import { BlogArticleMeta } from "./blog-article-meta";
import { BlogRelatedPosts } from "./blog-related-posts";
import { BlogFaqs } from "./blog-faqs";
import { BlogCTA } from "./blog-cta";

interface BlogLayoutProps {
  children: ReactNode;
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

/** Compact sign-up card under the table of contents. */
function TryCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_16px_40px_-24px_hsl(var(--shadow-color)/0.35)] dark:border-white/[0.08]">
      <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.22),transparent)] blur-xl" />
      <img
        src="/open-sunsama-logo.png"
        alt=""
        width={32}
        height={32}
        className="relative h-8 w-8 rounded-lg object-cover"
      />
      <p className="relative mt-3 text-[14px] font-semibold tracking-tight">
        Plan your day in Open Sunsama
      </p>
      <p className="relative mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Time blocking, focus mode, and any AI agent. Open source.
      </p>
      <Button
        size="sm"
        className="relative mt-4 h-8 w-full rounded-lg text-[12.5px]"
        asChild
      >
        <Link to="/register">
          Get started
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

/**
 * Article page. One grid for the whole article, so breadcrumbs, title, cover
 * and body share a left edge; the TOC column is always reserved on desktop so
 * nothing shifts when the headings are read.
 */
export function BlogLayout({
  children,
  post,
  relatedPosts = [],
}: BlogLayoutProps) {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const canonicalUrl = `/blog/${post.slug}`;
  // Each cover has a 1200x630 JPEG twin: not every social crawler reads WebP
  const ogImage = post.image?.replace(/\.webp$/, "-og.jpg");

  // The MDX body is already in the DOM here; reading it before paint keeps the sidebar from jumping
  useLayoutEffect(() => {
    setHeadings(extractHeadings());
  }, [post.slug]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      <SEOHead
        title={`${post.title} | Open Sunsama Blog`}
        description={post.description}
        canonicalUrl={canonicalUrl}
        ogImage={ogImage || "/og-image.png"}
        ogType="article"
        publishedTime={post.date}
        modifiedTime={lastUpdated(post)}
        author={post.author}
      />

      <ArticleSchema
        title={post.title}
        description={post.description}
        datePublished={post.date}
        dateModified={lastUpdated(post)}
        author={post.author}
        image={post.image}
        slug={post.slug}
      />

      <SkipLink />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="relative focus:outline-none">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]">
          <div className="landing-grid absolute inset-0 opacity-60 dark:opacity-35" />
          <div className="absolute left-1/2 top-[-200px] h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.12),transparent)] blur-2xl" />
        </div>

        <div className="container mx-auto max-w-3xl px-4 pt-8 md:pt-12 lg:max-w-[68rem]">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-20">
            <article className="min-w-0 pb-16">
              <Breadcrumbs
                items={[
                  { label: "Blog", href: "/blog" },
                  { label: post.title },
                ]}
              />

              <div className="mt-6">
                <BlogArticleMeta post={post} canonicalUrl={canonicalUrl} />
              </div>

              <div className="blog-prose mt-12 md:mt-14">
                {children}
                <BlogFaqs faqs={post.faqs} />
              </div>

              <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/30 px-5 py-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <p className="text-[14px] font-medium">
                  Found this useful? Pass it on.
                </p>
                <ShareButtons
                  title={post.title}
                  url={canonicalUrl}
                  description={post.description}
                />
              </div>
            </article>

            {/* Desktop sidebar: sticky contents plus a sign-up card */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-8 pt-1">
                {headings.length >= 3 && (
                  <TableOfContents
                    headings={headings}
                    className="static max-h-none min-h-0 shrink overflow-auto"
                  />
                )}
                <div className="shrink-0">
                  <TryCard />
                </div>
              </div>
            </aside>
          </div>
        </div>

        <BlogRelatedPosts posts={relatedPosts} />

        <BlogCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
