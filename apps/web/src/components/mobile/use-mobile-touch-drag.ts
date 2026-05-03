import * as React from "react";
import { addMinutes, differenceInMinutes } from "date-fns";
import {
  HOUR_HEIGHT,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  calculateTimeFromY,
  snapToInterval,
} from "@/hooks/useCalendarDnd";

const TIMELINE_END_MINUTE = (TIMELINE_END_HOUR + 1) * 60;
/** ms to wait before a hold becomes a drag instead of a tap. */
const LONG_PRESS_MS = 400;
/** px the finger can wander pre-long-press before we abort (treat as scroll). */
const SCROLL_ABORT_PX = 10;

function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export interface MobileEventDragState {
  eventId: string;
  /** Day this event lives on. */
  dayDate: Date;
  /** The timeline-content rect at drag-start. */
  timelineRect: DOMRect;
  scrollEl: HTMLElement | null;
  scrollTopAtStart: number;
  /** Y of the touch at drag-start, used to compute pixel deltas. */
  startY: number;
  initialStart: Date;
  initialEnd: Date;
  /** Live preview times, updated on each touchmove. */
  previewStart: Date;
  previewEnd: Date;
}

export interface MobileTouchDragOptions {
  /** Fired when the user lifts their finger after a real drag. */
  onCommit: (eventId: string, startTime: Date, endTime: Date) => void;
}

interface PendingPress {
  eventId: string;
  dayDate: Date;
  initialStart: Date;
  initialEnd: Date;
  timelineEl: HTMLElement;
  startX: number;
  startY: number;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Long-press-to-drag for mobile calendar events.
 *
 * Touch UX is fundamentally different from mouse:
 * - Tap = open the detail sheet (existing onClick still fires).
 * - Long-press (~400ms still finger) = enter drag mode. Once in drag
 *   mode, subsequent touchmove events update the live preview and
 *   call preventDefault to stop the timeline from scrolling under
 *   the finger.
 * - If the finger MOVES more than ~10px during the pre-long-press
 *   window, we abort the timer — that was a scroll attempt, not a
 *   drag attempt, so we let the browser handle the scroll natively.
 * - Lift finger after a real drag → commit. Lift finger before the
 *   timer fires → it's a tap → onClick fires from the chip's React
 *   handler (this hook doesn't intercept that path).
 *
 * Same-day-only for now. Cross-day touch drag is plausible (find the
 * day-column the finger ended on via elementFromPoint) but mobile is
 * single-day, so it's moot here.
 */
export function useMobileTouchDrag(options: MobileTouchDragOptions) {
  const [dragState, setDragState] =
    React.useState<MobileEventDragState | null>(null);
  const dragStateRef = React.useRef<MobileEventDragState | null>(null);
  React.useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);
  // Mirror useCalendarDnd's justEndedDrag flag so the chip's onClick
  // can suppress the trailing synthetic click after a real drag.
  // setTimeout(0) defers the clear past the click event in the same
  // task — same pattern as the desktop path.
  const [justEndedDrag, setJustEndedDrag] = React.useState(false);

  // Latest options via ref so global listeners don't need to re-bind.
  const optionsRef = React.useRef(options);
  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Tracks an in-flight long-press timer between touchstart and the
  // moment the timer fires (or the user lifts / scrolls).
  const pendingRef = React.useRef<PendingPress | null>(null);

  const cancelPending = React.useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  }, []);

  /**
   * Wire onto the chip's onTouchStart. Pass the event id, day, and
   * its current start/end times. The hook stages a long-press timer;
   * on fire, it enters drag mode and the rest of the gesture is
   * handled by the global touchmove/touchend listeners installed
   * below via useEffect.
   */
  const handleTouchStart = React.useCallback(
    (
      eventId: string,
      dayDate: Date,
      eventStart: Date,
      eventEnd: Date,
      e: React.TouchEvent
    ) => {
      const touch = e.touches[0];
      if (!touch) return;
      // The timeline content div is the element that owns Y → time
      // mapping; we walk up via `data-mobile-timeline`.
      const timelineEl = (e.currentTarget as HTMLElement).closest<HTMLElement>(
        "[data-mobile-timeline]"
      );
      if (!timelineEl) return;
      cancelPending();
      pendingRef.current = {
        eventId,
        dayDate,
        initialStart: eventStart,
        initialEnd: eventEnd,
        timelineEl,
        startX: touch.clientX,
        startY: touch.clientY,
        timer: setTimeout(() => {
          // Long-press fired → enter drag mode. Capture the
          // timeline rect now so subsequent moves can compute Y
          // relative to the right element.
          const pending = pendingRef.current;
          if (!pending) return;
          const timelineRect = pending.timelineEl.getBoundingClientRect();
          const scrollEl =
            pending.timelineEl.closest<HTMLElement>(
              "[data-radix-scroll-area-viewport]"
            ) ?? null;
          // Light haptic feedback (Android / iOS Safari support
          // varies — silently no-op when missing).
          try {
            navigator.vibrate?.(15);
          } catch {
            /* ignore */
          }
          setDragState({
            eventId: pending.eventId,
            dayDate: pending.dayDate,
            timelineRect,
            scrollEl,
            scrollTopAtStart: scrollEl?.scrollTop ?? 0,
            startY: pending.startY,
            initialStart: pending.initialStart,
            initialEnd: pending.initialEnd,
            previewStart: pending.initialStart,
            previewEnd: pending.initialEnd,
          });
          pendingRef.current = null;
        }, LONG_PRESS_MS),
      };
    },
    [cancelPending]
  );

  // Pre-long-press touchmove handler — lives on the chip itself so
  // it can decide "this is a scroll, not a drag" before we lock
  // scrolling. Once drag starts, the global listeners take over.
  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - pending.startX;
      const dy = touch.clientY - pending.startY;
      if (dx * dx + dy * dy > SCROLL_ABORT_PX * SCROLL_ABORT_PX) {
        cancelPending();
      }
    },
    [cancelPending]
  );

  const handleTouchEnd = React.useCallback(() => {
    cancelPending();
  }, [cancelPending]);

  // Global touchmove + touchend installed only while dragging. We
  // need passive:false on touchmove so we can preventDefault to
  // stop the timeline from scrolling under the finger.
  const isDragging = dragState !== null;
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: TouchEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      const liveScroll = ds.scrollEl?.scrollTop ?? ds.scrollTopAtStart;
      const scrollDelta = liveScroll - ds.scrollTopAtStart;
      const originalDuration = differenceInMinutes(
        ds.initialEnd,
        ds.initialStart
      );
      // Anchor the event's TOP to the finger's current Y minus the
      // offset between the original touch Y and the event's top edge.
      const initialTopPx =
        ((minutesFromMidnight(ds.initialStart) - TIMELINE_START_HOUR * 60) /
          60) *
        HOUR_HEIGHT;
      const cursorOffsetWithinEvent =
        ds.startY - ds.timelineRect.top + ds.scrollTopAtStart - initialTopPx;
      const newTopPx =
        touch.clientY - ds.timelineRect.top + scrollDelta - cursorOffsetWithinEvent;
      const rawStart = calculateTimeFromY(
        Math.max(0, newTopPx),
        ds.dayDate
      );
      let snappedStart = snapToInterval(rawStart);
      // Clamp to keep the event in the day. Detect snap-rolled-to-
      // next-day and pull back to the last legal start slot.
      const sameDay =
        snappedStart.getDate() === ds.dayDate.getDate() &&
        snappedStart.getMonth() === ds.dayDate.getMonth() &&
        snappedStart.getFullYear() === ds.dayDate.getFullYear();
      const startMins = minutesFromMidnight(snappedStart);
      const maxStart = TIMELINE_END_MINUTE - originalDuration;
      if (!sameDay || startMins > maxStart) {
        const startOfDayBase = new Date(
          ds.dayDate.getFullYear(),
          ds.dayDate.getMonth(),
          ds.dayDate.getDate(),
          0,
          0,
          0,
          0
        );
        snappedStart = addMinutes(startOfDayBase, Math.max(0, maxStart));
      }
      const previewStart = snappedStart;
      const previewEnd = addMinutes(snappedStart, originalDuration);
      setDragState((prev) =>
        prev ? { ...prev, previewStart, previewEnd } : prev
      );
    };

    const handleEnd = () => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const moved =
        ds.previewStart.getTime() !== ds.initialStart.getTime();
      // Only commit if the preview actually shifted (long-press hold
      // without movement is a no-op, not a drag).
      if (moved) {
        optionsRef.current.onCommit(
          ds.eventId,
          ds.previewStart,
          ds.previewEnd
        );
        setJustEndedDrag(true);
        setTimeout(() => setJustEndedDrag(false), 0);
      }
      setDragState(null);
    };

    const handleCancel = () => {
      setDragState(null);
    };

    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd);
    document.addEventListener("touchcancel", handleCancel);
    return () => {
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.removeEventListener("touchcancel", handleCancel);
    };
  }, [isDragging]);

  return {
    dragState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    /** True for the duration of any active drag — used for visual feedback. */
    isDragging,
    /** True briefly after a drag commits — gates the chip's onClick. */
    justEndedDrag,
  };
}
