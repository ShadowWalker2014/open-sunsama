import * as React from "react";
import { addMinutes, differenceInMinutes } from "date-fns";
import {
  HOUR_HEIGHT,
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  calculateTimeFromY,
  snapToInterval,
  MIN_BLOCK_DURATION,
} from "@/hooks/useCalendarDnd";

const TIMELINE_END_MINUTE = (TIMELINE_END_HOUR + 1) * 60; // 24*60 = 1440
const DRAG_THRESHOLD_PX = 4;

function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export type EventDragMode = "move" | "resize-top" | "resize-bottom";

export interface EventDragState {
  eventId: string;
  /** Day this event was grabbed in — drag stays within this day. */
  dayDate: Date;
  columnRect: DOMRect;
  /** scrollTop at drag start, used to compensate for mid-drag scroll. */
  scrollTopAtStart: number;
  scrollEl: HTMLElement | null;
  startY: number;
  initialStart: Date;
  initialEnd: Date;
  mode: EventDragMode;
  previewStart: Date;
  previewEnd: Date;
  /** Tracks whether the mouse moved past the click threshold. */
  moved: boolean;
}

export interface EventDragOptions {
  onCommit: (
    eventId: string,
    startTime: Date,
    endTime: Date,
    mode: EventDragMode
  ) => void;
}

/**
 * Same-column drag for external calendar events in the multi-day view.
 *
 * The single-day Timeline uses `useCalendarDnd` with one global
 * `timelineRef` — that doesn't translate to multi-day where each day
 * column has its own bounding rect. This hook keeps the drag scoped
 * to the column the user grabbed the event in: vertical drag changes
 * the start/end time within that day; the day itself never changes.
 *
 * Cross-column (Mon → Wed) is intentionally out of scope — the user
 * can use the detail sheet to change the date.
 */
export function useMultiDayEventDrag(options: EventDragOptions) {
  const [dragState, setDragState] = React.useState<EventDragState | null>(null);
  const dragStateRef = React.useRef<EventDragState | null>(null);
  React.useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Stash latest options in a ref so the global listeners can call the
  // most recent onCommit without re-binding on every options change.
  const optionsRef = React.useRef(options);
  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const startDrag = React.useCallback(
    (
      eventId: string,
      dayDate: Date,
      eventStart: Date,
      eventEnd: Date,
      mode: EventDragMode,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      // Walk up to the column root (marked with `data-day-column`).
      const column = target.closest<HTMLElement>("[data-day-column]");
      if (!column) return;
      const columnRect = column.getBoundingClientRect();
      const scrollEl =
        column.closest<HTMLElement>("[data-radix-scroll-area-viewport]") ??
        null;
      const scrollTopAtStart = scrollEl?.scrollTop ?? 0;
      setDragState({
        eventId,
        dayDate,
        columnRect,
        scrollTopAtStart,
        scrollEl,
        startY: e.clientY,
        initialStart: eventStart,
        initialEnd: eventEnd,
        mode,
        previewStart: eventStart,
        previewEnd: eventEnd,
        moved: false,
      });
    },
    []
  );

  React.useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const liveScroll = ds.scrollEl?.scrollTop ?? ds.scrollTopAtStart;
      const scrollDelta = liveScroll - ds.scrollTopAtStart;
      // The cursor's Y relative to the column's top, accounting for
      // any scrolling that happened during the drag.
      const relativeY = e.clientY - ds.columnRect.top + scrollDelta;
      const movedEnough =
        ds.moved || Math.abs(e.clientY - ds.startY) >= DRAG_THRESHOLD_PX;

      const originalDurationMins = differenceInMinutes(
        ds.initialEnd,
        ds.initialStart
      );

      let previewStart = ds.previewStart;
      let previewEnd = ds.previewEnd;

      if (ds.mode === "move") {
        // Anchor the event's top edge to the cursor by computing the
        // offset between cursor's start position and event's top, then
        // shifting the new top by the same offset.
        const initialTopPx =
          ((minutesFromMidnight(ds.initialStart) - TIMELINE_START_HOUR * 60) /
            60) *
          HOUR_HEIGHT;
        const cursorOffsetWithinEvent =
          ds.startY - ds.columnRect.top + ds.scrollTopAtStart - initialTopPx;
        const newTopPx = relativeY - cursorOffsetWithinEvent;
        const rawStart = calculateTimeFromY(
          Math.max(0, newTopPx),
          ds.dayDate
        );
        let snappedStart = snapToInterval(rawStart);
        // Clamp so the event still fits in the day.
        const startMins = minutesFromMidnight(snappedStart);
        const maxStart = TIMELINE_END_MINUTE - originalDurationMins;
        if (startMins > maxStart) {
          snappedStart = addMinutes(snappedStart, -(startMins - maxStart));
        }
        previewStart = snappedStart;
        previewEnd = addMinutes(snappedStart, originalDurationMins);
      } else if (ds.mode === "resize-top") {
        const rawStart = calculateTimeFromY(
          Math.max(0, relativeY),
          ds.dayDate
        );
        let snappedStart = snapToInterval(rawStart);
        const minutesBeforeEnd = differenceInMinutes(
          ds.initialEnd,
          snappedStart
        );
        if (minutesBeforeEnd < MIN_BLOCK_DURATION) {
          snappedStart = addMinutes(ds.initialEnd, -MIN_BLOCK_DURATION);
        }
        previewStart = snappedStart;
        previewEnd = ds.initialEnd;
      } else {
        // resize-bottom
        const rawEnd = calculateTimeFromY(
          Math.max(0, relativeY),
          ds.dayDate
        );
        let snappedEnd = snapToInterval(rawEnd);
        const minutesAfterStart = differenceInMinutes(
          snappedEnd,
          ds.initialStart
        );
        if (minutesAfterStart < MIN_BLOCK_DURATION) {
          snappedEnd = addMinutes(ds.initialStart, MIN_BLOCK_DURATION);
        }
        // Don't let the end cross midnight onto the next day.
        const endMins = minutesFromMidnight(snappedEnd);
        if (endMins === 0 && snappedEnd.getDate() !== ds.dayDate.getDate()) {
          snappedEnd = addMinutes(
            ds.initialStart,
            TIMELINE_END_MINUTE - minutesFromMidnight(ds.initialStart)
          );
        }
        previewStart = ds.initialStart;
        previewEnd = snappedEnd;
      }

      setDragState((prev) =>
        prev
          ? { ...prev, previewStart, previewEnd, moved: movedEnough }
          : prev
      );
    };

    const handleUp = () => {
      const ds = dragStateRef.current;
      if (!ds) return;
      // Only commit if the user actually moved past the click
      // threshold. A pure click should fall through to the event's
      // onClick (which opens the detail sheet).
      if (ds.moved) {
        optionsRef.current.onCommit(
          ds.eventId,
          ds.previewStart,
          ds.previewEnd,
          ds.mode
        );
      }
      setDragState(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDragState(null);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dragState]);

  return {
    dragState,
    startDrag,
    /** True for the duration of any drag past the click threshold — used to suppress trailing click. */
    justEndedDrag: dragState?.moved ?? false,
  };
}
