/**
 * Blog types for the file-based blog CMS
 */

/**
 * Frontmatter metadata for blog posts
 */
export interface BlogMeta {
  title: string;
  description: string;
  date: string; // ISO date string
  author: string;
  tags: string[];
  image?: string; // Optional cover image path
  readingTime?: number; // Minutes, can be auto-calculated
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
  Component: React.ComponentType;
}
