import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  BlogHeader,
  BlogHero,
  BlogSearch,
  BlogTagFilters,
  BlogActiveFilters,
  BlogPostsGrid,
  BlogCTA,
  BlogFooter,
} from "@/components/blog";
import { SEOHead, CollectionSchema } from "@/components/seo";
import { getAllBlogPosts, getAllTags } from "@/lib/blog";
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
            page: 1,
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

    if (searchParams.tag) {
      posts = posts.filter((post) =>
        post.tags.some(
          (t) => t.toLowerCase() === searchParams.tag?.toLowerCase()
        )
      );
    }

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
          page: 1,
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
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const hasActiveFilters = Boolean(searchParams.tag || searchParams.q);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
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

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <BlogHeader />

      <main className="relative">
        <div ref={heroRef}>
          <BlogHero heroInView={heroInView} />
        </div>

        <BlogSearch searchInput={searchInput} onSearchChange={setSearchInput} />

        <BlogTagFilters
          tags={tags}
          selectedTag={searchParams.tag}
          onTagClick={handleTagClick}
        />

        <BlogActiveFilters
          totalResults={filteredPosts.length}
          selectedTag={searchParams.tag}
          searchQuery={searchParams.q}
          onClearFilters={clearFilters}
        />

        <BlogPostsGrid
          posts={paginatedPosts}
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          hasActiveFilters={hasActiveFilters}
          onPageChange={handlePageChange}
          onClearFilters={clearFilters}
        />

        <BlogCTA />
      </main>

      <BlogFooter />
    </div>
  );
}
