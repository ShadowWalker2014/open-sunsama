import { CountUp, Reveal } from "@/components/landing/motion";
import type { StatItem } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { GITHUB_URL, useGitHubStars } from "./site-header";
import { CONTAINER } from "./tokens";

/**
 * A strip of true numbers only: 24 MCP tools, desktop apps for 3 OSes, the
 * live GitHub star count. Never user counts, ratings or logos we can't back.
 */
export function StatsStrip({ items, className }: { items: StatItem[]; className?: string }) {
  const stars = useGitHubStars();
  return (
    <div className={cn(CONTAINER, "py-6", className)}>
      <Reveal>
        <ul
          className={cn(
            "grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 dark:border-white/[0.08]",
            items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
          )}
        >
          {items.map((item) => {
            const live = "live" in item;
            const value = live ? (stars !== null ? String(stars) : "Open") : item.value;
            const label = live && stars === null ? "Source on GitHub" : item.label;
            const content = (
              <>
                <span className="block text-[30px] font-semibold tabular-nums leading-none tracking-[-0.03em] md:text-[36px]">
                  {/^\d+$/.test(value) ? <CountUp value={value} /> : value}
                </span>
                <span className="mt-2 block text-[11.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
              </>
            );
            return (
              <li key={item.label} className="flex bg-background">
                {live ? (
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[112px] w-full flex-col justify-center px-5 py-6 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-7"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex min-h-[112px] w-full flex-col justify-center px-5 py-6 md:px-7">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Reveal>
    </div>
  );
}
