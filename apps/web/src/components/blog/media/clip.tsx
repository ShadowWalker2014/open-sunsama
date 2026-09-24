import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { BLOG_MEDIA } from "@/lib/blog-media";
import {
  CAPTION_CLASS,
  FRAME_CLASS,
  frameSize,
  useIsDark,
  usePrefersReducedMotion,
  warnMissing,
} from "./hooks";

const FADE_SECONDS = 0.5;

interface ClipProps {
  id: string;
  caption?: string;
}

/**
 * A short silent product loop. Nothing downloads until it plays: the poster is
 * a lazy <img> under the video, and the video (preload="none") plays only while
 * at least half of it is on screen. Readers who prefer reduced motion get the
 * poster and a play button instead of autoplay.
 */
export function Clip({ id, caption }: ClipProps) {
  const clip = BLOG_MEDIA.clips[id];
  const theme = useIsDark() ? "dark" : "light";
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Cleared when the reader pauses, so scrolling doesn't restart the clip
  const autoplay = useRef(true);
  const [playing, setPlaying] = useState(false);
  const src = clip?.[theme] ?? clip?.light;

  // Recordings fade in from and out to the page color over ~0.4 s. Loop inside
  // those fades so the clip never shows a washed-out frame.
  const skipFades = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime < FADE_SECONDS) video.currentTime = FADE_SECONDS;
    else if (video.currentTime > video.duration - FADE_SECONDS) video.currentTime = FADE_SECONDS;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlaying(false); // a theme switch swaps in a fresh, paused <video>
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) video.pause();
        else if (autoplay.current && !reducedMotion) video.play().catch(() => {});
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src, reducedMotion]);

  if (!clip || !src) {
    warnMissing("Clip", id);
    return null;
  }

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      autoplay.current = true;
      video.play().catch(() => {});
    } else {
      autoplay.current = false;
      video.pause();
    }
  };

  return (
    <figure className="blog-media my-8">
      <div className={FRAME_CLASS} style={frameSize(clip.width, clip.height)}>
        <img
          src={src.poster}
          alt=""
          width={clip.width}
          height={clip.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <video
          key={theme}
          ref={videoRef}
          src={src.mp4}
          width={clip.width}
          height={clip.height}
          muted
          playsInline
          preload="none"
          aria-label={caption ?? "Product demo clip"}
          onPlay={() => setPlaying(true)}
          onTimeUpdate={skipFades}
          onEnded={() => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = FADE_SECONDS;
            video.play().catch(() => {});
          }}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause clip" : "Play clip"}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition-opacity hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-px" />}
        </button>
      </div>
      {caption && <figcaption className={CAPTION_CLASS}>{caption}</figcaption>}
    </figure>
  );
}
