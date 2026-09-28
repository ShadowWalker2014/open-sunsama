import { describe, expect, it } from "vitest";
import { projectTaskStarts } from "./task-projection";

const at = (h: number, m = 0) => new Date(2026, 8, 29, h, m);
const hhmm = (d?: Date) =>
  d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : undefined;

describe("projectTaskStarts", () => {
  const base = {
    day: at(0),
    blockedTaskIds: new Set<string>(),
    busy: [],
    workStartHour: 9,
    now: new Date(2026, 8, 28, 15, 0), // the day before
  };

  it("stacks tasks from the workday start, 20 minutes when unestimated", () => {
    const starts = projectTaskStarts({
      ...base,
      tasks: [{ id: "a" }, { id: "b", estimatedMins: 45 }, { id: "c" }],
    });
    expect([...starts.values()].map(hhmm)).toEqual(["09:00", "09:20", "10:05"]);
  });

  it("steps over meetings and existing blocks, and skips blocked tasks", () => {
    const starts = projectTaskStarts({
      ...base,
      tasks: [{ id: "a", estimatedMins: 60 }, { id: "blocked" }, { id: "b" }],
      blockedTaskIds: new Set(["blocked"]),
      busy: [{ start: at(9, 30), end: at(10, 0) }],
    });
    expect(hhmm(starts.get("a"))).toBe("10:00");
    expect(starts.has("blocked")).toBe(false);
    expect(hhmm(starts.get("b"))).toBe("11:00");
  });

  it("starts today's projection from now, rounded up to 5 minutes", () => {
    const starts = projectTaskStarts({
      ...base,
      now: at(13, 42),
      tasks: [{ id: "a" }],
    });
    expect(hhmm(starts.get("a"))).toBe("13:45");
  });

  it("projects nothing for past days", () => {
    const starts = projectTaskStarts({
      ...base,
      now: new Date(2026, 8, 30, 9, 0),
      tasks: [{ id: "a" }],
    });
    expect(starts.size).toBe(0);
  });
});
