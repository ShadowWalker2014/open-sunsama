import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./site-footer";
import { SiteHeader, SkipLink } from "./site-header";

/**
 * The shell for every public page: skip link, the home page's header and
 * footer, and the soft grid-and-glow backdrop behind the top of the page.
 */
export function MarketingLayout({
  children,
  backdrop = true,
  className,
}: {
  children: ReactNode;
  /** The grid and glow behind the top of the page. The home page draws its own. */
  backdrop?: boolean;
  className?: string;
}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className={cn("relative focus:outline-none", className)}>
        {backdrop && (
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden" aria-hidden>
            <div className="landing-grid absolute inset-0 opacity-70 dark:opacity-40" />
            <div className="absolute left-1/2 top-[-180px] h-[520px] w-[900px] max-w-[140vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.15),transparent)] blur-2xl" />
            <div className="absolute left-[-8%] top-[160px] h-[360px] w-[480px] rounded-full bg-[radial-gradient(closest-side,rgb(244_63_94/0.11),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgb(244_63_94/0.14),transparent)]" />
            <div className="absolute right-[-6%] top-[80px] h-[380px] w-[500px] rounded-full bg-[radial-gradient(closest-side,rgb(245_158_11/0.16),transparent)] blur-2xl" />
          </div>
        )}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
