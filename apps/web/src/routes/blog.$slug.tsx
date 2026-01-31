import { useParams, Navigate } from "@tanstack/react-router";
import { BlogLayout } from "@/components/blog/blog-layout";
import { getBlogPost, getRelatedPosts } from "@/lib/blog";

/**
 * Individual blog post page
 * Renders MDX content within the blog layout
 */
export default function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const post = getBlogPost(slug);

  // Redirect to blog listing if post not found
  if (!post) {
    return <Navigate to="/blog" />;
  }

  const relatedPosts = getRelatedPosts(slug, 2);
  const { Component } = post;

  return (
    <BlogLayout post={post} relatedPosts={relatedPosts}>
      <Component />
    </BlogLayout>
  );
}
