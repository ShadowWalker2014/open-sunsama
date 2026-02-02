import { useEffect } from "react";

interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  slug: string;
}

export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
  slug,
}: ArticleSchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "article-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "datePublished": datePublished,
      "dateModified": dateModified || datePublished,
      "author": {
        "@type": "Organization",
        "name": author,
        "url": "https://opensunsama.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Open Sunsama",
        "url": "https://opensunsama.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://opensunsama.com/open-sunsama-logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://opensunsama.com/blog/${slug}`
      },
      "image": image ? `https://opensunsama.com${image}` : "https://opensunsama.com/og-image.png"
    });
    
    // Remove existing schema if present
    const existing = document.getElementById("article-schema");
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, [title, description, datePublished, dateModified, author, image, slug]);
  
  return null;
}
