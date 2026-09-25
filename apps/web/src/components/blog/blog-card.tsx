import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { primaryTopic } from "@/lib/blog-topics";
import type { BlogPost } from "@/types/blog";
import { BlogCover } from "./blog-cover";

/**
 * Covers keep their 2:1 shape everywhere (their headlines sit near the edges, so
 * cropping cuts words). Where the card is taller than the cover, the cover sits
 * centered on a band painted in the covers' own background color.
 */
const COVER_BAND = "flex items-center bg-[hsl(30_60%_98.6%)] dark:bg-[hsl(228_14%_7%)]";

/** "Feb 1, 2026", or "Updated Mar 3, 2026" once a post has been revised */
export function cardDate({ date, updated }: BlogPost) {
  if (updated && updated !== date) {
    return `Updated ${format(parseISO(updated), "MMM d, yyyy")}`;
  }
  return format(parseISO(date), "MMM d, yyyy");
}

export function TopicPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-0.5 text-[11.5px] font-medium text-primary dark:border-primary/25 dark:bg-primary/10",
        className
      )}
    >
      {label}
    </span>
  );
}

/** Cover box shared by every card: fixed 2:1 so nothing shifts as images load. */
function CardCover({
  post,
  className,
}: {
  post: BlogPost;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/1] overflow-hidden bg-muted/60 dark:bg-white/[0.03]",
        className
      )}
    >
      {post.image ? (
        <BlogCover
          src={post.image}
          alt=""
          className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.035] motion-reduce:transition-none"
        />
      ) : (
        <div className="landing-grid absolute inset-0 opacity-60" />
      )}
    </div>
  );
}

function CardMeta({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted-foreground",
        className
      )}
    >
      <span>{cardDate(post)}</span>
      {post.readingTime && (
        <>
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
          <span>{post.readingTime} min read</span>
        </>
      )}
    </p>
  );
}

const CARD_SURFACE =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_-28px_hsl(var(--shadow-color)/0.45),0_10px_24px_-14px_rgb(0_0_0/0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/[0.08] dark:hover:border-primary/35";

/**
 * Grid card: 2:1 cover, one topic pill, title, two-line description, date.
 * `wideOnTablet` lays it out cover-beside-text when it spans two tablet columns.
 */
export function BlogCard({
  post,
  wideOnTablet = false,
  className,
}: {
  post: BlogPost;
  wideOnTablet?: boolean;
  className?: string;
}) {
  const topic = primaryTopic(post);

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        CARD_SURFACE,
        wideOnTablet && "sm:grid sm:grid-cols-2 lg:flex",
        className
      )}
    >
      <div
        className={cn(
          COVER_BAND,
          "border-b border-border/60 dark:border-white/[0.06]",
          wideOnTablet && "sm:border-b-0 sm:border-r lg:border-b lg:border-r-0"
        )}
      >
        <CardCover post={post} className="w-full" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {topic && <TopicPill label={topic.label} className="self-start" />}
        <h3 className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
          {post.description}
        </p>
        <CardMeta post={post} className="mt-auto pt-5" />
      </div>
    </Link>
  );
}

/** The large card at the top of the blog index: cover left, story right. */
export function BlogFeaturedCard({ post }: { post: BlogPost }) {
  const topic = primaryTopic(post);

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        CARD_SURFACE,
        "hover:-translate-y-0.5 lg:grid lg:grid-cols-[1.25fr_1fr]"
      )}
    >
      <div
        className={cn(
          COVER_BAND,
          "border-b border-border/60 dark:border-white/[0.06] lg:border-b-0 lg:border-r"
        )}
      >
        <CardCover post={post} className="w-full" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-primary">
            Latest
          </span>
          {topic && <TopicPill label={topic.label} />}
        </div>
        <h2 className="mt-4 text-balance text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-[32px] lg:text-[34px]">
          {post.title}
        </h2>
        <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
          {post.description}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <CardMeta post={post} />
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary">
            Read the article
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
