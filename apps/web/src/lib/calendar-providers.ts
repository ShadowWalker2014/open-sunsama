/**
 * Single source of truth for which calendar providers support
 * write-back (create / update / delete from in-app surfaces).
 *
 * Previously declared in 4 separate places (calendar-view, mobile-
 * calendar-view, kanban-calendar-panel, create-dialog/event-form),
 * which had drifted at least once during the per-provider rollout
 * (Outlook added in 3 of 4 sites in one PR, then iCloud in all 4
 * later). Centralised here so adding a new provider is a one-line
 * change.
 */
export const PROVIDERS_WITH_WRITE_BACK: ReadonlySet<string> = new Set([
  "google",
  "outlook",
  "icloud",
]);

/**
 * Lookup helper: given a per-calendar map of provider names (resolved
 * via the account map), return whether the calendar accepts writes
 * AND isn't flagged read-only by the provider itself.
 *
 * Returns `true` for "calendar should be treated as read-only in our
 * UI" — which gates the Edit/Delete buttons in the detail sheet, the
 * drag/resize handles on the timeline, and the calendar picker in
 * the create-event dialog.
 */
export function isCalendarReadOnlyForUi(
  provider: string | undefined,
  isReadOnly: boolean
): boolean {
  if (!provider || !PROVIDERS_WITH_WRITE_BACK.has(provider)) return true;
  return isReadOnly;
}
