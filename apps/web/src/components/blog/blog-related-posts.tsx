import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import type { BlogPost } from "@/types/blog";
import { BlogCard } from "./blog-card";

/** "Keep reading": up to three posts that share the most tags. */
export function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related"
      className="border-t border-border/50 pt-20 md:pt-24"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
              Keep reading
            </p>
            <h2
              id="related"
              className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[36px]"
            >
              More on this topic.
            </h2>
          </div>
          <Link
            to="/blog"
            search={{}}
            className="group inline-flex items-center gap-1.5 rounded-md text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            All articles
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
        <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {posts.map((post, i) => (
            <Reveal
              key={post.slug}
              as="li"
              delay={i * 80}
              className={
                i === 2 ? "min-w-0 sm:col-span-2 lg:col-span-1" : "min-w-0"
              }
            >
              <BlogCard post={post} wideOnTablet={i === 2} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
