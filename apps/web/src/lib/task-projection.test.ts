import { describe, expect, it } from "vitest";
import { projectTaskStarts, projectedBlocks } from "./task-projection";

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

describe("projectedBlocks", () => {
  const task = (id: string, position: number, extra = {}) => ({ id, position, ...extra });
  const base = {
    enabled: true,
    day: at(0),
    workStartHour: 9,
    now: new Date(2026, 8, 28, 15, 0), // the day before
    blocks: [] as { taskId?: string | null; startTime: Date; endTime: Date }[],
    events: [] as { isAllDay?: boolean; responseStatus?: string | null; startTime: Date; endTime: Date }[],
  };

  it("draws open tasks in list order, as long as their estimate", () => {
    const blocks = projectedBlocks({
      ...base,
      tasks: [task("b", 2, { estimatedMins: 30 }), task("a", 1, { estimatedMins: 60 })],
    });
    expect(blocks.map((b) => [b.task.id, hhmm(b.start), hhmm(b.end)])).toEqual([
      ["a", "09:00", "10:00"],
      ["b", "10:00", "10:30"],
    ]);
  });

  it("draws nothing when projected tasks are turned off", () => {
    const blocks = projectedBlocks({
      ...base,
      enabled: false,
      tasks: [task("a", 1), task("b", 2)],
    });
    expect(blocks).toEqual([]);
  });

  it("skips done tasks and tasks that already have a block", () => {
    const blocks = projectedBlocks({
      ...base,
      tasks: [task("done", 1, { completedAt: at(8) }), task("planned", 2), task("open", 3)],
      blocks: [{ taskId: "planned", startTime: at(9), endTime: at(9, 30) }],
    });
    expect(blocks.map((b) => [b.task.id, hhmm(b.start)])).toEqual([["open", "09:30"]]);
  });

  it("steps over meetings, but not declined or all-day ones", () => {
    const blocks = projectedBlocks({
      ...base,
      tasks: [task("a", 1, { estimatedMins: 30 })],
      events: [
        { startTime: at(9), endTime: at(9, 30), responseStatus: "declined" },
        { startTime: at(0), endTime: at(23, 59), isAllDay: true },
        { startTime: at(9, 15), endTime: at(10) },
      ],
    });
    expect(hhmm(blocks[0]?.start)).toBe("10:00");
  });
});
