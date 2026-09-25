import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";
import { BLOG_MEDIA, clockDuration } from "@/lib/blog-media";
import { VideoSchema } from "@/components/seo";
import { CAPTION_CLASS, FRAME_CLASS, frameSize, warnMissing } from "./hooks";

/**
 * A narrated walkthrough. Shows the poster until the reader clicks play, so the
 * MP4 costs nothing for readers who don't watch. Emits VideoObject JSON-LD.
 */
export function DemoVideo({ id }: { id: string }) {
  const video = BLOG_MEDIA.videos[id];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  if (!video) {
    warnMissing("DemoVideo", id);
    return null;
  }

  const start = () => {
    // Mount the <video> synchronously so play() still counts as a user gesture (Safari)
    flushSync(() => setStarted(true));
    videoRef.current?.play().catch(() => {});
  };

  return (
    <figure className="blog-media my-8">
      <VideoSchema id={id} video={video} />
      <div className={FRAME_CLASS} style={frameSize(video.width, video.height)}>
        {started ? (
          <video
            ref={videoRef}
            src={video.mp4}
            poster={video.poster}
            width={video.width}
            height={video.height}
            controls
            playsInline
            preload="auto"
            aria-label={video.title}
            className="absolute inset-0 h-full w-full bg-black"
          >
            {/* Captions are burned into the video; the track stays off by default so they don't show twice */}
            {video.captions && (
              <track kind="captions" src={video.captions} srcLang="en" label="English" />
            )}
          </video>
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label={`Play video: ${video.title} (${clockDuration(video.duration)})`}
            className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <img
              src={video.poster}
              alt=""
              width={video.width}
              height={video.height}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform group-hover:scale-105 sm:h-16 sm:w-16">
              <Play className="h-6 w-6 translate-x-0.5 fill-current sm:h-7 sm:w-7" />
            </span>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              {clockDuration(video.duration)}
            </span>
          </button>
        )}
      </div>
      <figcaption className={CAPTION_CLASS}>{video.title}</figcaption>
    </figure>
  );
}
