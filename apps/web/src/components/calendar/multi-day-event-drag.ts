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
  /**
   * Day where the event was originally grabbed. For move-mode this
   * can change to a different column as the cursor crosses; for
   * resize modes it stays pinned (resizing across days isn't a
   * coherent UI affordance).
   */
  originDayDate: Date;
  /**
   * Day the cursor is currently over (move-mode only — for resize
   * this equals originDayDate).
   */
  currentDayDate: Date;
  /** Bounding rect of the ORIGIN column at drag start. */
  originColumnRect: DOMRect;
  /**
   * Bounding rect of the column the cursor is currently over. For
   * resize this stays equal to originColumnRect; for move this
   * updates whenever the cursor crosses to a new column.
   */
  currentColumnRect: DOMRect;
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
        originDayDate: dayDate,
        currentDayDate: dayDate,
        originColumnRect: columnRect,
        currentColumnRect: columnRect,
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
      const movedEnough =
        ds.moved || Math.abs(e.clientY - ds.startY) >= DRAG_THRESHOLD_PX;

      const originalDurationMins = differenceInMinutes(
        ds.initialEnd,
        ds.initialStart
      );

      // For move mode, detect the column under the cursor so the user
      // can drag an event from Mon → Wed. Resize stays pinned to the
      // origin column (resizing across days isn't a coherent gesture).
      let nextDayDate = ds.currentDayDate;
      let nextColumnRect = ds.currentColumnRect;
      if (ds.mode === "move") {
        // elementFromPoint is cheap (browser hit-test); walk up to the
        // marked column root and read its `data-day` ISO date.
        const hit = document.elementFromPoint(e.clientX, e.clientY);
        const column =
          hit?.closest<HTMLElement>("[data-day-column]") ?? null;
        if (column?.dataset.day) {
          const parsed = new Date(column.dataset.day);
          if (!Number.isNaN(parsed.getTime())) {
            nextDayDate = parsed;
            nextColumnRect = column.getBoundingClientRect();
          }
        }
        // If the cursor wandered outside any day column (e.g. into the
        // hour gutter), keep the last valid column.
      }

      // The cursor's Y relative to the active column's top, accounting
      // for mid-drag scroll. For resize this is the origin column;
      // for move this is whichever column the cursor is over.
      const activeColumnRect =
        ds.mode === "move" ? nextColumnRect : ds.originColumnRect;
      const activeDayDate =
        ds.mode === "move" ? nextDayDate : ds.originDayDate;
      const relativeY = e.clientY - activeColumnRect.top + scrollDelta;

      let previewStart = ds.previewStart;
      let previewEnd = ds.previewEnd;

      if (ds.mode === "move") {
        // Anchor the event's top edge to the cursor by computing the
        // offset between cursor's start position and event's top, then
        // shifting the new top by the same offset. The offset is
        // computed against the ORIGIN column (where the cursor was
        // first picked up); the resulting Y is then applied against
        // the ACTIVE column (which may now be a different day).
        const initialTopPx =
          ((minutesFromMidnight(ds.initialStart) - TIMELINE_START_HOUR * 60) /
            60) *
          HOUR_HEIGHT;
        const cursorOffsetWithinEvent =
          ds.startY -
          ds.originColumnRect.top +
          ds.scrollTopAtStart -
          initialTopPx;
        const newTopPx = relativeY - cursorOffsetWithinEvent;
        const rawStart = calculateTimeFromY(
          Math.max(0, newTopPx),
          activeDayDate
        );
        let snappedStart = snapToInterval(rawStart);
        // Clamp so the event still fits in the active day. Detect
        // snap-rolled-to-next-day and force back to today's last
        // legal start slot.
        const sameDay =
          snappedStart.getDate() === activeDayDate.getDate() &&
          snappedStart.getMonth() === activeDayDate.getMonth() &&
          snappedStart.getFullYear() === activeDayDate.getFullYear();
        const startMins = minutesFromMidnight(snappedStart);
        const maxStart = TIMELINE_END_MINUTE - originalDurationMins;
        if (!sameDay || startMins > maxStart) {
          const startOfDayBase = new Date(
            activeDayDate.getFullYear(),
            activeDayDate.getMonth(),
            activeDayDate.getDate(),
            0,
            0,
            0,
            0
          );
          snappedStart = addMinutes(startOfDayBase, Math.max(0, maxStart));
        }
        previewStart = snappedStart;
        previewEnd = addMinutes(snappedStart, originalDurationMins);
      } else if (ds.mode === "resize-top") {
        const rawStart = calculateTimeFromY(
          Math.max(0, relativeY),
          ds.originDayDate
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
          ds.originDayDate
        );
        let snappedEnd = snapToInterval(rawEnd);
        const minutesAfterStart = differenceInMinutes(
          snappedEnd,
          ds.initialStart
        );
        if (minutesAfterStart < MIN_BLOCK_DURATION) {
          snappedEnd = addMinutes(ds.initialStart, MIN_BLOCK_DURATION);
        }
        // Don't let the end cross midnight. `snapToInterval(23:53)`
        // rolls to next-day 00:00, which calculateYFromTime would
        // render at y=0 (top of timeline) — the preview collapses.
        // Clamp explicitly to the last snap slot of the day so the
        // preview stays visible at the bottom. Drag can take you to
        // 23:45 (with 15-min SNAP_INTERVAL); for an event that
        // genuinely ends at midnight, use the detail sheet.
        const endMins = minutesFromMidnight(snappedEnd);
        const crossedMidnight =
          (endMins === 0 &&
            snappedEnd.getDate() !== ds.originDayDate.getDate()) ||
          snappedEnd.getDate() !== ds.originDayDate.getDate() ||
          snappedEnd.getMonth() !== ds.originDayDate.getMonth() ||
          snappedEnd.getFullYear() !== ds.originDayDate.getFullYear();
        if (crossedMidnight) {
          // Last full slot of the day: 24:00 - SNAP_INTERVAL.
          const lastSlotMins = TIMELINE_END_MINUTE - 15;
          const startOfDayBase = new Date(
            ds.originDayDate.getFullYear(),
            ds.originDayDate.getMonth(),
            ds.originDayDate.getDate(),
            0,
            0,
            0,
            0
          );
          snappedEnd = addMinutes(startOfDayBase, lastSlotMins);
          // If that would shrink below MIN_BLOCK_DURATION, the user
          // is dragging an event that already starts close to EOD —
          // pin to start + MIN_BLOCK.
          if (
            differenceInMinutes(snappedEnd, ds.initialStart) <
            MIN_BLOCK_DURATION
          ) {
            snappedEnd = addMinutes(ds.initialStart, MIN_BLOCK_DURATION);
          }
        }
        previewStart = ds.initialStart;
        previewEnd = snappedEnd;
      }

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              previewStart,
              previewEnd,
              moved: movedEnough,
              currentDayDate: nextDayDate,
              currentColumnRect: nextColumnRect,
            }
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
