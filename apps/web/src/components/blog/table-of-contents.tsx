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

  // The active section is the last heading scrolled above the top ~120px
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = "";
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) current = heading.id;
        else break;
      }
      setActiveId(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
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
      <p className="mb-3 flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <List className="h-3.5 w-3.5" />
        On this page
      </p>
      <ul className="border-l border-border/70 dark:border-white/[0.08]">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              aria-current={activeId === heading.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pr-2 text-[13px] leading-snug transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                heading.level === 3 ? "pl-6 text-[12.5px]" : "pl-3.5",
                activeId === heading.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground"
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

  // FAQ questions are listed under their one "Frequently asked questions" entry
  const elements = container.querySelectorAll(
    'h2, h3:not(section[aria-labelledby="faq"] h3)'
  );

  // Repeated headings ("Key features" under each app) get -2, -3... so anchors stay unique
  const used = new Set<string>();
  elements.forEach((element) => {
    const text = element.textContent?.trim() || "";
    let id =
      element.id ||
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    used.add(id);
    element.id = id;

    headings.push({
      id,
      text,
      level: element.tagName === "H2" ? 2 : 3,
    });
  });

  return headings;
}
