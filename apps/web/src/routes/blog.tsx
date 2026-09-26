import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  BlogCard,
  BlogCTA,
  BlogFeaturedCard,
  BlogHero,
  BlogPostsGrid,
  BlogResultsBar,
  BlogTopicTabs,
} from "@/components/blog";
import { Reveal } from "@/components/landing/motion";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader, SkipLink } from "@/components/marketing/site-header";
import { SEOHead, CollectionSchema } from "@/components/seo";
import { getAllBlogPosts } from "@/lib/blog";
import { filterByTagParam } from "@/lib/blog-topics";
import type { BlogPost } from "@/types/blog";

const POSTS_PER_PAGE = 18;

/** Pillar guides shown under the featured post, in this order. */
const START_HERE = [
  "best-free-sunsama-alternatives",
  "best-calendar-apps-time-blocking",
  "plan-your-day-with-claude",
];

function pageList(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  if (totalPages <= 5)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) pages.push("ellipsis");
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  ) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

/**
 * Blog index: hero with search, topic tabs, the latest post, three pillar
 * guides, then every other post in a paginated grid.
 */
export default function BlogPage() {
  const allPosts = useMemo(() => getAllBlogPosts(), []);
  const searchParams = useSearch({ from: "/blog" });
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(searchParams.q || "");

  // Debounce typing into the ?q= param
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.q || "")) {
        navigate({
          to: "/blog",
          search: {
            ...searchParams,
            q: searchInput || undefined,
            page: undefined,
          },
          replace: true,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, navigate]);

  useEffect(() => {
    setSearchInput(searchParams.q || "");
  }, [searchParams.q]);

  const filteredPosts = useMemo(() => {
    let posts = filterByTagParam(allPosts, searchParams.tag);
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

  const hasActiveFilters = Boolean(searchParams.tag || searchParams.q);
  const currentPage = searchParams.page || 1;
  const showIntro = !hasActiveFilters && currentPage === 1;

  // The unfiltered index leads with the latest post and the pillars; the grid holds the rest
  const featured = allPosts[0];
  const pillars = useMemo(
    () =>
      START_HERE.map((slug) => allPosts.find((p) => p.slug === slug)).filter(
        (p): p is BlogPost => Boolean(p) && p!.slug !== featured?.slug
      ),
    [allPosts, featured]
  );
  const gridSource = useMemo(() => {
    if (hasActiveFilters) return filteredPosts;
    const pinned = new Set([featured?.slug, ...pillars.map((p) => p.slug)]);
    return allPosts.filter((p) => !pinned.has(p.slug));
  }, [hasActiveFilters, filteredPosts, allPosts, featured, pillars]);

  const totalPages = Math.max(1, Math.ceil(gridSource.length / POSTS_PER_PAGE));
  const pagePosts = gridSource.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );
  const pageNumbers = useMemo(
    () => pageList(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const setTag = useCallback(
    (tag: string | undefined) => {
      navigate({
        to: "/blog",
        search: { ...searchParams, tag, page: undefined },
        replace: true,
      });
    },
    [searchParams, navigate]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      navigate({
        to: "/blog",
        search: { ...searchParams, page: page > 1 ? page : undefined },
        replace: true,
      });
      document
        .getElementById("articles")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [searchParams, navigate]
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    navigate({
      to: "/blog",
      search: { tag: undefined, page: undefined, q: undefined },
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      <SEOHead
        title="Blog | Open Sunsama - Productivity Tips & Time Management"
        description="Tips on productivity, time management, and building better daily habits. Learn how to plan your day effectively with time blocking and focus techniques."
        canonicalUrl="/blog"
        ogType="website"
      />
      <CollectionSchema
        name="Open Sunsama Blog"
        description="Tips on productivity, time management, and building better daily habits."
        url="/blog"
        posts={filteredPosts}
        maxItems={10}
      />

      <SkipLink />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <BlogHero searchInput={searchInput} onSearchChange={setSearchInput} />

        <div>
          <div className="sticky top-14 z-40 py-3 backdrop-blur-xl [background:linear-gradient(hsl(var(--background)/0.85),hsl(var(--background)/0.85)_70%,hsl(var(--background)/0))] supports-[backdrop-filter]:[background:linear-gradient(hsl(var(--background)/0.7),hsl(var(--background)/0.7)_70%,hsl(var(--background)/0))]">
            <BlogTopicTabs selectedTag={searchParams.tag} onSelect={setTag} />
          </div>

          <div className="container mx-auto max-w-6xl px-4 pb-4 pt-8 md:pt-10">
            {showIntro && featured && (
              <>
                <Reveal>
                  <BlogFeaturedCard post={featured} />
                </Reveal>

                {pillars.length > 0 && (
                  <section
                    aria-labelledby="start-here"
                    className="mt-20 md:mt-24"
                  >
                    <Reveal className="max-w-2xl">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
                        Start here
                      </p>
                      <h2
                        id="start-here"
                        className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[36px]"
                      >
                        Three guides to read first.
                      </h2>
                      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
                        The best Sunsama alternatives, the calendars built for
                        time blocking, and planning your day with Claude.
                      </p>
                    </Reveal>
                    <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      {pillars.map((post, i) => (
                        <Reveal
                          key={post.slug}
                          as="li"
                          delay={i * 80}
                          className={
                            i === 2
                              ? "min-w-0 sm:col-span-2 lg:col-span-1"
                              : "min-w-0"
                          }
                        >
                          <BlogCard post={post} wideOnTablet={i === 2} />
                        </Reveal>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}

            <section
              id="articles"
              aria-label="Articles"
              className={
                showIntro ? "mt-20 scroll-mt-32 md:mt-24" : "scroll-mt-32"
              }
            >
              <BlogResultsBar
                title={showIntro ? "More articles" : undefined}
                totalResults={
                  showIntro ? gridSource.length : filteredPosts.length
                }
                selectedTag={searchParams.tag}
                searchQuery={searchParams.q}
                onClearTag={() => setTag(undefined)}
                onClearSearch={() => setSearchInput("")}
              />
              <div className="mt-8">
                <BlogPostsGrid
                  posts={pagePosts}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  hasActiveFilters={hasActiveFilters}
                  onPageChange={handlePageChange}
                  onClearFilters={clearFilters}
                />
              </div>
            </section>
          </div>
        </div>

        <BlogCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
