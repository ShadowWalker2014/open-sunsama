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

/**
 * Blog posts grid section with pagination and empty state
 */
export function BlogPostsGrid({
  posts,
  currentPage,
  totalPages,
  pageNumbers,
  hasActiveFilters,
  onPageChange,
  onClearFilters,
}: BlogPostsGridProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4 mx-auto max-w-4xl">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post, index) => (
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
            <BlogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              onPageChange={onPageChange}
            />
          </>
        ) : (
          <BlogEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
        )}
      </div>
    </section>
  );
}
