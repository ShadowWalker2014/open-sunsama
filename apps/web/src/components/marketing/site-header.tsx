/**
 * The one header for every public page: home, features, compare, personas,
 * blog, docs, download and legal. Transparent at the top of the page, frosted
 * once you scroll. Below `lg` the links move into a menu sheet.
 *
 * Docs passes `leading` (its sidebar button) and `section` ("/ Docs").
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Github, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const GITHUB_URL = "https://github.com/ShadowWalker2014/open-sunsama";

// One request per page load, shared by every component that shows the count
let starsRequest: Promise<number | null> | null = null;
function fetchStars(): Promise<number | null> {
  starsRequest ??= fetch("https://api.github.com/repos/ShadowWalker2014/open-sunsama")
    .then((res) => (res.ok ? res.json() : null))
    .then((repo: { stargazers_count?: number } | null) =>
      typeof repo?.stargazers_count === "number" ? repo.stargazers_count : null
    )
    .catch(() => null);
  return starsRequest;
}

/** Live star count, cached for the session. Null until known (or when GitHub rate-limits us). */
export function useGitHubStars(): number | null {
  const [stars, setStars] = React.useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem("os-gh-stars");
      return cached ? Number(cached) : null;
    } catch {
      return null;
    }
  });
  React.useEffect(() => {
    if (stars !== null) return;
    fetchStars().then((count) => {
      if (count === null) return;
      setStars(count);
      try {
        sessionStorage.setItem("os-gh-stars", String(count));
      } catch {
        // Storage unavailable; the count just refetches next visit.
      }
    });
  }, [stars]);
  return stars;
}

const NAV: Array<{ label: string; href: string }> = [
  { label: "Features", href: "/#features" },
  { label: "AI native", href: "/#ai" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
  { label: "Download", href: "/download" },
];

const MENU_FEATURES: Array<[string, string]> = [
  ["Time blocking", "/features/time-blocking"],
  ["Kanban board", "/features/kanban"],
  ["Focus mode", "/features/focus-mode"],
  ["Calendar sync", "/features/calendar-sync"],
  ["AI and MCP", "/features/ai-integration"],
  ["Command palette", "/features/command-palette"],
];

const NAV_LINK =
  "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Internal links render as router links; hash links to the home page stay plain anchors. */
function NavLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (href.includes("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link
      to={href}
      search={href === "/blog" ? {} : undefined}
      className={className}
      onClick={onClick}
      activeProps={{ "aria-current": "page", className: "text-foreground" }}
    >
      {children}
    </Link>
  );
}

function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const item = "block rounded-lg px-3 py-2 text-[15px] text-foreground/85 transition-colors hover:bg-muted/70 hover:text-foreground";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[300px] flex-col gap-0 overflow-y-auto p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-5">
          <img src="/open-sunsama-logo.png" alt="" className="h-6 w-6 rounded-md object-cover" />
          <span className="text-[14px] font-semibold">Open Sunsama</span>
        </div>
        <nav className="flex-1 px-2 py-4" aria-label="Mobile">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Features</p>
          {MENU_FEATURES.map(([label, href]) => (
            <Link key={href} to={href} onClick={close} className={item}>
              {label}
            </Link>
          ))}
          <div className="my-3 border-t border-border/60" />
          {NAV.filter((n) => !n.href.includes("#")).map((n) => (
            <NavLink key={n.href} href={n.href} className={item} onClick={close}>
              {n.label}
            </NavLink>
          ))}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={cn(item, "flex items-center gap-2")}>
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>
        <div className="grid gap-2 border-t border-border/60 p-4">
          <Button variant="outline" className="h-10" asChild>
            <Link to="/login" onClick={close}>
              Sign in
            </Link>
          </Button>
          <Button className="h-10" asChild>
            <Link to="/register" onClick={close}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader({
  leading,
  section,
}: {
  /** Rendered before the logo, e.g. the docs sidebar button. */
  leading?: React.ReactNode;
  /** A sub-site label after the logo, e.g. { label: "Docs", href: "/docs" }. */
  section?: { label: string; href: string };
} = {}) {
  const stars = useGitHubStars();
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/60 bg-background/80 shadow-[0_1px_12px_-6px_rgb(0_0_0/0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src="/open-sunsama-logo.png" alt="Open Sunsama" className="h-7 w-7 rounded-lg object-cover" />
            <span className={cn("whitespace-nowrap text-[14px] font-semibold tracking-tight", section && "hidden sm:inline")}>
              Open Sunsama
            </span>
          </Link>
          {section && (
            <>
              <span className="text-muted-foreground/50" aria-hidden>
                /
              </span>
              <Link
                to={section.href}
                className="rounded-md text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {section.label}
              </Link>
            </>
          )}
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.label} href={n.href} className={NAV_LINK}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"
          >
            <Github className="h-3.5 w-3.5" />
            Star
            {stars !== null && (
              <span className="rounded bg-muted px-1.5 py-px text-[11px] tabular-nums text-foreground">{stars}</span>
            )}
          </a>
          <Button variant="ghost" size="sm" className="hidden h-8 px-3 text-[13px] sm:inline-flex" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="h-8 px-3 text-[13px]" asChild>
            <Link to="/register">Get started</Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

/** First focusable element on every public page: jumps past the header. */
export function SkipLink({ target = "main" }: { target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="sr-only z-[60] rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
    >
      Skip to content
    </a>
  );
}
