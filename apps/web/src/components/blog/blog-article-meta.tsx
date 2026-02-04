import { Link } from "@tanstack/react-router";
import { Calendar, Clock, User, Tag } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@/types/blog";
import { ShareButtons } from "./share-buttons";

interface BlogArticleMetaProps {
  post: BlogPost;
  canonicalUrl: string;
}

/**
 * Article metadata display including tags, title, description, and meta info
 */
export function BlogArticleMeta({ post, canonicalUrl }: BlogArticleMetaProps) {
  const formattedDate = format(new Date(post.date), "MMMM d, yyyy");

  return (
    <div className="container px-4 mx-auto max-w-3xl">
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to="/blog"
              search={{ tag, page: undefined, q: undefined }}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
        {post.title}
      </h1>

      {/* Description */}
      <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
        {post.description}
      </p>

      {/* Meta + Share Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min read
            </span>
          )}
        </div>

        {/* Share Buttons */}
        <ShareButtons
          title={post.title}
          url={canonicalUrl}
          description={post.description}
        />
      </div>

      {/* Cover image */}
      {post.image && (
        <div className="mt-8 rounded-xl overflow-hidden border border-border/40">
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
