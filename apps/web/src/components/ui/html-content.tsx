"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html: string;
  className?: string;
}

export function HtmlContent({ html, className }: HtmlContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return null;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u", "s", "a",
        "ul", "ol", "li", "blockquote", "pre", "code", "span", "div",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
      ADD_ATTR: ["target"],
    });
  }, [html]);

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
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "prose-a:underline prose-a:underline-offset-2",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
