import { describe, expect, it } from "vitest";
import type { TimeBlock } from "@open-sunsama/types";
import {
  getDesktopReminderKey,
  getDueDesktopReminders,
} from "./desktop-reminders";

function block(id: string, startTime: string): TimeBlock {
  return { id, startTime: new Date(startTime) } as TimeBlock;
}

describe("desktop reminders", () => {
  it("selects only unsent blocks at the reminder time", () => {
    const now = new Date("2026-10-02T09:00:00.000Z");
    const due = block("due", "2026-10-02T09:15:00.000Z");
    const sent = block("sent", "2026-10-02T09:10:00.000Z");
    const late = block("late", "2026-10-02T08:59:00.000Z");
    const later = block("later", "2026-10-02T09:16:00.000Z");

    expect(
      getDueDesktopReminders(
        [due, sent, late, later],
        now,
        15,
        new Set([getDesktopReminderKey(sent)])
      )
    ).toEqual([due]);
  });

  it("allows a one-minute tolerance for delayed polling", () => {
    const now = new Date("2026-10-02T09:00:30.000Z");
    const due = block("due", "2026-10-02T09:15:00.000Z");

    expect(getDueDesktopReminders([due], now, 15, new Set())).toEqual([due]);
  });

  it("changes the dedupe key when a block is rescheduled", () => {
    const original = block("same-id", "2026-10-02T09:15:00.000Z");
    const rescheduled = block("same-id", "2026-10-02T09:30:00.000Z");

    expect(getDesktopReminderKey(original)).not.toBe(
      getDesktopReminderKey(rescheduled)
    );
  });
});
