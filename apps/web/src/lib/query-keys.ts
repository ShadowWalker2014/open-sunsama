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
  // Every cache under `lists()` must hold a plain `Task[]`: task mutations
  // walk all of them with `getQueriesData`/`setQueriesData` and spread or map
  // the value. Anything shaped differently needs a key outside this prefix.
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilterInput) => [...taskKeys.lists(), filters] as const,
  // The kanban's range prefetch (`useKanbanRangePrefetch`) caches an object,
  // not a Task[], so it lives beside `lists()` rather than under it.
  range: (from: string, to: string) =>
    [...taskKeys.all, "range", { from, to }] as const,
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

export const ideaBoardKeys = {
  all: ["ideaBoards"] as const,
  lists: () => [...ideaBoardKeys.all, "list"] as const,
  columns: (boardId: string) =>
    [...ideaBoardKeys.all, "columns", boardId] as const,
};

export const ideaKeys = {
  all: ["ideas"] as const,
  lists: () => [...ideaKeys.all, "list"] as const,
  byBoard: (boardId: string) => [...ideaKeys.lists(), boardId] as const,
};

export const ideaSubtaskKeys = {
  all: ["ideaSubtasks"] as const,
  lists: () => [...ideaSubtaskKeys.all, "list"] as const,
  list: (ideaId: string) => [...ideaSubtaskKeys.lists(), ideaId] as const,
};
