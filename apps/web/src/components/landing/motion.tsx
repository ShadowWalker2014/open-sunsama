/**
 * Small motion toolkit for the marketing site: intro-on-load, reveal-on-view,
 * and scroll-linked progress. Uses CSS transitions and a single rAF-driven
 * scroll listener that writes CSS variables, so scrolling never re-renders
 * React. Everything collapses to a static page under prefers-reduced-motion.
 */

import * as React from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * True one frame after mount, so initial "from" styles paint before
 * transitioning. A timer backs up rAF, which browsers pause in background
 * tabs, so the hero never stays hidden.
 */
export function useIntro(): boolean {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    const fallback = window.setTimeout(() => setReady(true), 120);
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.clearTimeout(fallback);
    };
  }, []);
  return ready;
}

type ProgressMode =
  /** 0 when the element's top enters the viewport bottom, 1 when its bottom leaves the top. */
  | "through"
  /** 0 → 1 while a tall element scrolls under a sticky child (top at 0 → bottom at viewport bottom). */
  | "sticky"
  /** 0 at page top → 1 after `distance` px of scroll. */
  | "page";

/**
 * Writes scroll progress (0–1) into `--p` on the element and calls `onProgress`
 * (throttled to animation frames). Consumers derive transforms in CSS.
 */
export function useScrollProgress<T extends HTMLElement>(
  mode: ProgressMode,
  options: { distance?: number; onProgress?: (p: number) => void } = {}
) {
  const ref = React.useRef<T>(null);
  const { distance = 600, onProgress } = options;
  const callback = React.useRef(onProgress);
  callback.current = onProgress;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const rect = el.getBoundingClientRect();
      let p: number;
      if (mode === "page") p = window.scrollY / distance;
      else if (mode === "sticky") p = -rect.top / Math.max(1, rect.height - vh);
      else p = (vh - rect.top) / (vh + rect.height);
      p = Math.min(1, Math.max(0, p));
      el.style.setProperty("--p", p.toFixed(4));
      callback.current?.(p);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mode, distance]);

  return ref;
}

/** Fades and lifts children into place the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -8% 0px" });
  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cn(
        "transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
        inView ? "opacity-100 blur-0" : "opacity-0 blur-[2px]",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transform: inView ? "none" : `translateY(${y}px)`,
      }}
    >
      {children}
    </Component>
  );
}

/** Counts up to `value` once visible. Non-numeric values render as-is. */
export function CountUp({ value, duration = 1200 }: { value: string; duration?: number }) {
  const { ref, inView } = useInView({ triggerOnce: true });
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  const target = match ? Number(match[2]) : 0;
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!inView || !match) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setCurrent(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return <span ref={ref}>{match ? `${match[1]}${current}${match[3]}` : value}</span>;
}
