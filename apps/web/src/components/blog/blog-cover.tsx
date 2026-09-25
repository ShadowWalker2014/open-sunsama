import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsDark } from "./media/hooks";

interface BlogCoverProps {
  src: string;
  alt: string;
  /** Load the visible variant eagerly with high fetch priority (the article cover) */
  priority?: boolean;
  className?: string;
}

/** `/blog-foo.webp` -> `/blog-foo-dark.webp` */
export const darkCoverSrc = (src: string) =>
  src.replace(/\.webp$/, "-dark.webp");

/**
 * A post cover with a dark-mode twin, swapped by the `dark` class like <Shot>.
 * The hidden variant is lazy and display:none, so the browser never fetches it.
 * Posts whose dark cover doesn't exist yet fall back to the light image.
 */
export function BlogCover({
  src,
  alt,
  priority = false,
  className,
}: BlogCoverProps) {
  const isDark = useIsDark();
  const [darkMissing, setDarkMissing] = useState(false);
  const dark = darkCoverSrc(src);
  const hasDarkTwin = dark !== src && !darkMissing;

  const common = {
    alt,
    width: 1600,
    height: 800,
    decoding: "async" as const,
    draggable: false,
  };
  const imgClass = "h-full w-full object-cover";

  if (!hasDarkTwin) {
    return (
      <img
        {...common}
        src={src}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className={cn(imgClass, className)}
      />
    );
  }

  return (
    <>
      <img
        {...common}
        src={src}
        loading={priority && !isDark ? "eager" : "lazy"}
        fetchPriority={priority && !isDark ? "high" : "auto"}
        className={cn(imgClass, "dark:hidden", className)}
      />
      <img
        {...common}
        src={dark}
        loading={priority && isDark ? "eager" : "lazy"}
        fetchPriority={priority && isDark ? "high" : "auto"}
        onError={() => setDarkMissing(true)}
        className={cn(imgClass, "hidden dark:block", className)}
      />
    </>
  );
}
