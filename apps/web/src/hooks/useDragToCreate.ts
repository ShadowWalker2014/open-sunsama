import * as React from "react";
import { addMinutes } from "date-fns";
import {
  calculateTimeFromY,
  snapToInterval,
  SNAP_INTERVAL,
} from "@/hooks/useCalendarDnd";

/** Pixels the pointer must travel before a press becomes a drag. */
const DRAG_THRESHOLD_PX = 4;

export interface CreateRange {
  day: Date;
  start: Date;
  end: Date;
}

/**
 * Press on an empty stretch of a calendar column and drag to sweep out a
 * block, as in Sunsama. While dragging, `range` is the snapped span under the
 * pointer (draw it as a preview); on release `onCreate` gets that span. A
 * press without a drag is left to the column's click handler.
 */
export function useDragToCreate(
  onCreate: ((range: CreateRange) => void) | undefined
) {
  const [range, setRange] = React.useState<CreateRange | null>(null);
  const pressRef = React.useRef<{
    day: Date;
    column: HTMLElement;
    startY: number;
    anchor: Date;
    dragging: boolean;
  } | null>(null);
  // The click that follows a drag's mouseup must not also count as a click.
  const suppressClickRef = React.useRef(false);
  const onCreateRef = React.useRef(onCreate);
  onCreateRef.current = onCreate;

  const rangeAt = React.useCallback((clientY: number): CreateRange | null => {
    const press = pressRef.current;
    if (!press) return null;
    const y = clientY - press.column.getBoundingClientRect().top;
    const here = snapToInterval(calculateTimeFromY(Math.max(0, y), press.day));
    const start = here < press.anchor ? here : press.anchor;
    let end = here < press.anchor ? press.anchor : here;
    if (end.getTime() - start.getTime() < SNAP_INTERVAL * 60_000) {
      end = addMinutes(start, SNAP_INTERVAL);
    }
    return { day: press.day, start, end };
  }, []);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const press = pressRef.current;
      if (!press) return;
      if (!press.dragging && Math.abs(e.clientY - press.startY) < DRAG_THRESHOLD_PX) {
        return;
      }
      press.dragging = true;
      setRange(rangeAt(e.clientY));
    };
    const onUp = (e: MouseEvent) => {
      const press = pressRef.current;
      if (!press) return;
      const final = press.dragging ? rangeAt(e.clientY) : null;
      pressRef.current = null;
      if (!press.dragging) return;
      setRange(null);
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      if (final) onCreateRef.current?.(final);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pressRef.current) {
        pressRef.current = null;
        setRange(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("keydown", onKey);
    };
  }, [rangeAt]);

  /**
   * Call from the column's onMouseDown. Presses on blocks, events, and
   * anything outside the column itself (portals) are ignored.
   */
  const startCreate = React.useCallback(
    (e: React.MouseEvent<HTMLElement>, day: Date) => {
      if (!onCreateRef.current || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        !e.currentTarget.contains(target) ||
        target.closest("[data-time-block]") ||
        target.closest("[data-external-event]") ||
        target.closest("[data-all-day-event]")
      ) {
        return;
      }
      const column = e.currentTarget;
      const y = e.clientY - column.getBoundingClientRect().top;
      pressRef.current = {
        day,
        column,
        startY: e.clientY,
        anchor: snapToInterval(calculateTimeFromY(Math.max(0, y), day)),
        dragging: false,
      };
    },
    []
  );

  return {
    /** The span being swept out, for the preview; null when not dragging. */
    range,
    startCreate,
    /** True right after a drag, so the trailing click can be ignored. */
    shouldIgnoreClick: () => suppressClickRef.current,
  };
}
