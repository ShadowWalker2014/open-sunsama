/**
 * Route utilities for context-aware features
 */

export type CurrentView = "tasks" | "calendar" | "settings" | "all-tasks";

/**
 * Determine the current view from pathname
 */
export function getCurrentView(pathname: string): CurrentView {
  if (pathname.includes("/calendar")) return "calendar";
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/tasks")) return "all-tasks";
  return "tasks"; // Default /app route is the kanban board
}
