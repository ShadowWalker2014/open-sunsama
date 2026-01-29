import { useState, useCallback, useRef } from "react";
import type { Task, TimeBlock } from "@chronoflow/types";
import {
  addMinutes,
  setHours,
  setMinutes,
  differenceInMinutes,
  format,
} from "date-fns";

/**
 * Constants for timeline calculations
 */
export const HOUR_HEIGHT = 64; // pixels per hour
export const SNAP_INTERVAL = 15; // minutes
export const MIN_BLOCK_DURATION = 15; // minimum duration in minutes
export const TIMELINE_START_HOUR = 0; // 00:00
export const TIMELINE_END_HOUR = 23; // 23:00

/**
 * Types for drag and drop operations
 */
export type DragType =
  | "task-to-timeline" // Dragging unscheduled task to timeline
  | "move-block" // Moving existing time block
  | "resize-top" // Resizing block from top edge
  | "resize-bottom"; // Resizing block from bottom edge

export interface DragState {
  type: DragType;
  taskId?: string;
  blockId?: string;
  task?: Task;
  block?: TimeBlock;
  startY: number;
  currentY: number;
  initialStartTime?: Date;
  initialEndTime?: Date;
}

export interface DropPreview {
  startTime: Date;
  endTime: Date;
  top: number;
  height: number;
}

/**
 * Calculate time from Y position on timeline
 */
export function calculateTimeFromY(y: number, baseDate: Date): Date {
  // Calculate hours and minutes from Y position
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  const hours = Math.floor(totalMinutes / 60) + TIMELINE_START_HOUR;
  const minutes = totalMinutes % 60;

  // Create date with calculated time
  let result = setHours(baseDate, Math.min(hours, 23));
  result = setMinutes(result, Math.min(Math.max(0, minutes), 59));

  return result;
}

/**
 * Calculate Y position from time
 */
export function calculateYFromTime(time: Date): number {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return ((hours - TIMELINE_START_HOUR) * 60 + minutes) * (HOUR_HEIGHT / 60);
}

/**
 * Snap time to nearest interval
 */
export function snapToInterval(time: Date, intervalMinutes: number = SNAP_INTERVAL): Date {
  const minutes = time.getMinutes();
  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;
  
  let result = setMinutes(time, snappedMinutes % 60);
  
  // Handle overflow to next hour
  if (snappedMinutes >= 60) {
    result = setHours(result, result.getHours() + Math.floor(snappedMinutes / 60));
    result = setMinutes(result, snappedMinutes % 60);
  }
  
  return result;
}

/**
 * Calculate drop preview for task being dragged to timeline
 */
export function calculateTaskDropPreview(
  y: number,
  baseDate: Date,
  durationMins: number = 60
): DropPreview {
  const rawTime = calculateTimeFromY(y, baseDate);
  const startTime = snapToInterval(rawTime);
  const endTime = addMinutes(startTime, durationMins);

  const top = calculateYFromTime(startTime);
  const height = (durationMins / 60) * HOUR_HEIGHT;

  return { startTime, endTime, top, height };
}

/**
 * Calculate preview for moving a time block
 */
export function calculateMovePreview(
  deltaY: number,
  block: TimeBlock,
  baseDate: Date
): DropPreview {
  const originalDuration = differenceInMinutes(
    new Date(block.endTime),
    new Date(block.startTime)
  );
  
  const originalTop = calculateYFromTime(new Date(block.startTime));
  const newTop = Math.max(0, originalTop + deltaY);
  
  const rawStartTime = calculateTimeFromY(newTop, baseDate);
  const startTime = snapToInterval(rawStartTime);
  const endTime = addMinutes(startTime, originalDuration);

  const top = calculateYFromTime(startTime);
  const height = (originalDuration / 60) * HOUR_HEIGHT;

  return { startTime, endTime, top, height };
}

/**
 * Calculate preview for resizing a time block
 */
export function calculateResizePreview(
  deltaY: number,
  block: TimeBlock,
  edge: "top" | "bottom",
  baseDate: Date
): DropPreview {
  const originalStart = new Date(block.startTime);
  const originalEnd = new Date(block.endTime);
  
  let startTime: Date;
  let endTime: Date;

  if (edge === "top") {
    const originalTop = calculateYFromTime(originalStart);
    const newTop = Math.max(0, originalTop + deltaY);
    const rawStartTime = calculateTimeFromY(newTop, baseDate);
    startTime = snapToInterval(rawStartTime);
    endTime = originalEnd;
    
    // Ensure minimum duration
    const duration = differenceInMinutes(endTime, startTime);
    if (duration < MIN_BLOCK_DURATION) {
      startTime = addMinutes(endTime, -MIN_BLOCK_DURATION);
    }
  } else {
    startTime = originalStart;
    const originalBottom = calculateYFromTime(originalEnd);
    const newBottom = originalBottom + deltaY;
    const rawEndTime = calculateTimeFromY(newBottom, baseDate);
    endTime = snapToInterval(rawEndTime);
    
    // Ensure minimum duration
    const duration = differenceInMinutes(endTime, startTime);
    if (duration < MIN_BLOCK_DURATION) {
      endTime = addMinutes(startTime, MIN_BLOCK_DURATION);
    }
  }

  const top = calculateYFromTime(startTime);
  const height = Math.max(
    (MIN_BLOCK_DURATION / 60) * HOUR_HEIGHT,
    (differenceInMinutes(endTime, startTime) / 60) * HOUR_HEIGHT
  );

  return { startTime, endTime, top, height };
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
}

/**
 * Custom hook for calendar drag and drop
 */
export function useCalendarDnd(
  selectedDate: Date,
  options?: {
    onTaskDrop?: (taskId: string, startTime: Date, endTime: Date) => void;
    onBlockMove?: (blockId: string, startTime: Date, endTime: Date) => void;
    onBlockResize?: (blockId: string, startTime: Date, endTime: Date) => void;
  }
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
