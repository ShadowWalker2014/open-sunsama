import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArticleSchema, Breadcrumbs, SEOHead } from "@/components/seo";
import type { BlogPost } from "@/types/blog";
import {
  TableOfContents,
  extractHeadings,
  type TOCHeading,
} from "./table-of-contents";
import { ShareButtons } from "./share-buttons";
import { BlogLayoutHeader } from "./blog-layout-header";
import { BlogLayoutFooter } from "./blog-layout-footer";
import { BlogArticleMeta } from "./blog-article-meta";
import { BlogRelatedPosts } from "./blog-related-posts";

interface BlogLayoutProps {
  children: ReactNode;
  post: BlogPost;
  relatedPosts?: BlogPost[];
}

/**
 * Layout wrapper for individual blog post pages
 * Compact style matching the app design system
 */
export function BlogLayout({
  children,
  post,
  relatedPosts = [],
}: BlogLayoutProps) {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const canonicalUrl = `/blog/${post.slug}`;

  // Extract headings after content renders
  useEffect(() => {
    // Wait for MDX content to render
    const timer = setTimeout(() => {
      const extractedHeadings = extractHeadings();
      setHeadings(extractedHeadings);
    }, 100);
    return () => clearTimeout(timer);
  }, [post.slug]);

  // Show TOC if 5+ headings OR reading time > 8 min
  const showTOC =
    headings.length >= 5 || (post.readingTime && post.readingTime > 8);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Dynamic SEO Meta Tags */}
      <SEOHead
        title={`${post.title} | Open Sunsama Blog`}
        description={post.description}
        canonicalUrl={canonicalUrl}
        ogImage={post.image || "/og-image.png"}
        ogType="article"
        publishedTime={post.date}
        author={post.author}
      />

      <ArticleSchema
        title={post.title}
        description={post.description}
        datePublished={post.date}
        author={post.author}
        image={post.image}
        slug={post.slug}
      />

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <BlogLayoutHeader />

      <main className="relative">
        {/* Breadcrumb navigation */}
        <div className="container px-4 mx-auto max-w-3xl pt-6">
          <Breadcrumbs
            items={[{ label: "Blog", href: "/blog" }, { label: post.title }]}
          />
        </div>

        {/* Article header */}
        <article className="py-8 md:py-12">
          <BlogArticleMeta post={post} canonicalUrl={canonicalUrl} />

          {/* Article content with optional TOC sidebar */}
          <div className="container px-4 mx-auto mt-8 md:mt-12">
            <div
              className={
                showTOC ? "max-w-5xl mx-auto flex gap-8" : "max-w-3xl mx-auto"
              }
            >
              {/* Main content */}
              <div className={showTOC ? "flex-1 min-w-0 max-w-3xl" : ""}>
                <div className="blog-prose">{children}</div>

                {/* Share buttons at bottom */}
                <div className="mt-8 pt-6 border-t border-border/40 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Enjoyed this article?
                  </span>
                  <ShareButtons
                    title={post.title}
                    url={canonicalUrl}
                    description={post.description}
                  />
                </div>
              </div>

              {/* TOC sidebar (desktop only) */}
              {showTOC && (
                <aside className="hidden lg:block w-56 flex-shrink-0">
                  <TableOfContents headings={headings} />
                </aside>
              )}
            </div>
          </div>
        </article>

        {/* Related posts */}
        <BlogRelatedPosts posts={relatedPosts} />

        {/* CTA */}
        <section className="py-12 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <h2 className="text-lg font-semibold tracking-tight mb-2">
              Ready to try Open Sunsama?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              The open-source daily planner for focused work.
            </p>
            <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <BlogLayoutFooter />
    </div>
  );
}
