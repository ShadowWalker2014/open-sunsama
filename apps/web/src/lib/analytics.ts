/**
 * DataFast custom goals (https://datafa.st/docs/custom-goals).
 *
 * The queue stub in index.html buffers calls made before the script loads.
 * DataFast ignores events from localhost and automated browsers, so this is
 * a no-op in development and tests.
 */

import { getAvatarUrl } from "./utils";

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

/**
 * Link this browser's visitor to the signed-in account, so DataFast shows a
 * profile per user across devices (https://datafa.st/docs/user-identification).
 * Call on every sign-in and whenever the user's profile changes.
 */
export function identifyUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}): void {
  const params: Record<string, string> = { user_id: user.id, email: user.email };
  if (user.name) params.name = user.name;
  // Avatars are stored as API-relative paths; DataFast rejects anything but a
  // full http(s) URL of at most 250 characters.
  const image = getAvatarUrl(user.avatarUrl);
  if (image && /^https?:/.test(image) && image.length <= 250) params.image = image;
  try {
    window.datafast?.("identify", params);
  } catch {
    // Analytics must never break the app.
  }
}
