/**
 * JSON-LD builders shared by the <*Schema> components (client) and
 * scripts/prerender-blog-meta.ts (baked into the HTML for crawlers that don't
 * run JavaScript). Keep imports relative: the build scripts import this file.
 */

import { isoDuration, type VideoMedia } from "./blog-media";

export const SITE_URL = "https://opensunsama.com";

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

export interface BlogPostingInput {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  slug: string;
}

export function blogPostingJsonLd(post: BlogPostingInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: {
      "@type": "Organization",
      name: post.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Open Sunsama",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/open-sunsama-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    image: absolute(post.image || "/og-image.png"),
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function videoObjectJsonLd(video: VideoMedia) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: absolute(video.poster),
    uploadDate: video.uploadDate,
    duration: isoDuration(video.duration),
    contentUrl: absolute(video.mp4),
  };
}
