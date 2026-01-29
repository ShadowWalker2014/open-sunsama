import { useState, useCallback, useRef } from "react";
import type { Task, TimeBlock } from "@chronoflow/types";
import type { DragState, DropPreview, CalendarDndOptions } from "./calendar-dnd-types";
import {
  calculateTimeFromY,
  calculateYFromTime,
  snapToInterval,
  formatTimeRange,
  calculateTaskDropPreview,
  calculateMovePreview,
  calculateResizePreview,
} from "./calendar-dnd-utils";

// Re-export types and utilities for backwards compatibility
export type { DragType, DragState, DropPreview } from "./calendar-dnd-types";
export {
  HOUR_HEIGHT,
  SNAP_INTERVAL,
  MIN_BLOCK_DURATION,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  calculateTimeFromY,
  calculateYFromTime,
  snapToInterval,
  calculateTaskDropPreview,
  calculateMovePreview,
  calculateResizePreview,
  formatTimeRange,
} from "./calendar-dnd-utils";

/**
 * Custom hook for calendar drag and drop
 */
export function useCalendarDnd(
  selectedDate: Date,
  options?: CalendarDndOptions
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  /**
   * Start dragging a task from unscheduled list
   */
  const startTaskDrag = useCallback(
    (task: Task, startY: number) => {
      setDragState({
        type: "task-to-timeline",
        taskId: task.id,
        task,
        startY,
        currentY: startY,
      });
    },
    []
  );

  /**
   * Start dragging a time block to move it
   */
  const startBlockDrag = useCallback(
    (block: TimeBlock, startY: number) => {
      setDragState({
        type: "move-block",
        blockId: block.id,
        block,
        startY,
        currentY: startY,
        initialStartTime: new Date(block.startTime),
        initialEndTime: new Date(block.endTime),
      });
    },
    []
  );

  /**
   * Start resizing a time block
   */
  const startBlockResize = useCallback(
    (block: TimeBlock, edge: "top" | "bottom", startY: number) => {
      setDragState({
        type: edge === "top" ? "resize-top" : "resize-bottom",
        blockId: block.id,
        block,
        startY,
        currentY: startY,
        initialStartTime: new Date(block.startTime),
        initialEndTime: new Date(block.endTime),
      });
    },
    []
  );

  /**
   * Update drag position
   */
  const updateDrag = useCallback(
    (currentY: number, timelineRect?: DOMRect) => {
      if (!dragState) return;

      setDragState((prev) => (prev ? { ...prev, currentY } : null));

      // Calculate drop preview
      if (!timelineRect && timelineRef.current) {
        timelineRect = timelineRef.current.getBoundingClientRect();
      }

      if (!timelineRect) return;

      const relativeY = currentY - timelineRect.top + (timelineRef.current?.scrollTop ?? 0);

      switch (dragState.type) {
        case "task-to-timeline": {
          const duration = dragState.task?.estimatedMins ?? 60;
          const preview = calculateTaskDropPreview(relativeY, selectedDate, duration);
          setDropPreview(preview);
          break;
        }
        case "move-block": {
          if (dragState.block) {
            const deltaY = currentY - dragState.startY;
            const preview = calculateMovePreview(deltaY, dragState.block, selectedDate);
            setDropPreview(preview);
          }
          break;
        }
        case "resize-top":
        case "resize-bottom": {
          if (dragState.block) {
            const deltaY = currentY - dragState.startY;
            const edge = dragState.type === "resize-top" ? "top" : "bottom";
            const preview = calculateResizePreview(
              deltaY,
              dragState.block,
              edge,
              selectedDate
            );
            setDropPreview(preview);
          }
          break;
        }
      }
    },
    [dragState, selectedDate]
  );

  /**
   * End drag operation and commit changes
   */
  const endDrag = useCallback(
    (cancelled: boolean = false) => {
      if (!dragState || cancelled || !dropPreview) {
        setDragState(null);
        setDropPreview(null);
        return;
      }

      const { startTime, endTime } = dropPreview;

      switch (dragState.type) {
        case "task-to-timeline":
          if (dragState.taskId) {
            options?.onTaskDrop?.(dragState.taskId, startTime, endTime);
          }
          break;
        case "move-block":
          if (dragState.blockId) {
            options?.onBlockMove?.(dragState.blockId, startTime, endTime);
          }
          break;
        case "resize-top":
        case "resize-bottom":
          if (dragState.blockId) {
            options?.onBlockResize?.(dragState.blockId, startTime, endTime);
          }
          break;
      }

      setDragState(null);
      setDropPreview(null);
    },
    [dragState, dropPreview, options]
  );

  /**
   * Cancel drag operation
   */
  const cancelDrag = useCallback(() => {
    setDragState(null);
    setDropPreview(null);
  }, []);

  return {
    // State
    dragState,
    dropPreview,
    isDragging: dragState !== null,
    timelineRef,

    // Actions
    startTaskDrag,
    startBlockDrag,
    startBlockResize,
    updateDrag,
    endDrag,
    cancelDrag,

    // Utilities
    calculateTimeFromY: (y: number) => calculateTimeFromY(y, selectedDate),
    calculateYFromTime,
    snapToInterval,
    formatTimeRange,
  };
}
