import { useEffect } from "react";
import type { BlogPost } from "@/types/blog";

interface CollectionSchemaProps {
  name: string;
  description: string;
  url: string;
  posts: BlogPost[];
  maxItems?: number;
}

const BASE_URL = "https://opensunsama.com";

/**
 * JSON-LD structured data for CollectionPage (blog listing)
 * Helps search engines understand the page structure
 */
export function CollectionSchema({
  name,
  description,
  url,
  posts,
  maxItems = 10,
}: CollectionSchemaProps) {
  useEffect(() => {
    const itemListElements = posts.slice(0, maxItems).map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/blog/${post.slug}`,
      name: post.title,
    }));

    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url: url.startsWith("http") ? url : `${BASE_URL}${url}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: posts.length,
        itemListElement: itemListElements,
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "collection-schema";
    script.textContent = JSON.stringify(schema);

    // Remove existing schema if present
    const existing = document.getElementById("collection-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [name, description, url, posts, maxItems]);

  return null;
}
