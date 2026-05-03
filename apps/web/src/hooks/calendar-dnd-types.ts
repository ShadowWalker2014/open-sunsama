import type { Task, TimeBlock, CalendarEvent } from "@open-sunsama/types";

/**
 * Types for drag and drop operations
 */
export type DragType =
  | "task-to-timeline" // Dragging unscheduled task to timeline
  | "move-block" // Moving existing time block
  | "resize-top" // Resizing block from top edge
  | "resize-bottom" // Resizing block from bottom edge
  | "move-event" // Moving an external calendar event
  | "resize-event-top" // Resizing external event from top
  | "resize-event-bottom"; // Resizing external event from bottom

export interface DragState {
  type: DragType;
  taskId?: string;
  blockId?: string;
  /** External calendar event id for move-event / resize-event-* */
  eventId?: string;
  task?: Task;
  block?: TimeBlock;
  /** External event being dragged */
  event?: CalendarEvent;
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
  /**
   * Fired after the user finishes dragging an external calendar event
   * to a new time slot. Receives the new times so the parent can
   * write the change back to the provider.
   */
  onEventMove?: (eventId: string, startTime: Date, endTime: Date) => void;
  /**
   * Fired after the user finishes resizing an external event from
   * either edge.
   */
  onEventResize?: (eventId: string, startTime: Date, endTime: Date) => void;
}
