/**
 * Scroll-told walk-through (the home page's "How it works"): the product frame
 * stays pinned while each step's copy scrolls past, and the frame cross-fades
 * to that step's real recording, which plays only while its step is active.
 * Below `lg` it becomes a stack of clips that play as they scroll into view.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Clip } from "@/components/blog/media";
import { Reveal, useScrollProgress } from "@/components/landing/motion";
import { BrowserFrame } from "@/components/landing/product-shot";
import { cn } from "@/lib/utils";
import { ClipPlayer } from "./clip-player";
import { RichText } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { CONTAINER, SECTION } from "./tokens";

export interface PinnedStep {
  key: string;
  icon?: LucideIcon;
  eyebrow: string;
  title: string;
  /** Supports the content modules' inline markup. */
  body: string;
  /** Clip id from blog-media.json. */
  clip?: string;
  /** Replaces the clip's poster (and shows alone when there is no clip). */
  still?: React.ReactNode;
  /** Zoom into part of a still that has no clip. */
  zoom?: { scale: number; origin: string };
  link?: { label: string; href: string };
}

/** Height of each step's scroll band on desktop. */
const STEP_VH = 85;

function StepCopy({ step, active }: { step: PinnedStep; active: boolean }) {
  const Icon = step.icon;
  return (
    <div className={cn("transition-[opacity,transform] duration-500 lg:max-w-[400px]", active ? "opacity-100" : "lg:opacity-30")}>
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {step.eyebrow}
      </div>
      <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.025em] md:text-[32px]">{step.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
        <RichText text={step.body} />
      </p>
      {step.link && (
        <Link
          to={step.link.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-foreground/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {step.link.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function StoryPinned({
  id,
  steps,
  eyebrow,
  heading,
  lead,
  header,
  className,
}: {
  id?: string;
  steps: PinnedStep[];
  eyebrow?: string;
  heading?: string;
  lead?: string;
  /** Replaces the default SectionHeading (the home page keeps its own). */
  header?: React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = React.useState(0);
  const containerRef = useScrollProgress<HTMLDivElement>("sticky", {
    onProgress: (p) => {
      const next = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
      setActive((current) => (current === next ? current : next));
    },
  });
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section id={id} className={cn(SECTION, className)} aria-labelledby={header ? undefined : headingId}>
      <div className={CONTAINER}>
        {header ?? (heading && <SectionHeading id={headingId} eyebrow={eyebrow} heading={heading} lead={lead} />)}

        {/* Desktop: pinned frame + scrolling copy. */}
        <div
          ref={containerRef}
          className="relative mt-16 hidden lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
          style={{ height: `${steps.length * STEP_VH}vh` }}
        >
          <div className="relative">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center" style={{ height: `${STEP_VH}vh` }}>
                <StepCopy step={step} active={i === active} />
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="sticky" style={{ top: "calc(50vh - 220px)" }}>
              <div className="flex items-center gap-4">
                <BrowserFrame className="flex-1">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {steps.map((step, i) => (
                      <div
                        key={step.key}
                        className={cn(
                          "absolute inset-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                          i === active ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                          // Recordings already frame their subject; only stills zoom in
                          transform:
                            step.clip || !step.zoom
                              ? `scale(${i === active ? 1 : 0.98})`
                              : `scale(${step.zoom.scale * (i === active ? 1 : 0.98)})`,
                          transformOrigin: step.zoom?.origin ?? "50% 0%",
                        }}
                        aria-hidden={i !== active}
                      >
                        {step.clip ? (
                          <ClipPlayer id={step.clip} label={step.title} active={i === active} poster={step.still} />
                        ) : (
                          step.still
                        )}
                      </div>
                    ))}
                  </div>
                </BrowserFrame>
                {/* Progress rail */}
                <div className="flex flex-col items-center gap-2" aria-hidden>
                  {steps.map((step, i) => (
                    <span
                      key={step.key}
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

        {/* Phones and tablets: stacked. */}
        <div className="mt-14 space-y-16 lg:hidden">
          {steps.map((step) => (
            <Reveal key={step.key} className="space-y-6 [&_figure]:my-0">
              <StepCopy step={step} active />
              {step.clip ? (
                <Clip id={step.clip} />
              ) : (
                <BrowserFrame>
                  <div className="relative aspect-[16/10] w-full overflow-hidden">{step.still}</div>
                </BrowserFrame>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
