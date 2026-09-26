/**
 * Marketing page hero, built from the home page's parts: the eyebrow pill, the
 * word-by-word headline with the orange accent, a one-line answer, the two
 * CTAs, the "Control it from" chips, and a real clip in the browser frame
 * with the sunrise glow and a scroll-linked tilt.
 */

import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingChip, WORKS_WITH } from "@/components/landing/hero";
import { HeadlineReveal, introStyle, useIntro, useReducedMotion, useScrollProgress } from "@/components/landing/motion";
import { BrowserFrame } from "@/components/landing/product-shot";
import { getVideo, VideoLightbox } from "@/components/landing/video-lightbox";
import { BLOG_MEDIA, clockDuration } from "@/lib/blog-media";
import type { HeroChip, MediaRef, PageHeroContent } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { ClipPlayer } from "./clip-player";
import { RichText } from "./rich-text";
import { PRIMARY_CTA, SUNRISE_GLOW } from "./tokens";

/** Splits the title around its accent so each part can sit on its own line. */
function headlineLines(title: string, accent?: string) {
  const at = accent ? title.indexOf(accent) : -1;
  if (!accent || at < 0) return [{ text: title }];
  return [
    { text: title.slice(0, at).trim() },
    { text: accent, accent: true },
    { text: title.slice(at + accent.length).trim() },
  ].filter((line) => line.text);
}

function HeroFrameMedia({ media }: { media: MediaRef }) {
  if ("clip" in media) {
    return <ClipPlayer id={media.clip} label={media.alt} priority controls />;
  }
  if ("shot" in media) {
    const shot = BLOG_MEDIA.shots[media.shot];
    if (!shot) return null;
    const common = { width: shot.width, height: shot.height, alt: media.alt, decoding: "async" as const };
    return (
      <>
        <img {...common} src={shot.light} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-top dark:hidden" />
        <img {...common} src={shot.dark} loading="lazy" className="absolute inset-0 hidden h-full w-full object-cover object-top dark:block" />
      </>
    );
  }
  const video = getVideo(media.video);
  if (!video) return null;
  return (
    <VideoLightbox id={media.video}>
      <button type="button" aria-label={`Play video: ${video.title}`} className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <img src={video.poster} alt="" width={video.width} height={video.height} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform group-hover:scale-105">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        </span>
      </button>
    </VideoLightbox>
  );
}

const CHIP_POSITIONS = [
  { className: "-left-10 top-[20%]", depth: 34 },
  { className: "-right-8 top-[8%]", depth: -26 },
  { className: "-right-6 bottom-[14%]", depth: 22 },
];

function ChipBody({ chip }: { chip: HeroChip }) {
  if (chip.tone === "block") {
    // Mirrors components/calendar/time-block.tsx
    return (
      <div
        className="w-[210px] rounded-md border-l-[3px] px-2 py-1"
        style={{ backgroundColor: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.6)" }}
      >
        <p className="truncate text-sm font-medium text-foreground">{chip.title}</p>
        <p className="truncate text-xs text-muted-foreground">{chip.detail}</p>
      </div>
    );
  }
  if (chip.tone === "timer") {
    return (
      <>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.18)]" />
        <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">{chip.title}</span>
        <span className="ml-1 text-[11px] text-muted-foreground">{chip.detail}</span>
      </>
    );
  }
  return (
    <>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[12px] font-semibold text-foreground">{chip.title}</span>
        <span className="block text-[11px] text-muted-foreground">{chip.detail}</span>
      </span>
    </>
  );
}

export function PageHero({ hero, before }: { hero: PageHeroContent; before?: React.ReactNode }) {
  const ready = useIntro();
  const reduced = useReducedMotion();
  const tiltRef = useScrollProgress<HTMLDivElement>("page", { distance: 560 });
  const secondary = hero.secondary ?? { video: "tour" as const, label: "Watch the 1-minute tour" };
  const secondaryVideo = "video" in secondary ? getVideo(secondary.video) : undefined;

  return (
    <section className="relative pb-20 pt-8 md:pb-28 md:pt-12" aria-labelledby="page-title">
      <div className="container mx-auto max-w-6xl px-4">
        {before}
        <div className="text-center">
          <div style={introStyle(ready, 0, reduced)}>
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 py-1 pl-1 pr-3 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur">
              {hero.badge && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  {hero.badge}
                </span>
              )}
              <span className={cn(!hero.badge && "pl-2")}>{hero.eyebrow}</span>
            </p>
          </div>

          <h1
            id="page-title"
            className="mx-auto mt-6 max-w-4xl text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[52px] md:text-[62px]"
          >
            <HeadlineReveal lines={headlineLines(hero.title, hero.accent)} ready={ready} reduced={reduced} />
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-foreground/75 md:text-[18.5px]"
            style={introStyle(ready, 480, reduced)}
          >
            <RichText text={hero.answer} />
          </p>

          <div
            className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row"
            style={introStyle(ready, 600, reduced)}
          >
            <Button size="lg" className={cn(PRIMARY_CTA, "w-full sm:w-auto")} asChild>
              <Link to="/register">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {"video" in secondary ? (
              <VideoLightbox id={secondary.video}>
                <Button
                  variant="outline"
                  size="lg"
                  className="group h-11 w-full gap-2.5 rounded-lg bg-background/70 pl-2 pr-4 text-[14px] backdrop-blur sm:w-auto"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
                  </span>
                  {secondary.label}
                  {secondaryVideo && (
                    <span className="font-jetbrains text-[12px] tabular-nums text-muted-foreground">
                      {clockDuration(secondaryVideo.duration)}
                    </span>
                  )}
                </Button>
              </VideoLightbox>
            ) : (
              <Button variant="outline" size="lg" className="h-11 w-full rounded-lg bg-background/70 px-5 text-[14px] backdrop-blur sm:w-auto" asChild>
                <Link to={secondary.href}>{secondary.label}</Link>
              </Button>
            )}
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12px] text-muted-foreground"
            style={introStyle(ready, 720, reduced)}
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
              <BrowserFrame className="relative">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <HeroFrameMedia media={hero.media} />
                </div>
              </BrowserFrame>
              {hero.chips?.slice(0, 3).map((chip, i) => {
                const position = CHIP_POSITIONS[i]!;
                return (
                  <FloatingChip
                    key={chip.title}
                    className={position.className}
                    depth={position.depth}
                    visible={ready}
                    delay={1150 + i * 200}
                    reduced={reduced}
                  >
                    <ChipBody chip={chip} />
                  </FloatingChip>
                );
              })}
            </div>
          </div>
          {"clip" in hero.media && hero.media.caption && (
            <p className="mt-5 text-center text-[13px] text-muted-foreground">{hero.media.caption}</p>
          )}
        </div>
      </div>
    </section>
  );
}
