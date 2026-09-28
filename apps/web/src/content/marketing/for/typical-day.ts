/**
 * "A typical day" on the persona pages (/for/*): an example day drawn as a
 * calendar rail by components/personas/typical-day.tsx. The same entries go
 * into the custom section's body, so the prerendered <noscript> HTML carries
 * them too. Pure data, like every content module.
 */

/** What kind of moment this is. Sets the block's color, like the app's calendar. */
export type DayTone =
  | "plan" // planning on the board
  | "block" // a time block on the calendar
  | "focus" // focus mode with the timer
  | "meeting" // a synced calendar event (read-only)
  | "agent" // an AI agent over MCP
  | "slip" // the plan goes wrong
  | "done"; // shutdown: check off, roll the rest

export interface DayEntry {
  /** "9:00", or "9:00 - 11:00" for a block. */
  time: string;
  tone: DayTone;
  /** The feature in play, shown as a small tag: "Rollover", "Focus mode". */
  tag: string;
  title: string;
  body: string;
}

/** The entries as paragraphs for the section body (and the prerendered HTML). */
export function dayBody(entries: DayEntry[]): string[] {
  return entries.map((entry) => `**${entry.time}: ${entry.title}.** ${entry.body}`);
}
