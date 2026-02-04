import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Calendar, Clock, User, Github, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleSchema, Breadcrumbs, SEOHead } from "@/components/seo";
import { format } from "date-fns";
import type { BlogPost } from "@/types/blog";
import { BlogCardCompact } from "./blog-card";
import {
  TableOfContents,
  extractHeadings,
  type TOCHeading,
} from "./table-of-contents";
import { ShareButtons } from "./share-buttons";

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
  const formattedDate = format(new Date(post.date), "MMMM d, yyyy");
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
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="text-[13px] font-semibold">Open Sunsama</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/blog" search={{}}>
                Blog
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/download">Download</Link>
            </Button>
          </nav>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Breadcrumb navigation */}
        <div className="container px-4 mx-auto max-w-3xl pt-6">
          <Breadcrumbs
            items={[{ label: "Blog", href: "/blog" }, { label: post.title }]}
          />
        </div>

        {/* Article header */}
        <article className="py-8 md:py-12">
          <div className="container px-4 mx-auto max-w-3xl">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to="/blog"
                    search={{ tag, page: undefined, q: undefined }}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Description */}
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {post.description}
            </p>

            {/* Meta + Share Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
                {post.readingTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime} min read
                  </span>
                )}
              </div>

              {/* Share Buttons */}
              <ShareButtons
                title={post.title}
                url={canonicalUrl}
                description={post.description}
              />
            </div>

            {/* Cover image */}
            {post.image && (
              <div className="mt-8 rounded-xl overflow-hidden border border-border/40">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

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
        {relatedPosts.length > 0 && (
          <section className="py-12 border-t border-border/40 bg-muted/10">
            <div className="container px-4 mx-auto max-w-3xl">
              <h2 className="text-[15px] font-semibold mb-6">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {relatedPosts.map((relatedPost) => (
                  <BlogCardCompact key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        )}

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
      <footer className="border-t border-border/40 py-6">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <img
                src="/open-sunsama-logo.png"
                alt="Open Sunsama"
                className="h-5 w-5 rounded object-cover"
              />
              <span className="text-[11px] text-muted-foreground">
                © 2026 Open Sunsama
              </span>
            </div>
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <Link
                to="/blog"
                search={{}}
                className="hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
