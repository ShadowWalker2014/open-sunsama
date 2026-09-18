/**
 * Real product screenshots (captured by scripts/readme-media/capture.mjs) in a
 * browser frame. Light and dark variants swap with the site theme; the hidden
 * one is never fetched because both are lazy unless `priority`.
 */

import { cn } from "@/lib/utils";

export type ShotName = "board" | "calendar-week" | "focus" | "command-palette" | "ideas" | "task-detail";

export function ThemedShot({
  name,
  alt,
  priority = false,
  className,
}: {
  name: ShotName;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const common = {
    width: 2880,
    height: 1800,
    decoding: "async" as const,
    draggable: false,
  };
  return (
    <>
      <img
        {...common}
        src={`/landing/${name}-light.webp`}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn("block h-auto w-full select-none dark:hidden", className)}
      />
      <img
        {...common}
        src={`/landing/${name}-dark.webp`}
        alt={alt}
        loading="lazy"
        className={cn("hidden h-auto w-full select-none dark:block", className)}
      />
    </>
  );
}

/** macOS-style window chrome matching the app's own surfaces. */
export function BrowserFrame({
  children,
  url = "opensunsama.com/app",
  className,
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-background shadow-[0_1px_0_0_hsl(var(--foreground)/0.04),0_24px_80px_-24px_hsl(var(--shadow-color)/0.35),0_12px_32px_-12px_rgb(0_0_0/0.18)] dark:border-white/10",
        className
      )}
    >
      <div className="flex h-9 items-center gap-3 border-b border-border/60 bg-muted/40 px-3.5 dark:border-white/[0.06]">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-5 min-w-0 max-w-[240px] flex-1 items-center justify-center gap-1.5 rounded-md bg-background/80 px-2 text-[10.5px] text-muted-foreground ring-1 ring-border/60 dark:bg-white/[0.04] dark:ring-white/[0.06]">
          <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden>
            <path
              fill="currentColor"
              d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z"
            />
          </svg>
          <span className="truncate">{url}</span>
        </div>
        <div className="w-[46px]" aria-hidden />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Feature-page hero visual: a real screenshot in the browser frame that
 * settles from a slight tilt to flat as it scrolls into view.
 */
export function FeatureShot({ name, alt }: { name: ShotName; alt: string }) {
  return (
    <div className="relative mx-auto max-w-5xl [perspective:2000px]">
      <div className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 -z-10 rounded-[36px] bg-[radial-gradient(60%_60%_at_50%_30%,hsl(var(--primary)/0.18),transparent_70%)] blur-2xl" />
      <div className="landing-settle origin-top">
        <BrowserFrame>
          <ThemedShot name={name} alt={alt} priority />
        </BrowserFrame>
      </div>
    </div>
  );
}
