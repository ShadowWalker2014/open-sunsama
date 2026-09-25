/**
 * Narrated product videos for the home page. The trigger costs one small
 * poster image at most; the MP4 is only requested after a click, inside a
 * lightbox, so the hero's screenshot stays the page's largest paint.
 */

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Play, X } from "lucide-react";
import { BLOG_MEDIA, clockDuration, type VideoMedia } from "@/lib/blog-media";
import { VideoSchema } from "@/components/seo";
import { cn } from "@/lib/utils";

export type VideoId = "tour" | "ai";

export function getVideo(id: VideoId): VideoMedia | undefined {
  return BLOG_MEDIA.videos[id];
}

export function VideoLightbox({
  id,
  children,
}: {
  id: VideoId;
  /** The trigger. Must be a single focusable element (rendered via asChild). */
  children: React.ReactElement;
}) {
  const video = getVideo(id);
  if (!video) return children;

  return (
    <DialogPrimitive.Root>
      <VideoSchema id={id} video={video} />
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[hsl(228_20%_4%/0.82)] backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[61] w-[min(1120px,calc(100vw-24px),calc((100dvh-96px)*16/9))] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{video.title}</DialogPrimitive.Title>
          <div className="motion-safe:animate-in">
          <div
            className="relative overflow-hidden rounded-xl bg-black shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10"
            style={{ aspectRatio: `${video.width} / ${video.height}` }}
          >
            <video
              src={video.mp4}
              poster={video.poster}
              width={video.width}
              height={video.height}
              controls
              autoPlay
              playsInline
              preload="auto"
              aria-label={video.title}
              className="absolute inset-0 h-full w-full"
            >
              {/* Captions are burned into the video; the track stays off so they don't show twice. */}
              {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" />}
            </video>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 px-1 text-[13px] text-white/75">
            <span className="min-w-0 truncate">{video.title}</span>
            <DialogPrimitive.Close className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              <X className="h-4 w-4" />
              Close
            </DialogPrimitive.Close>
          </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * A poster card that opens the video. Used where the video deserves to be
 * seen as a picture, not just a button (the AI section).
 */
export const VideoCard = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { id: VideoId; label: string }
>(function VideoCard({ id, label, className, ...props }, ref) {
  const video = getVideo(id);
  if (!video) return null;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Play video: ${video.title} (${clockDuration(video.duration)})`}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-background/80 p-2.5 pr-4 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_40px_-20px_hsl(var(--shadow-color)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      <span
        className="relative w-[132px] shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[156px]"
        style={{ aspectRatio: `${video.width} / ${video.height}` }}
      >
        <img
          src={video.poster}
          alt=""
          width={video.width}
          height={video.height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-transform group-hover:scale-110">
            <Play className="h-4 w-4 translate-x-px fill-current" />
          </span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold leading-snug text-foreground">{label}</span>
        <span className="mt-1 block text-[12.5px] text-muted-foreground">
          Narrated · {clockDuration(video.duration)}
        </span>
      </span>
    </button>
  );
});
