/**
 * A real product clip (src/lib/blog-media.json) that fills its parent, for
 * frames the kit draws itself (the hero's BrowserFrame, the pinned story).
 * Posts use <Clip> instead, which draws its own frame and caption.
 *
 * The poster is a plain <img> under the video, so the frame is never blank and
 * never shifts. The video downloads only when it plays. Readers who prefer
 * reduced motion get the poster and, with `controls`, a play button.
 */

import * as React from "react";
import { Pause, Play } from "lucide-react";
import { BLOG_MEDIA } from "@/lib/blog-media";
import { useIsDark, usePrefersReducedMotion } from "@/components/blog/media/hooks";
import { cn } from "@/lib/utils";

/** Recordings fade in from and out to the page color; loop inside the fades. */
const FADE_SECONDS = 0.5;

export function ClipPlayer({
  id,
  label,
  active,
  priority = false,
  controls = false,
  poster,
  className,
}: {
  id: string;
  /** What the clip shows, for screen readers. */
  label: string;
  /**
   * Controlled playback (the pinned story plays only the active step).
   * Leave undefined to play whenever at least half the clip is on screen.
   */
  active?: boolean;
  /** Load the poster eagerly with high priority (hero only). */
  priority?: boolean;
  /** Show a pause/play button (needed when the clip autoplays in view). */
  controls?: boolean;
  /** Replaces the clip's own poster, e.g. a sharper full-size screenshot. */
  poster?: React.ReactNode;
  className?: string;
}) {
  const clip = BLOG_MEDIA.clips[id];
  const theme = useIsDark() ? "dark" : "light";
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [inView, setInView] = React.useState(false);
  // The reader's choice from the play/pause button beats autoplay and reduced motion
  const [choice, setChoice] = React.useState<"play" | "pause" | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const src = clip?.[theme] ?? clip?.light;
  const controlled = active !== undefined;

  React.useEffect(() => {
    if (controlled) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.5,
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [controlled, src]);

  const visible = controlled ? Boolean(active) : inView;
  const shouldPlay = choice === "pause" ? false : choice === "play" ? visible : visible && !reducedMotion;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      if (video.currentTime < FADE_SECONDS) video.currentTime = FADE_SECONDS;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay, src]);

  if (!clip || !src) return null;

  const loopInsideFades = () => {
    const video = videoRef.current;
    if (video?.duration && video.currentTime > video.duration - FADE_SECONDS) video.currentTime = FADE_SECONDS;
  };

  return (
    <div className={cn("relative h-full w-full", className)}>
      {poster ?? (
        <img
          src={src.poster}
          alt=""
          width={clip.width}
          height={clip.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <video
        key={theme}
        ref={videoRef}
        src={src.mp4}
        width={clip.width}
        height={clip.height}
        muted
        playsInline
        preload="none"
        aria-label={label}
        onTimeUpdate={loopInsideFades}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          const video = videoRef.current;
          if (!video) return;
          video.currentTime = FADE_SECONDS;
          video.play().catch(() => {});
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {controls && (
        <button
          type="button"
          onClick={() => setChoice(playing ? "pause" : "play")}
          aria-label={playing ? "Pause clip" : "Play clip"}
          className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-px" />}
        </button>
      )}
    </div>
  );
}
