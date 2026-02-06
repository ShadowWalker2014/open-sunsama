/**
 * WebSocket event types and utilities
 * Defines the event structure for real-time notifications
 */

/**
 * All possible WebSocket event types
 */
export type WebSocketEventType =
  // Task events
  | "task:created"
  | "task:updated"
  | "task:deleted"
  | "task:completed"
  | "task:reordered"
  // Task series (recurring tasks) events
  | "task-series:created"
  | "task-series:updated"
  | "task-series:deleted"
  // Time block events
  | "timeblock:created"
  | "timeblock:updated"
  | "timeblock:deleted"
  // Calendar events
  | "calendar:account-disconnected"
  | "calendar:synced"
  | "calendar:updated"
  // Timer events
  | "timer:started"
  | "timer:stopped"
  // User events
  | "user:updated"
  // Connection events
  | "connected";

/**
 * Base WebSocket event structure
 */
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
}

/**
 * Event payload for task create/update/delete/complete
 */
export interface TaskEvent {
  taskId: string;
  scheduledDate?: string | null;
}

/**
 * Event payload for task reordering
 */
export interface TaskReorderedEvent {
  date: string; // 'backlog' or 'YYYY-MM-DD'
  taskIds: string[];
}

/**
 * Event payload for time block create/update/delete
 */
export interface TimeBlockEvent {
  timeBlockId: string;
  date: string;
}

/**
 * Event payload for user profile updates
 */
export interface UserEvent {
  fields: string[]; // Which fields changed: ['name', 'timezone', 'avatarUrl', 'preferences']
  preferences?: {
    themeMode?: string;
    colorTheme?: string;
    fontFamily?: string;
  } | null; // Include actual preference values when preferences changed
}

/**
 * Event payload for timer started
 */
export interface TimerStartedEvent {
  taskId: string;
  startedAt: string; // ISO 8601 timestamp
  accumulatedSeconds: number; // seconds already accumulated before this start
}

/**
 * Event payload for timer stopped
 */
export interface TimerStoppedEvent {
  taskId: string;
  actualMins: number; // final actualMins saved on the task
}

/**
 * Get the Redis channel name for a user's events
 * @param userId - The user ID
 * @returns The Redis channel name
 */
export function getUserChannel(userId: string): string {
  return `user:${userId}:events`;
}
