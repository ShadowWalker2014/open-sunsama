import { BLOG_MEDIA } from "@/lib/blog-media";
import { CAPTION_CLASS, FRAME_CLASS, frameSize, warnMissing } from "./hooks";

interface ShotProps {
  id: string;
  alt: string;
  caption?: string;
}

/**
 * A product screenshot that follows the site theme. Both images are lazy, and
 * the browser never fetches a lazy image that is display:none, so each reader
 * downloads only the variant for their theme.
 */
export function Shot({ id, alt, caption }: ShotProps) {
  const shot = BLOG_MEDIA.shots[id];
  if (!shot) {
    warnMissing("Shot", id);
    return null;
  }

  const common = {
    width: shot.width,
    height: shot.height,
    alt,
    loading: "lazy" as const,
    decoding: "async" as const,
  };

  return (
    <figure className="blog-media my-8">
      <div className={FRAME_CLASS} style={frameSize(shot.width, shot.height)}>
        <img {...common} src={shot.light} className="block h-auto w-full dark:hidden" />
        <img {...common} src={shot.dark} className="hidden h-auto w-full dark:block" />
      </div>
      {caption && <figcaption className={CAPTION_CLASS}>{caption}</figcaption>}
    </figure>
  );
}
