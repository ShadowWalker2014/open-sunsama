import type { TimeBlock } from "@open-sunsama/types";

// The API reminder worker checks one minute at a time. Keep the desktop
// runner's tolerance aligned so it catches polling or wake-up delays.
const REMINDER_TOLERANCE_MS = 60 * 1000;

export function getDesktopReminderKey(
  block: Pick<TimeBlock, "id" | "startTime">
): string {
  return `${block.id}:${new Date(block.startTime).toISOString()}`;
}

export function getDueDesktopReminders(
  blocks: TimeBlock[],
  now: Date,
  reminderTimingMinutes: number,
  sentKeys: ReadonlySet<string>
): TimeBlock[] {
  const nowMs = now.getTime();
  const windowMs = reminderTimingMinutes * 60 * 1000;

  return blocks.filter((block) => {
    const startMs = new Date(block.startTime).getTime();
    const reminderAtMs = startMs - windowMs;
    const key = getDesktopReminderKey(block);
    return (
      startMs > nowMs &&
      reminderAtMs <= nowMs &&
      reminderAtMs > nowMs - REMINDER_TOLERANCE_MS &&
      !sentKeys.has(key)
    );
  });
}
