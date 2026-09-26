/**
 * The hero's proof that the code is open: the real repo, its live star count,
 * the license, and the latest desktop release. Every value is fetched or read
 * from the LICENSE file; nothing is filled in by hand. While a value is
 * unknown (or GitHub rate-limits us), the cell shows a plain link instead.
 */

import * as React from "react";
import { Github, Scale, Star, Tag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useGitHubStars } from "@/components/marketing/site-header";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import { cn } from "@/lib/utils";

interface LatestRelease {
  version: string;
  /** ISO date the release was published. */
  date: string;
}

const RELEASE_CACHE = "os-latest-release";

/**
 * Newest desktop release from the API's /releases/latest (the same source as
 * /download). Only fetched in production builds: the API allows the site's
 * own origin, and local dev has no API running.
 */
export function useLatestRelease(): LatestRelease | null {
  const [release, setRelease] = React.useState<LatestRelease | null>(() => {
    try {
      const cached = sessionStorage.getItem(RELEASE_CACHE);
      return cached ? (JSON.parse(cached) as LatestRelease) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    if (release || !import.meta.env.PROD) return;
    const api = import.meta.env.VITE_API_URL || "https://api.opensunsama.com";
    let cancelled = false;
    fetch(`${api}/releases/latest`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { success?: boolean; data?: Record<string, { version?: string; createdAt?: string } | null> } | null) => {
        if (cancelled || !body?.success || !body.data) return;
        const newest = Object.values(body.data)
          .filter((r): r is { version: string; createdAt: string } => Boolean(r?.version && r.createdAt))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        if (!newest) return;
        const next = { version: newest.version, date: newest.createdAt };
        setRelease(next);
        try {
          sessionStorage.setItem(RELEASE_CACHE, JSON.stringify(next));
        } catch {
          // Storage unavailable; it refetches next visit.
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [release]);

  return release;
}

/** "today", "yesterday", "5 days ago", or the date once it is older than a month. */
export function releasedAgo(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 31) return `${days} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const CELL =
  "group flex min-w-0 flex-col justify-center px-3 py-2.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4";
const LABEL = "flex items-center gap-1.5 truncate text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground";
const VALUE = "mt-1 truncate font-jetbrains text-[13px] font-semibold tabular-nums text-foreground";
const META = "mt-0.5 truncate text-[11.5px] text-muted-foreground transition-colors group-hover:text-foreground/80";

export function RepoBar({ className }: { className?: string }) {
  const stars = useGitHubStars();
  const release = useLatestRelease();
  const [owner, name] = openSource.repo.split("/");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[760px] overflow-hidden rounded-2xl border border-border/70 bg-background/80 text-left shadow-[0_1px_0_0_hsl(var(--foreground)/0.03),0_12px_32px_-20px_hsl(var(--shadow-color)/0.4)] backdrop-blur dark:border-white/[0.09] dark:bg-[hsl(228_14%_9%/0.8)]",
        "sm:flex sm:items-stretch",
        className
      )}
    >
      <a
        href={openSource.github}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:border-white/[0.07] sm:border-b-0 sm:border-r"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Github className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-jetbrains text-[13px] text-muted-foreground">
            {owner}/<span className="font-semibold text-foreground">{name}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.15)]" aria-hidden />
            Public repo · {openSource.language}
          </span>
        </span>
      </a>

      <div className="grid flex-1 grid-cols-[1fr_1.3fr_1fr] divide-x sm:grid-cols-3 divide-border/60 dark:divide-white/[0.07]">
        <a href={`${openSource.github}/stargazers`} target="_blank" rel="noopener noreferrer" className={CELL}>
          <span className={LABEL}>
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            Stars
          </span>
          <span className={VALUE}>{stars !== null ? stars.toLocaleString("en-US") : "Star it"}</span>
          <span className={META}>on GitHub</span>
        </a>
        <a href={openSource.licenseUrl} target="_blank" rel="noopener noreferrer" className={CELL}>
          <span className={LABEL}>
            <Scale className="h-3 w-3 shrink-0" aria-hidden />
            License
          </span>
          <span className={cn(VALUE, "font-sans tracking-[-0.01em]")}>{openSource.licenseName}</span>
          <span className={META}>Personal use OK</span>
        </a>
        <Link to="/download" className={CELL}>
          <span className={LABEL}>
            <Tag className="h-3 w-3 shrink-0" aria-hidden />
            Release
          </span>
          <span className={VALUE}>{release ? `v${release.version}` : "Download"}</span>
          <span className={META}>{release ? releasedAgo(release.date) : "Desktop apps"}</span>
        </Link>
      </div>
    </div>
  );
}
