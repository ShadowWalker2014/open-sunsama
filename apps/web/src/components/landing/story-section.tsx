/**
 * Scroll-told feature tour: the product frame stays pinned while each step's
 * copy scrolls past, and the frame cross-fades to that step's real recording,
 * which plays muted while its step is active. On small screens it becomes a
 * simple stack of clips that play as they scroll into view.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, CheckCircle2, Command, Lightbulb, LayoutGrid, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, useScrollProgress } from "./motion";
import { BrowserFrame, ThemedShot, type ShotName } from "./product-shot";
import { Clip } from "@/components/blog/media";
import { useIsDark, usePrefersReducedMotion } from "@/components/blog/media/hooks";
import { BLOG_MEDIA } from "@/lib/blog-media";

interface Step {
  shot: ShotName;
  /** Real recording from blog-media.json; the screenshot shows until it plays. */
  clip?: string;
  icon: typeof LayoutGrid;
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
  /** Zoom into the part of the screenshot this step is about. */
  zoom: { scale: number; origin: string };
}

const STEPS: Step[] = [
  {
    shot: "board",
    clip: "plan-day",
    icon: LayoutGrid,
    eyebrow: "Plan",
    title: "Plan today on a board.",
    body: "Drag tasks between days, set P0–P3 priorities, and add estimates and subtasks. Each day shows how much you've planned against the time you actually have.",
    href: "/features/kanban",
    zoom: { scale: 1, origin: "50% 0%" },
  },
  {
    shot: "calendar-week",
    clip: "time-block",
    icon: Calendar,
    eyebrow: "Time-block",
    title: "Give every task a time.",
    body: "Drop tasks onto the calendar to see what really fits. Blocks link back to their tasks, and your Google, Outlook, and iCloud calendars sync right in.",
    href: "/features/time-blocking",
    zoom: { scale: 1.08, origin: "45% 35%" },
  },
  {
    shot: "focus",
    clip: "focus",
    icon: Timer,
    eyebrow: "Focus",
    title: "Then do one thing at a time.",
    body: "Focus mode puts a single task and a timer on screen. Actual time is tracked against your estimate, so tomorrow's plan gets more honest.",
    href: "/features/focus-mode",
    zoom: { scale: 1.18, origin: "50% 12%" },
  },
  {
    shot: "command-palette",
    clip: "command-palette",
    icon: Command,
    eyebrow: "Navigate",
    title: "Find anything with ⌘K.",
    body: "Jump to any task, idea, or setting in a keystroke. Search spans tasks, ideas, and events, and every action has a shortcut.",
    href: "/features/command-palette",
    zoom: { scale: 1.12, origin: "50% 42%" },
  },
  {
    shot: "task-detail",
    clip: "shutdown",
    icon: CheckCircle2,
    eyebrow: "Shut down",
    title: "Close the day on purpose.",
    body: "Check off what you finished. Anything left rolls over to tomorrow, so nothing slips through and you can stop on time.",
    zoom: { scale: 1, origin: "50% 0%" },
  },
  {
    shot: "ideas",
    clip: "ideas",
    icon: Lightbulb,
    eyebrow: "Someday",
    title: "Park ideas without losing them.",
    body: "Trello-style boards for bets, side projects, and someday-maybes. When an idea's time comes, promote it to a real task in one click.",
    zoom: { scale: 1, origin: "50% 0%" },
  },
];

function StepCopy({ step, active }: { step: Step; active: boolean }) {
  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-500 lg:max-w-[400px]",
        active ? "opacity-100" : "lg:opacity-30"
      )}
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
        <step.icon className="h-3.5 w-3.5" />
        {step.eyebrow}
      </div>
      <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[32px]">{step.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">{step.body}</p>
      {step.href && (
        <Link
          to={step.href}
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground/80 hover:text-primary"
        >
          Learn more
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Recordings fade in from and out to the page color; loop inside the fades. */
const FADE_SECONDS = 0.5;

/**
 * The pinned frame's content for one step: its recording, playing only while
 * the step is active, over the still screenshot (shown before it loads, and to
 * readers who prefer reduced motion).
 */
function StepMedia({ step, active }: { step: Step; active: boolean }) {
  const theme = useIsDark() ? "dark" : "light";
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const src = step.clip ? BLOG_MEDIA.clips[step.clip]?.[theme] : undefined;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && !reducedMotion) {
      if (video.currentTime < FADE_SECONDS) video.currentTime = FADE_SECONDS;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, reducedMotion, src]);

  const loopInsideFades = () => {
    const video = videoRef.current;
    if (video?.duration && video.currentTime > video.duration - FADE_SECONDS) {
      video.currentTime = FADE_SECONDS;
    }
  };

  return (
    <>
      <ThemedShot name={step.shot} alt={step.title} className={src ? "absolute inset-0 h-full object-cover object-top" : undefined} />
      {src && (
        <video
          key={theme}
          ref={videoRef}
          src={src.mp4}
          poster={src.poster}
          muted
          playsInline
          preload="none"
          aria-label={step.title}
          onTimeUpdate={loopInsideFades}
          onEnded={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = FADE_SECONDS;
            video.play().catch(() => {});
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </>
  );
}

export function StorySection() {
  const [active, setActive] = React.useState(0);
  const containerRef = useScrollProgress<HTMLDivElement>("sticky", {
    onProgress: (p) => {
      const next = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length * 0.999));
      setActive((current) => (current === next ? current : next));
    },
  });

  return (
    <section id="tour" className="relative scroll-mt-16 border-t border-border/50 py-24 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">
            A calmer way to run your day.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Sunsama-style daily planning: decide what matters, give it a time, and do it. Every clip below
            is a real recording of the app.
          </p>
        </Reveal>

        {/* Desktop: pinned frame + scrolling copy. */}
        <div
          ref={containerRef}
          className="relative mt-16 hidden lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
          style={{ height: `${STEPS.length * 85}vh` }}
        >
          <div className="relative">
            {STEPS.map((step, i) => (
              <div key={step.shot} className="flex items-center" style={{ height: `${85}vh` }}>
                <StepCopy step={step} active={i === active} />
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="sticky" style={{ top: "calc(50vh - 220px)" }}>
              <div className="flex items-center gap-4">
                <BrowserFrame className="flex-1">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {STEPS.map((step, i) => (
                      <div
                        key={step.shot}
                        className={cn(
                          "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                          i === active ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                          // Recordings already frame their subject; only stills zoom in
                          transform: step.clip
                            ? `scale(${i === active ? 1 : 0.98})`
                            : i === active
                              ? `scale(${step.zoom.scale})`
                              : `scale(${step.zoom.scale * 0.98})`,
                          transformOrigin: step.zoom.origin,
                        }}
                        aria-hidden={i !== active}
                      >
                        <StepMedia step={step} active={i === active} />
                      </div>
                    ))}
                  </div>
                </BrowserFrame>
                {/* Progress rail */}
                <div className="flex flex-col items-center gap-2" aria-hidden>
                  {STEPS.map((step, i) => (
                    <span
                      key={step.shot}
                      className={cn(
                        "w-1.5 rounded-full transition-all duration-500",
                        i === active ? "h-6 bg-primary" : i < active ? "h-1.5 bg-primary/40" : "h-1.5 bg-border"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile and tablet: stacked. */}
        <div className="mt-14 space-y-16 lg:hidden">
          {STEPS.map((step) => (
            <Reveal key={step.shot} className="space-y-6">
              <StepCopy step={step} active />
              {step.clip ? (
                <Clip id={step.clip} />
              ) : (
                <BrowserFrame>
                  <ThemedShot name={step.shot} alt={step.title} />
                </BrowserFrame>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
