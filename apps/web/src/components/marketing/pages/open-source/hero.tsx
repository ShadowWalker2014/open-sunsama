/**
 * Hero for /open-source-task-manager. The kit's PageHero, with the "Control it
 * from" chips swapped for the live repo bar (stars, license, latest release),
 * and a product frame whose address bar reads as your own server. Floating
 * chips show the one-command install and an agent at work.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingChip } from "@/components/landing/hero";
import { HeadlineReveal, introStyle, useIntro, useReducedMotion, useScrollProgress } from "@/components/landing/motion";
import { BrowserFrame } from "@/components/landing/product-shot";
import { getVideo, VideoLightbox } from "@/components/landing/video-lightbox";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ClipPlayer } from "@/components/marketing/clip-player";
import { RichText } from "@/components/marketing/rich-text";
import { PRIMARY_CTA, SUNRISE_GLOW } from "@/components/marketing/tokens";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import type { MarketingPageContent } from "@/content/marketing/types";
import { clockDuration } from "@/lib/blog-media";
import { cn } from "@/lib/utils";
import { RepoBar } from "./repo-bar";

function headlineLines(title: string, accent?: string) {
  const at = accent ? title.indexOf(accent) : -1;
  if (!accent || at < 0) return [{ text: title }];
  return [
    { text: title.slice(0, at).trim() },
    { text: accent, accent: true },
    { text: title.slice(at + accent.length).trim() },
  ].filter((line) => line.text);
}

export function OpenSourceHero({ page }: { page: MarketingPageContent }) {
  const { hero } = page;
  const ready = useIntro();
  const reduced = useReducedMotion();
  const tiltRef = useScrollProgress<HTMLDivElement>("page", { distance: 560 });
  const video = getVideo("tour");
  const chips = openSource.heroChips;

  return (
    <section className="relative pb-20 pt-8 md:pb-28 md:pt-12" aria-labelledby="page-title">
      <div className="container mx-auto max-w-6xl px-4">
        <Breadcrumbs items={page.breadcrumbs} path={page.path} className="mb-8 md:mb-10" />
        <div className="text-center">
          <div style={introStyle(ready, 0, reduced)}>
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur">
              {hero.badge && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {hero.badge}
                </span>
              )}
              <span>{hero.eyebrow}</span>
            </p>
          </div>

          <h1
            id="page-title"
            className="mx-auto mt-6 max-w-5xl text-balance text-[36px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px] md:text-[60px] lg:text-[64px]"
          >
            <HeadlineReveal lines={headlineLines(hero.title, hero.accent)} ready={ready} reduced={reduced} />
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-foreground/75 md:text-[18.5px]"
            style={introStyle(ready, 480, reduced)}
          >
            <RichText text={hero.answer} />
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row" style={introStyle(ready, 600, reduced)}>
            <Button size="lg" className={cn(PRIMARY_CTA, "w-full sm:w-auto")} asChild>
              <Link to="/register">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <VideoLightbox id="tour">
              <Button
                variant="outline"
                size="lg"
                className="group h-11 w-full gap-2.5 rounded-lg bg-background/70 pl-2 pr-4 text-[14px] backdrop-blur sm:w-auto"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
                </span>
                {hero.secondary && "label" in hero.secondary ? hero.secondary.label : "Watch the 1-minute tour"}
                {video && (
                  <span className="font-jetbrains text-[12px] tabular-nums text-muted-foreground">{clockDuration(video.duration)}</span>
                )}
              </Button>
            </VideoLightbox>
          </div>

          <div className="mt-8" style={introStyle(ready, 720, reduced)}>
            <RepoBar />
          </div>
        </div>

        {/* Product frame: leans back at the top of the page, flattens as you scroll. */}
        <div
          className="relative mx-auto mt-14 max-w-[1080px] md:mt-16"
          style={
            reduced
              ? undefined
              : {
                  transition: "opacity 1000ms cubic-bezier(0.2,0.8,0.2,1), transform 1200ms cubic-bezier(0.2,0.8,0.2,1)",
                  transitionDelay: "480ms",
                  opacity: ready ? 1 : 0,
                  transform: ready ? "none" : "translateY(40px)",
                }
          }
        >
          <div ref={tiltRef} className="relative [--p:0] [perspective:2200px]">
            <div
              className="relative origin-top will-change-transform"
              style={
                reduced
                  ? undefined
                  : {
                      transform:
                        "rotateX(calc((1 - var(--p)) * 12deg)) scale(calc(0.95 + var(--p) * 0.05)) translateY(calc((1 - var(--p)) * -8px))",
                    }
              }
            >
              <div className={cn(SUNRISE_GLOW, "-inset-x-16 -top-16 bottom-[20%]")} />
              <BrowserFrame className="relative" url="tasks.your-domain.com">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  {"clip" in hero.media && <ClipPlayer id={hero.media.clip} label={hero.media.alt} priority controls />}
                </div>
              </BrowserFrame>

              <FloatingChip className="-left-10 top-[16%]" depth={34} visible={ready} delay={1150} reduced={reduced}>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(228_14%_9%)] font-jetbrains text-[11px] font-bold text-[hsl(24_95%_60%)] dark:bg-white/10">
                  $
                </span>
                <span className="leading-tight">
                  <span className="block font-jetbrains text-[12px] font-semibold text-foreground">{chips.terminal.command}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {chips.terminal.detail}
                  </span>
                </span>
              </FloatingChip>

              <FloatingChip className="-right-8 bottom-[16%]" depth={-24} visible={ready} delay={1350} reduced={reduced}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[12px] font-semibold text-foreground">{chips.agent.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{chips.agent.detail}</span>
                </span>
              </FloatingChip>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
