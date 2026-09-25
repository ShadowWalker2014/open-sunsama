import { Reveal } from "@/components/landing/motion";
import type { BlogPost } from "@/types/blog";
import { BlogCard } from "./blog-card";
import { BlogPagination } from "./blog-pagination";
import { BlogEmptyState } from "./blog-empty-state";

interface BlogPostsGridProps {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "ellipsis")[];
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

/** Three columns on desktop, two on tablet, one on phones. */
export function BlogPostsGrid({
  posts,
  currentPage,
  totalPages,
  pageNumbers,
  hasActiveFilters,
  onPageChange,
  onClearFilters,
}: BlogPostsGridProps) {
  if (posts.length === 0) {
    return (
      <BlogEmptyState
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {posts.map((post, i) => (
          <Reveal
            key={post.slug}
            as="li"
            delay={(i % 3) * 60}
            className="min-w-0"
          >
            <BlogCard post={post} />
          </Reveal>
        ))}
      </ul>
      <BlogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageNumbers={pageNumbers}
        onPageChange={onPageChange}
      />
    </>
  );
}
