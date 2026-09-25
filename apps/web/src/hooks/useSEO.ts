import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
}

const BASE_URL = "https://opensunsama.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "Open Sunsama";

/**
 * Hook for managing per-page SEO meta tags
 * Updates document title and meta tags dynamically
 */
export function useSEO(config: SEOConfig) {
  useEffect(() => {
    const { title, description, canonical, ogImage, ogType = "website", noindex } = config;
    
    // Update document title
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    
    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      
      meta.content = content;
    };
    
    // Helper to update or create link tag
    const setLink = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      
      link.href = href;
    };
    
    // Basic meta tags
    setMeta("title", fullTitle);
    setMeta("description", description);
    
    // Robots
    if (noindex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
    }
    
    // Canonical URL
    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
    setLink("canonical", canonicalUrl);
    
    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE, true);
    setMeta("og:site_name", SITE_NAME, true);
    
    // Twitter Card
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:url", canonicalUrl);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);
    
    // Cleanup function to restore defaults on unmount
    return () => {
      document.title = `${SITE_NAME} - Open Source Daily Planner & Time Blocking App`;
    };
  }, [config.title, config.description, config.canonical, config.ogImage, config.ogType, config.noindex]);
}

// Pre-defined SEO configs for common pages
export const SEO_CONFIGS = {
  landing: {
    title: "Open Sunsama",
    description: "Daily planning, done right. The open-source daily planner for time-blocking, focused work, and AI integration. Control it from any agent: Claude, ChatGPT, Cursor, or any MCP client.",
    canonical: "/",
  },
  alternative: {
    sunsama: {
      title: "Open-Source Sunsama Alternative for Any AI Agent",
      description: "Open Sunsama is an open-source daily planner that works like Sunsama: a board of days, time blocking and focus mode. Self-host it and connect any AI agent.",
      canonical: "/alternative/sunsama",
    },
  },
  download: {
    title: "Download",
    description: "Download Open Sunsama for macOS, Windows, and Linux. Native desktop apps with system tray integration, global hotkeys, and offline support.",
    canonical: "/download",
  },
  login: {
    title: "Sign In",
    description: "Sign in to your Open Sunsama account to access your daily planner and time-blocked schedule.",
    canonical: "/login",
    noindex: true,
  },
  register: {
    title: "Create Account",
    description: "Create your Open Sunsama account. Start time-blocking your day and connect the AI agent you already use.",
    canonical: "/register",
    noindex: true,
  },
  privacy: {
    title: "Privacy Policy",
    description: "Open Sunsama privacy policy. Learn how we handle your data with transparency and respect for your privacy.",
    canonical: "/privacy",
  },
  terms: {
    title: "Terms of Service",
    description: "Open Sunsama terms of service. The terms and conditions for using our daily planner application.",
    canonical: "/terms",
  },
} as const;
