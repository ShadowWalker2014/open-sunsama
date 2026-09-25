import * as React from "react";

/**
 * Height of the on-screen keyboard in CSS pixels, from `visualViewport`.
 * Fixed elements pinned to the bottom (sheets, composers) add it to their
 * bottom offset so the keyboard never covers them. 0 when inactive.
 */
export function useKeyboardInset(active = true): number {
  const [inset, setInset] = React.useState(0);

  React.useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) {
      setInset(0);
      return;
    }
    const update = () => {
      const next = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Browser chrome jitters by a pixel or two; only a real keyboard counts.
      setInset(next > 60 ? Math.round(next) : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  return inset;
}
