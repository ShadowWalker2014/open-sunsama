import type { VideoMedia } from "@/lib/blog-media";
import { videoObjectJsonLd } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";

/** VideoObject JSON-LD; `id` is the BLOG_MEDIA video id. */
export function VideoSchema({ id, video }: { id: string; video: VideoMedia }) {
  return <JsonLd id={`video-schema-${id}`} data={videoObjectJsonLd(video)} />;
}
