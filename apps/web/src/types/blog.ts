/**
 * Blog types for the file-based blog CMS
 */

import type { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";

/** A question answered at the end of a post (rendered + FAQPage JSON-LD) */
export interface BlogFaq {
  question: string;
  answer: string;
}

/**
 * Frontmatter metadata for blog posts
 */
export interface BlogMeta {
  title: string;
  description: string;
  date: string; // ISO date string
  updated?: string; // ISO date of the last meaningful edit
  author: string;
  tags: string[];
  image?: string; // Optional cover image path
  readingTime?: number; // Minutes, can be auto-calculated
  faqs?: BlogFaq[];
}

/**
 * Full blog post with slug and content
 */
export interface BlogPost extends BlogMeta {
  slug: string;
  content?: string; // Raw MDX content (optional, for previews)
}

/**
 * Blog post with component for rendering
 */
export interface BlogPostWithComponent extends BlogPost {
  Component: ComponentType<{ components?: MDXComponents }>;
}
