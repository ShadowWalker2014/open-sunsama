/**
 * Centralised React Query key factories.
 *
 * Each domain hook (`useTasks`, `useTimer`, `useTimeBlocks`, …) used to
 * own + export its own `*Keys` factory. That meant `useWebSocket`, which
 * only needs the keys to invalidate caches on incoming events, was
 * pulling the full mutation/state code of every domain hook into its
 * dependency tree — and `useWebSocket` is mounted at the app shell,
 * which then sucked all of those modules into the boot bundle.
 *
 * Pulling the key factories into this leaf-level file lets the entry
 * chunk import only the tiny key shapes while the heavy mutation code
 * stays behind whatever route or component actually uses it.
 *
 * Domain hooks re-export their own key from here for backwards
 * compatibility so consumers like `useTasks.taskKeys` keep working.
 */

import type { TaskFilterInput, TimeBlockFilterInput } from "@open-sunsama/types";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilterInput) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export const timerKeys = {
  active: () => ["tasks", "timer", "active"] as const,
};

export const timeBlockKeys = {
  all: ["timeBlocks"] as const,
  lists: () => [...timeBlockKeys.all, "list"] as const,
  list: (filters: TimeBlockFilterInput) =>
    [...timeBlockKeys.lists(), filters] as const,
  details: () => [...timeBlockKeys.all, "detail"] as const,
  detail: (id: string) => [...timeBlockKeys.details(), id] as const,
};

export const subtaskKeys = {
  all: ["subtasks"] as const,
  lists: () => [...subtaskKeys.all, "list"] as const,
  list: (taskId: string) => [...subtaskKeys.lists(), taskId] as const,
  details: () => [...subtaskKeys.all, "detail"] as const,
  detail: (id: string) => [...subtaskKeys.details(), id] as const,
};

export const calendarKeys = {
  all: ["calendars"] as const,
  accounts: () => [...calendarKeys.all, "accounts"] as const,
  calendars: () => [...calendarKeys.all, "list"] as const,
  events: (from: string, to: string) =>
    [...calendarKeys.all, "events", from, to] as const,
};
