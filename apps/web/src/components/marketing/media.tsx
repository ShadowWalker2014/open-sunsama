import { Clip, DemoVideo, Shot } from "@/components/blog/media";
import type { MediaRef } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { MEDIA_WRAP } from "./tokens";

/** Renders a content module's MediaRef with the blog media components (real recordings only). */
export function MediaBlock({ media, className }: { media: MediaRef; className?: string }) {
  return (
    <div className={cn(MEDIA_WRAP, className)}>
      {"clip" in media ? (
        <Clip id={media.clip} caption={media.caption ?? media.alt} />
      ) : "shot" in media ? (
        <Shot id={media.shot} alt={media.alt} {...(media.caption ? { caption: media.caption } : {})} />
      ) : (
        <DemoVideo id={media.video} />
      )}
    </div>
  );
}
