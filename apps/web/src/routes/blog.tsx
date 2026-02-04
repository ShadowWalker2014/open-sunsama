import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import {
  Github,
  ArrowRight,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlogCard } from "@/components/blog/blog-card";
import { SEOHead, CollectionSchema } from "@/components/seo";
import { getAllBlogPosts, getAllTags } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

const POSTS_PER_PAGE = 12;

/**
 * Blog listing page
 * Displays all blog posts in a grid with filtering, search, and pagination
 */
export default function BlogPage() {
  const allPosts = getAllBlogPosts();
  const tags = getAllTags();
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  // Get search params from URL
  const searchParams = useSearch({ from: "/blog" });
  const navigate = useNavigate();

  // Local search input state (for debouncing)
  const [searchInput, setSearchInput] = useState(searchParams.q || "");

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.q || "")) {
        navigate({
          to: "/blog",
          search: {
            ...searchParams,
            q: searchInput || undefined,
            page: 1, // Reset to first page on search
          },
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, navigate]);

  // Sync local state with URL params
  useEffect(() => {
    setSearchInput(searchParams.q || "");
  }, [searchParams.q]);

  // Filter posts by tag and search query
  const filteredPosts = useMemo(() => {
    let posts = allPosts;

    // Filter by tag
    if (searchParams.tag) {
      posts = posts.filter((post) =>
        post.tags.some(
          (t) => t.toLowerCase() === searchParams.tag?.toLowerCase()
        )
      );
    }

    // Filter by search query
    if (searchParams.q) {
      const query = searchParams.q.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
      );
    }

    return posts;
  }, [allPosts, searchParams.tag, searchParams.q]);

  // Calculate pagination
  const currentPage = searchParams.page || 1;
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + POSTS_PER_PAGE
  );

  // Handle tag selection
  const handleTagClick = useCallback(
    (tag: string) => {
      const newTag = searchParams.tag === tag ? undefined : tag;
      navigate({
        to: "/blog",
        search: {
          ...searchParams,
          tag: newTag,
          page: 1, // Reset to first page when filtering
        },
        replace: true,
      });
    },
    [searchParams, navigate]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      navigate({
        to: "/blog",
        search: {
          ...searchParams,
          page,
        },
        replace: true,
      });
      // Scroll to top of posts section
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [searchParams, navigate]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchInput("");
    navigate({
      to: "/blog",
      search: { tag: undefined, page: undefined, q: undefined },
      replace: true,
    });
  }, [navigate]);

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const hasActiveFilters = searchParams.tag || searchParams.q;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Dynamic SEO Meta Tags */}
      <SEOHead
        title="Blog | Open Sunsama - Productivity Tips & Time Management"
        description="Tips on productivity, time management, and building better daily habits. Learn how to plan your day effectively with time blocking and focus techniques."
        canonicalUrl="/blog"
        ogType="website"
      />

      {/* CollectionPage Schema for SEO */}
      <CollectionSchema
        name="Open Sunsama Blog"
        description="Tips on productivity, time management, and building better daily habits."
        url="/blog"
        posts={filteredPosts}
        maxItems={10}
      />

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              loading="lazy"
              decoding="async"
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
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
        {/* Hero */}
        <section ref={heroRef} className="pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-border/40 bg-card/50 text-[11px] font-medium transition-all duration-300",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              <FileText className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Blog</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              Insights & Updates
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed transition-all duration-300 delay-100",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              Tips on productivity, time management, and building better daily
              habits.
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="pb-6">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tags filter */}
        {tags.length > 0 && (
          <section className="pb-8">
            <div className="container px-4 mx-auto max-w-4xl">
              <div className="flex flex-wrap justify-center gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={cn(
                      "text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors",
                      searchParams.tag === tag
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/40 bg-card/50 text-muted-foreground hover:bg-card hover:border-border/60"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <section className="pb-4">
            <div className="container px-4 mx-auto max-w-4xl">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "result" : "results"}
                  {searchParams.tag && (
                    <>
                      {" "}
                      for tag{" "}
                      <strong className="text-foreground">
                        "{searchParams.tag}"
                      </strong>
                    </>
                  )}
                  {searchParams.q && (
                    <>
                      {" "}
                      matching{" "}
                      <strong className="text-foreground">
                        "{searchParams.q}"
                      </strong>
                    </>
                  )}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Blog posts grid */}
        <section className="py-8 md:py-12">
          <div className="container px-4 mx-auto max-w-4xl">
            {paginatedPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedPosts.map((post, index) => (
                    <BlogCard
                      key={post.slug}
                      post={post}
                      featured={
                        index === 0 && currentPage === 1 && !hasActiveFilters
                      }
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    className="mt-12 flex items-center justify-center gap-1"
                    aria-label="Pagination"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-1">
                        Previous
                      </span>
                    </Button>

                    <div className="flex items-center gap-1">
                      {pageNumbers.map((page, index) =>
                        page === "ellipsis" ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-muted-foreground"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={
                              page === currentPage ? "default" : "outline"
                            }
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only sm:not-sr-only sm:mr-1">
                        Next
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-[15px] font-semibold mb-1">
                  No posts found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your search or filter criteria."
                    : "Check back soon for new content."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">
              Ready to take control of your day?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join thousands using Open Sunsama for better daily planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Create free account
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[13px]"
                asChild
              >
                <a
                  href="https://github.com/ShadowWalker2014/open-sunsama"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </Button>
            </div>
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
                loading="lazy"
                decoding="async"
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
