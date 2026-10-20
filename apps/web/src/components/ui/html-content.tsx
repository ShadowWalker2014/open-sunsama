"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import { cn, resolveUploadUrl } from "@/lib/utils";
import { descriptionToHtml } from "@/lib/markdown";
import { useLightbox } from "./lightbox";

interface HtmlContentProps {
  html: string;
  className?: string;
  markdown?: boolean;
}

export function HtmlContent({ html, className, markdown = false }: HtmlContentProps) {
  const lightbox = useLightbox();
  const sanitizedHtml = useMemo(() => {
    if (!html) return null;
    const clean = DOMPurify.sanitize(markdown ? descriptionToHtml(html) : html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u", "s", "a",
        "ul", "ol", "li", "blockquote", "pre", "code", "span", "div", "img",
        "h1", "h2", "h3", "h4", "h5", "h6", "hr",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "src", "alt", "title"],
      ADD_ATTR: ["target"],
    });
    // Uploads are stored as relative proxy paths — resolve to the API origin
    // so <img> tags actually load when rendered on the frontend domain.
    return clean.replace(
      /src="(\/uploads\/[^"]*)"/g,
      (_m, p1) => `src="${resolveUploadUrl(p1)}"`
    );
  }, [html, markdown]);

  if (!sanitizedHtml) {
    return null;
  }

  // Check for actual content
  const hasContent = sanitizedHtml.replace(/<[^>]*>/g, "").trim() !== "";

  if (!hasContent) {
    return null;
  }

  return (
    <div
      onClick={(e) => {
        // Click an inline image to preview it in the lightbox.
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG") {
          const img = target as HTMLImageElement;
          lightbox.open([
            {
              url: img.currentSrc || img.src,
              filename: img.alt || "Image",
              contentType: "image/*",
            },
          ]);
        }
      }}
      className={cn(
        // Compact text like Linear - smaller font, tighter spacing
        "prose dark:prose-invert max-w-none",
        "text-[13px] leading-relaxed",
        "prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "prose-headings:font-semibold prose-headings:my-1 prose-h1:text-base prose-h2:text-sm prose-h3:text-[13px]",
        "prose-a:underline prose-a:underline-offset-2",
        "[&_img]:cursor-zoom-in",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
