/**
 * Blog utilities for the file-based blog CMS
 * Uses Vite's import.meta.glob for dynamic MDX imports
 */

import type { BlogMeta, BlogPost, BlogPostWithComponent } from "@/types/blog";

// Dynamically import all MDX files from blog content directory
// Each blog post lives in its own folder: /content/blog/{slug}/index.mdx
const blogModules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter?: BlogMeta;
}>("/src/content/blog/*/index.mdx", { eager: true });

/**
 * Extract slug from file path
 * /src/content/blog/my-post/index.mdx -> my-post
 */
function extractSlug(path: string): string {
  const match = path.match(/\/content\/blog\/([^/]+)\/index\.mdx$/);
  return match?.[1] ?? "";
}

/**
 * Calculate reading time based on content length
 * Assumes average reading speed of 200 words per minute
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Get all blog posts sorted by date (newest first)
 */
export function getAllBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];

  for (const [path, module] of Object.entries(blogModules)) {
    const slug = extractSlug(path);
    if (!slug) continue;

    const frontmatter = module.frontmatter;
    if (!frontmatter) {
      console.warn(`Blog post at ${path} is missing frontmatter`);
      continue;
    }

    posts.push({
      slug,
      title: frontmatter.title,
      description: frontmatter.description,
      date: frontmatter.date,
      author: frontmatter.author,
      tags: frontmatter.tags || [],
      image: frontmatter.image,
      readingTime: frontmatter.readingTime,
    });
  }

  // Sort by date, newest first
  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get a single blog post by slug with its MDX component
 */
export function getBlogPost(slug: string): BlogPostWithComponent | null {
  const path = `/src/content/blog/${slug}/index.mdx`;
  const module = blogModules[path];

  if (!module) {
    return null;
  }

  const frontmatter = module.frontmatter;
  if (!frontmatter) {
    console.warn(`Blog post at ${path} is missing frontmatter`);
    return null;
  }

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    date: frontmatter.date,
    author: frontmatter.author,
    tags: frontmatter.tags || [],
    image: frontmatter.image,
    readingTime: frontmatter.readingTime,
    Component: module.default,
  };
}

/**
 * Get blog posts filtered by tag
 */
export function getBlogPostsByTag(tag: string): BlogPost[] {
  return getAllBlogPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get all unique tags from blog posts
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  
  for (const post of getAllBlogPosts()) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }

  return Array.from(tags).sort();
}

/**
 * Get related posts based on shared tags
 */
export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const currentPost = getBlogPost(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllBlogPosts().filter((p) => p.slug !== currentSlug);
  
  // Score posts by number of shared tags
  const scoredPosts = allPosts.map((post) => {
    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.includes(tag)
    );
    return { post, score: sharedTags.length };
  });

  // Sort by score (descending) then by date (descending)
  scoredPosts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });

  return scoredPosts.slice(0, limit).map((sp) => sp.post);
}
