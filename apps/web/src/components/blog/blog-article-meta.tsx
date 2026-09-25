import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { primaryTopic } from "@/lib/blog-topics";
import type { BlogPost } from "@/types/blog";
import { ShareButtons } from "./share-buttons";
import { TopicPill } from "./blog-card";
import { BlogCover } from "./blog-cover";

interface BlogArticleMetaProps {
  post: BlogPost;
  canonicalUrl: string;
}

/** Article header: topic pill, title, description, byline, share, cover. */
export function BlogArticleMeta({ post, canonicalUrl }: BlogArticleMetaProps) {
  // parseISO reads "2026-02-01" as a local date; new Date() would read UTC
  const formattedDate = format(parseISO(post.date), "MMM d, yyyy");
  const formattedUpdated =
    post.updated && post.updated !== post.date
      ? format(parseISO(post.updated), "MMM d, yyyy")
      : null;
  const topic = primaryTopic(post);

  return (
    <header>
      {topic && (
        <Link
          to="/blog"
          search={{ tag: topic.id, page: undefined, q: undefined }}
          className="inline-block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TopicPill
            label={topic.label}
            className="transition-colors hover:bg-primary/15"
          />
        </Link>
      )}

      <h1 className="mt-5 text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[40px] md:text-[46px]">
        {post.title}
      </h1>

      <p className="mt-5 text-pretty text-[17px] leading-relaxed text-muted-foreground md:text-[19px]">
        {post.description}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-y border-border/60 py-4 dark:border-white/[0.07]">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/open-sunsama-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full bg-muted object-cover ring-1 ring-border/70"
          />
          <div className="min-w-0 text-[13px] leading-snug">
            <p className="font-medium text-foreground">{post.author}</p>
            <p className="flex flex-wrap gap-x-1.5 text-muted-foreground">
              <time dateTime={post.date}>{formattedDate}</time>
              {formattedUpdated && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Updated{" "}
                    <time dateTime={post.updated}>{formattedUpdated}</time>
                  </span>
                </>
              )}
              {post.readingTime && (
                <>
                  <span aria-hidden>·</span>
                  <span>{post.readingTime} min read</span>
                </>
              )}
            </p>
          </div>
        </div>
        <ShareButtons
          title={post.title}
          url={canonicalUrl}
          description={post.description}
        />
      </div>

      {post.image && (
        <div className="relative mt-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -bottom-6 top-6 -z-10 rounded-[36px] bg-[radial-gradient(60%_60%_at_50%_50%,hsl(var(--primary)/0.22),transparent_72%)] blur-2xl"
          />
          {/* Covers come in several aspect ratios; a fixed 2:1 box stops the layout shifting as they load */}
          <div className="aspect-[2/1] overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-[0_1px_0_0_hsl(var(--foreground)/0.04),0_24px_80px_-24px_hsl(var(--shadow-color)/0.35),0_12px_32px_-12px_rgb(0_0_0/0.18)] dark:border-white/10">
            <BlogCover src={post.image} alt={post.title} priority />
          </div>
        </div>
      )}
    </header>
  );
}
