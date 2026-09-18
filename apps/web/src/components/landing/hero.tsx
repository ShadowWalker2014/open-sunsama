import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Command, LayoutGrid, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BorderBeam } from "./border-beam";
import { useIntro, useReducedMotion, useScrollProgress } from "./motion";
import { BrowserFrame, ThemedShot, type ShotName } from "./product-shot";

const HEADLINE = [
  { text: "Daily planning,", accent: false },
  { text: "done right.", accent: true },
];

const VIEWS: Array<{ id: ShotName; label: string; icon: typeof LayoutGrid; alt: string }> = [
  {
    id: "board",
    label: "Board",
    icon: LayoutGrid,
    alt: "Open Sunsama board with today's prioritized tasks and a time-blocked schedule",
  },
  {
    id: "calendar-week",
    label: "Calendar",
    icon: Calendar,
    alt: "Week calendar with color-coded time blocks",
  },
  { id: "focus", label: "Focus", icon: Timer, alt: "Focus mode with a running timer" },
  {
    id: "command-palette",
    label: "Search",
    icon: Command,
    alt: "Command palette searching tasks and ideas",
  },
];

const AUTOPLAY_MS = 4800;
const WORKS_WITH = ["Claude", "ChatGPT", "Claude Code", "Cursor", "VS Code", "Any MCP client"];

/** Staggered intro: each item transitions from its "before" state after mount. */
function introStyle(ready: boolean, delay: number, reduced: boolean): React.CSSProperties {
  if (reduced) return {};
  return {
    transition:
      "opacity 700ms cubic-bezier(0.2,0.8,0.2,1), transform 800ms cubic-bezier(0.2,0.8,0.2,1), filter 700ms ease",
    transitionDelay: `${delay}ms`,
    opacity: ready ? 1 : 0,
    transform: ready ? "none" : "translateY(14px)",
    filter: ready ? "none" : "blur(6px)",
  };
}

function Showcase({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const tiltRef = useScrollProgress<HTMLDivElement>("page", { distance: 560 });

  React.useEffect(() => {
    if (paused || reduced || !ready) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % VIEWS.length), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, reduced, ready]);

  return (
    <div
      className="relative mx-auto mt-14 max-w-[1120px] md:mt-16"
      style={
        reduced
          ? undefined
          : {
              transition: "opacity 1000ms cubic-bezier(0.2,0.8,0.2,1), transform 1200ms cubic-bezier(0.2,0.8,0.2,1)",
              transitionDelay: "520ms",
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(48px)",
            }
      }
    >
      {/* Scroll-linked tilt: leans back at the top of the page, flattens as you scroll. */}
      <div
        ref={tiltRef}
        className="relative [--p:0] [perspective:2200px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="relative origin-top will-change-transform"
          style={
            reduced
              ? undefined
              : {
                  transform:
                    "rotateX(calc((1 - var(--p)) * 14deg)) scale(calc(0.94 + var(--p) * 0.06)) translateY(calc((1 - var(--p)) * -8px))",
                }
          }
        >
          <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_30%,hsl(var(--primary)/0.22),transparent_70%)] blur-2xl" />
          <BrowserFrame className="relative">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {VIEWS.map((view, i) => (
                <div
                  key={view.id}
                  className={cn(
                    "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                    i === active ? "opacity-100 [transform:none]" : "opacity-0 [transform:scale(1.015)]"
                  )}
                  aria-hidden={i !== active}
                >
                  <ThemedShot name={view.id} alt={view.alt} priority={i === 0} />
                </div>
              ))}
            </div>
            <BorderBeam size={260} duration={12} delay={2} />
          </BrowserFrame>

          {/* Floating details, parallaxed against the frame. */}
          <FloatingChip
            className="-left-10 top-[22%]"
            depth={34}
            visible={ready}
            delay={1250}
            reduced={reduced}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-semibold text-foreground">Claude connected</span>
              <span className="block text-[11px] text-muted-foreground">Planned 3 blocks for you</span>
            </span>
          </FloatingChip>

          <FloatingChip
            className="-right-8 top-[9%] !p-0"
            depth={-26}
            visible={ready}
            delay={1450}
            reduced={reduced}
          >
            <div
              className="w-[204px] rounded-md border-l-[3px] px-2 py-1"
              style={{ backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.6)" }}
            >
              <p className="truncate text-sm font-medium text-foreground">Deep work: Q4 roadmap</p>
              <p className="truncate text-xs text-muted-foreground">9:30 - 11:00 AM</p>
            </div>
          </FloatingChip>

          <FloatingChip
            className="-right-6 bottom-[14%]"
            depth={22}
            visible={ready}
            delay={1650}
            reduced={reduced}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]" />
            <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">23:02</span>
            <span className="font-mono text-[12px] text-muted-foreground">/ 1:30</span>
            <span className="ml-1 text-[11px] text-muted-foreground">Focus</span>
          </FloatingChip>
        </div>
      </div>

      {/* View switcher with autoplay progress. */}
      <div className="mt-8 flex justify-center">
        <div
          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 backdrop-blur"
          role="tablist"
          aria-label="Product views"
        >
          {VIEWS.map((view, i) => (
            <button
              key={view.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => {
                setActive(i);
                setPaused(true);
              }}
              className={cn(
                "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors sm:px-3.5 sm:text-[13px]",
                i === active
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <view.icon className={cn("hidden h-3.5 w-3.5 sm:block", i === active ? "text-primary" : "")} />
              <span>{view.label}</span>
              {i === active && !paused && !reduced && ready && (
                <span
                  key={`progress-${active}`}
                  className="absolute inset-x-3 bottom-0.5 h-[2px] origin-left rounded-full bg-primary/70"
                  style={{ animation: `landing-progress ${AUTOPLAY_MS}ms linear forwards` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingChip({
  children,
  className,
  depth,
  visible,
  delay,
  reduced,
}: {
  children: React.ReactNode;
  className?: string;
  /** Parallax distance in px as the page scrolls from 0 → 1 progress. */
  depth: number;
  visible: boolean;
  delay: number;
  reduced: boolean;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute z-10 hidden lg:block", className)}
      style={reduced ? undefined : { transform: `translateY(calc(var(--p) * ${depth}px))` }}
    >
      <div
        className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/90 p-2.5 pr-3.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.25)] backdrop-blur-md dark:border-white/10 dark:bg-[hsl(228_14%_11%/0.92)]"
        style={
          reduced
            ? undefined
            : {
                transition: "opacity 600ms ease, transform 700ms cubic-bezier(0.34,1.56,0.64,1)",
                transitionDelay: `${delay}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(10px) scale(0.92)",
              }
        }
      >
        {children}
      </div>
    </div>
  );
}

export function Hero() {
  const ready = useIntro();
  const reduced = useReducedMotion();
  let wordIndex = 0;

  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
      {/* Backdrop: fine grid + drifting glow. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="landing-grid absolute inset-0 opacity-70 dark:opacity-40" />
        <div
          className="absolute left-1/2 top-[-160px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.16),transparent)] blur-2xl motion-safe:animate-[landing-drift_18s_ease-in-out_infinite]"
          style={{ opacity: ready ? 1 : 0, transition: "opacity 1400ms ease" }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 text-center">
        <div style={introStyle(ready, 0, reduced)}>
          <Link
            to="/docs/$"
            params={{ _splat: "mcp/overview" }}
            className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              New
            </span>
            Control your planner from any AI agent
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <h1 className="mx-auto mt-7 max-w-4xl text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[56px] md:text-[68px]">
          {HEADLINE.map((line) => (
            <span key={line.text} className="block">
              {line.text.split(" ").map((word) => {
                const delay = 90 + wordIndex++ * 55;
                return (
                  <span key={`${line.text}-${word}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <span
                      className={cn(
                        "inline-block",
                        line.accent &&
                          "bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] bg-clip-text text-transparent"
                      )}
                      style={
                        reduced
                          ? undefined
                          : {
                              transition: "transform 900ms cubic-bezier(0.2,0.8,0.2,1), opacity 700ms ease",
                              transitionDelay: `${delay}ms`,
                              transform: ready ? "none" : "translateY(105%)",
                              opacity: ready ? 1 : 0,
                            }
                      }
                    >
                      {word}
                    </span>
                    {" "}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground md:text-[18px]"
          style={introStyle(ready, 520, reduced)}
        >
          The open-source daily planner for time-blocking, focused work, and seamless AI integration.
          Control it from any agent: Claude, ChatGPT, Cursor, or your own.
        </p>

        <div
          className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
          style={introStyle(ready, 640, reduced)}
        >
          <Button size="lg" className="h-11 rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]" asChild>
            <Link to="/register">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 rounded-lg bg-background/70 px-5 text-[14px] backdrop-blur" asChild>
            <a href="#ai">
              <Sparkles className="h-4 w-4 text-primary" />
              Connect your AI
            </a>
          </Button>
        </div>

        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] text-muted-foreground"
          style={introStyle(ready, 760, reduced)}
        >
          <span className="mr-1">Control it from</span>
          {WORKS_WITH.map((name) => (
            <span
              key={name}
              className="rounded-md border border-border/70 bg-background/60 px-2 py-0.5 font-medium text-foreground/80"
            >
              {name}
            </span>
          ))}
        </div>

        <Showcase ready={ready} reduced={reduced} />
      </div>
    </section>
  );
}
