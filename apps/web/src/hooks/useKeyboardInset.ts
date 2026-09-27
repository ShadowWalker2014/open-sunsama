import * as React from "react";

export interface KeyboardInset {
  /** Height of the on-screen keyboard in CSS px (0 when closed). */
  keyboard: number;
  /** Height of the visible area above the keyboard. */
  visibleHeight: number;
}

/**
 * The on-screen keyboard's height and the space left above it, from
 * `visualViewport`. Bottom sheets pad their content by `keyboard` so it sits
 * above the keys while their background runs down behind them.
 */
export function useKeyboardInset(active = true): KeyboardInset {
  const [state, setState] = React.useState<KeyboardInset>({ keyboard: 0, visibleHeight: 0 });

  React.useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!active || !vv) {
      setState({ keyboard: 0, visibleHeight: 0 });
      return;
    }
    const update = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Browser chrome jitters by a pixel or two; only a real keyboard counts.
      setState({ keyboard: covered > 60 ? Math.round(covered) : 0, visibleHeight: Math.round(vv.height) });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  return state;
}
