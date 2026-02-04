import type { BlogPost } from "@/types/blog";
import { BlogCardCompact } from "./blog-card";

interface BlogRelatedPostsProps {
  posts: BlogPost[];
}

/**
 * Related posts section for blog layout
 */
export function BlogRelatedPosts({ posts }: BlogRelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-12 border-t border-border/40 bg-muted/10">
      <div className="container px-4 mx-auto max-w-3xl">
        <h2 className="text-[15px] font-semibold mb-6">Related Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((relatedPost) => (
            <BlogCardCompact key={relatedPost.slug} post={relatedPost} />
          ))}
        </div>
      </div>
    </section>
  );
}
