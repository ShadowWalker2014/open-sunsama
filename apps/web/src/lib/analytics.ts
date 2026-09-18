/**
 * DataFast custom goals (https://datafa.st/docs/custom-goals).
 *
 * The queue stub in index.html buffers calls made before the script loads.
 * DataFast ignores events from localhost and automated browsers, so this is
 * a no-op in development and tests.
 */

export type Goal =
  | "signup"
  | "create_task"
  | "complete_task"
  | "create_time_block"
  | "start_focus"
  | "connect_ai"
  | "connect_calendar"
  | "download_app";

declare global {
  interface Window {
    datafast?: (goal: string, params?: Record<string, string>) => void;
  }
}

export function trackGoal(goal: Goal, params?: Record<string, string>): void {
  try {
    window.datafast?.(goal, params);
  } catch {
    // Analytics must never break the app.
  }
}
