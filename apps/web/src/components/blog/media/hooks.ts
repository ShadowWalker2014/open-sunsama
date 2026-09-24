import { useSyncExternalStore } from "react";

/** Mirrors the `dark` class the theme script and ThemeProvider set on <html>. */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function useIsDark() {
  return useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

/** A post referenced a media id that isn't in blog-media.json. */
export function warnMissing(component: string, id: string) {
  if (import.meta.env.DEV) {
    console.warn(`<${component} id="${id}"> is not in src/lib/blog-media.json; rendering nothing`);
  }
}

/** Border + shadow shared by every media frame (matches the landing BrowserFrame). */
export const FRAME_CLASS =
  "relative mx-auto overflow-hidden rounded-xl border border-border/70 bg-muted/30 shadow-[0_1px_0_0_hsl(var(--foreground)/0.04),0_16px_48px_-20px_hsl(var(--shadow-color)/0.3),0_8px_24px_-12px_rgb(0_0_0/0.14)] dark:border-white/10";

/**
 * Caps a frame's width so tall media (phone screens, consent dialogs) stays
 * under ~640px high instead of filling the column. Wide media is unaffected.
 */
export const frameSize = (width: number, height: number) => ({
  aspectRatio: `${width} / ${height}`,
  maxWidth: `${Math.round((640 * width) / height)}px`,
});

export const CAPTION_CLASS = "mt-3 text-center text-[13px] leading-snug text-muted-foreground";
