import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useIntro, useReducedMotion } from "@/components/landing/motion";

interface BlogHeroProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
}

/** Same staggered intro as the home page hero. */
function introStyle(
  ready: boolean,
  delay: number,
  reduced: boolean
): React.CSSProperties {
  if (reduced) return {};
  return {
    transition:
      "opacity 700ms cubic-bezier(0.2,0.8,0.2,1), transform 800ms cubic-bezier(0.2,0.8,0.2,1), filter 700ms ease",
    transitionDelay: `${delay}ms`,
    opacity: ready ? 1 : 0,
    transform: ready ? "none" : "translateY(12px)",
    filter: ready ? "none" : "blur(6px)",
  };
}

/** Blog index hero: pill to the AI guides, headline with the orange accent, search. */
export function BlogHero({ searchInput, onSearchChange }: BlogHeroProps) {
  const ready = useIntro();
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-10 pt-14 md:pb-14 md:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid absolute inset-0 opacity-70 dark:opacity-40" />
        <div className="absolute left-1/2 top-[-180px] h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.16),transparent)] blur-2xl motion-safe:animate-[landing-drift_18s_ease-in-out_infinite]" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 text-center">
        <div style={introStyle(ready, 0, reduced)}>
          <Link
            to="/blog"
            search={{ tag: "ai", page: undefined, q: undefined }}
            className="group inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              New
            </span>
            <span className="truncate">
              Guides to planning your day with Claude and ChatGPT
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <h1
          className="mx-auto mt-7 max-w-3xl text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px] md:text-[60px]"
          style={introStyle(ready, 90, reduced)}
        >
          <span className="block">Guides to planning,</span>
          <span className="block bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] bg-clip-text text-transparent">
            done right.
          </span>
        </h1>

        <p
          className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground md:text-[18px]"
          style={introStyle(ready, 240, reduced)}
        >
          Honest app comparisons, time-blocking playbooks, and how to run your
          day from Claude or ChatGPT.
        </p>

        <div
          className="relative mx-auto mt-8 max-w-lg"
          style={introStyle(ready, 360, reduced)}
        >
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <Search className="pointer-events-none absolute left-4 z-10 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="blog-search"
            type="search"
            placeholder="Search articles"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 w-full rounded-xl border border-border/80 bg-background/80 pl-11 pr-11 text-[15px] shadow-[0_1px_0_0_hsl(var(--foreground)/0.03),0_12px_32px_-16px_hsl(var(--shadow-color)/0.25)] outline-none backdrop-blur transition-[border-color,box-shadow] placeholder:text-muted-foreground/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/15 dark:border-white/10 dark:bg-white/[0.03] [&::-webkit-search-cancel-button]:hidden"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
