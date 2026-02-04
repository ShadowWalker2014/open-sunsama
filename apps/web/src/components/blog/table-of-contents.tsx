import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

export interface TOCHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TOCHeading[];
  className?: string;
}

/**
 * Table of Contents component for blog posts
 * Shows H2 and H3 headings with smooth scroll navigation
 * Highlights current section based on scroll position
 */
export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  // Set up intersection observer to track which heading is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        const offset = 100; // Account for sticky header
        const top =
          element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        setActiveId(id);
        // Update URL hash without jumping
        window.history.pushState(null, "", `#${id}`);
      }
    },
    []
  );

  if (headings.length === 0) return null;

  return (
    <nav
      className={cn(
        "sticky top-24 max-h-[calc(100vh-8rem)] overflow-auto",
        className
      )}
      aria-label="Table of Contents"
    >
      <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold text-foreground">
        <List className="h-4 w-4" />
        <span>On this page</span>
      </div>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                "block py-1 text-[12px] leading-relaxed transition-colors hover:text-foreground",
                heading.level === 3 && "pl-3",
                activeId === heading.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Extract headings from blog/docs content for TOC
 * Parses the DOM to find H2 and H3 elements within the prose container
 */
export function extractHeadings(): TOCHeading[] {
  const headings: TOCHeading[] = [];
  // Support both blog-prose and docs-prose containers
  const container =
    document.querySelector(".blog-prose") ||
    document.querySelector(".docs-prose");

  if (!container) return headings;

  const elements = container.querySelectorAll("h2, h3");

  elements.forEach((element) => {
    const text = element.textContent?.trim() || "";
    // Generate ID from text if not present
    let id = element.id;
    if (!id) {
      id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      element.id = id;
    }

    headings.push({
      id,
      text,
      level: element.tagName === "H2" ? 2 : 3,
    });
  });

  return headings;
}
