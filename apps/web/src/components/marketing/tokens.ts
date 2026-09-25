/**
 * Class strings shared by the marketing kit. They mirror the home page
 * (components/landing), so every marketing page reads as one site.
 */

/** Page width for sections. */
export const CONTAINER = "container mx-auto max-w-6xl px-4";

/** Vertical rhythm between sections, with the home page's hairline divider. */
export const SECTION = "relative scroll-mt-16 border-t border-border/50 py-20 md:py-28";

export const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.14em] text-primary";

/** Section h2. Headings on these pages are full sentences, so one step smaller than the home page. */
export const H2 = "text-balance text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[40px]";

export const LEAD = "text-pretty text-[16px] leading-relaxed text-muted-foreground md:text-[17px]";

export const H3 = "text-[19px] font-semibold leading-snug tracking-[-0.02em] md:text-[22px]";

export const BODY = "text-[15px] leading-relaxed text-muted-foreground md:text-[15.5px]";

/** Brand gradient text (the home page's "done right."). */
export const ACCENT_TEXT =
  "bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] bg-clip-text text-transparent";

/** Primary CTA button, matching the home page hero. */
export const PRIMARY_CTA = "h-11 rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]";

/** Card surface used by steps, related links and panels. */
export const CARD =
  "rounded-2xl border border-border/70 bg-card shadow-[0_1px_0_0_hsl(var(--foreground)/0.03)] dark:border-white/[0.08]";

/** Media components add their own margin for blog prose; kit layouts set their own. */
export const MEDIA_WRAP = "min-w-0 [&_figure]:my-0";

/** The home page's sunrise glow behind product frames. */
export const SUNRISE_GLOW =
  "pointer-events-none absolute -z-10 rounded-[48px] bg-[radial-gradient(55%_65%_at_50%_18%,rgb(251_191_36/0.38),rgb(249_115_22/0.24)_38%,rgb(244_63_94/0.12)_62%,transparent_78%)] blur-2xl dark:bg-[radial-gradient(55%_65%_at_50%_18%,rgb(251_191_36/0.26),rgb(249_115_22/0.2)_38%,rgb(244_63_94/0.12)_62%,transparent_78%)]";

/** Icon tile colors, in the home page's sunrise order. */
export const SUNRISE = ["#F59E0B", "#F97316", "#F43F5E", "#EC4899", "#A855F7", "#6366F1"] as const;

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
