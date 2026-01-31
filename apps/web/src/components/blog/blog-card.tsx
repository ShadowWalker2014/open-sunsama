import { Link } from "@tanstack/react-router";
import { Calendar, Clock, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types/blog";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

/**
 * Blog post card for listing pages
 * Matches the compact, Linear-style design system
 */
export function BlogCard({ post, featured = false }: BlogCardProps) {
  const formattedDate = format(new Date(post.date), "MMM d, yyyy");

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={cn(
        "group block rounded-xl border border-border/40 bg-card hover:border-border/60 hover:bg-card/80 transition-all duration-200",
        featured && "md:col-span-2"
      )}
    >
      {/* Cover image (if available) */}
      {post.image && (
        <div className="relative overflow-hidden rounded-t-xl border-b border-border/40">
          <div className={cn(
            "bg-muted/30",
            featured ? "h-48 md:h-64" : "h-36"
          )}>
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className={cn(
          "font-semibold tracking-tight group-hover:text-primary transition-colors",
          featured ? "text-lg md:text-xl" : "text-[15px]"
        )}>
          {post.title}
        </h3>

        {/* Description */}
        <p className={cn(
          "mt-2 text-muted-foreground leading-relaxed line-clamp-2",
          featured ? "text-sm" : "text-xs"
        )}>
          {post.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTime} min
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Compact blog card for sidebar or related posts
 */
export function BlogCardCompact({ post }: { post: BlogPost }) {
  const formattedDate = format(new Date(post.date), "MMM d, yyyy");

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-border/60 hover:bg-card/80 transition-all duration-200"
    >
      {/* Thumbnail */}
      {post.image && (
        <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted/30">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h4>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{formattedDate}</span>
          {post.readingTime && (
            <>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
