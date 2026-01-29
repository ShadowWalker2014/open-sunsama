import type { Task, TimeBlock } from "@chronoflow/types";

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

export interface CalendarDndOptions {
  onTaskDrop?: (taskId: string, startTime: Date, endTime: Date) => void;
  onBlockMove?: (blockId: string, startTime: Date, endTime: Date) => void;
  onBlockResize?: (blockId: string, startTime: Date, endTime: Date) => void;
}
