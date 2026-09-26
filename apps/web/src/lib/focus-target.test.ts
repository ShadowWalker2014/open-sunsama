import { describe, expect, it } from "vitest";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { pickFocusTarget } from "./focus-target";

const now = new Date("2026-09-24T15:00:00Z");

function task(id: string, position: number, overrides: Partial<Task> = {}): Task {
  return { id, position, completedAt: null, timerStartedAt: null, ...overrides } as Task;
}

function block(taskId: string | null, start: string, end: string): TimeBlock {
  return { id: `b-${taskId}`, taskId, startTime: new Date(start), endTime: new Date(end) } as TimeBlock;
}

describe("pickFocusTarget", () => {
  it("prefers the task with a running timer", () => {
    const running = task("running", 9, { timerStartedAt: now });
    expect(
      pickFocusTarget({
        activeTimerTask: running,
        todayTasks: [task("a", 0), running],
        todayTimeBlocks: [block("a", "2026-09-24T14:00:00Z", "2026-09-24T16:00:00Z")],
        now,
      })
    ).toEqual({ kind: "task", taskId: "running" });
  });

  it("ignores a running timer on a completed task", () => {
    expect(
      pickFocusTarget({
        activeTimerTask: task("done", 0, { completedAt: now, timerStartedAt: now }),
        todayTasks: [task("a", 1)],
        todayTimeBlocks: [],
        now,
      })
    ).toEqual({ kind: "task", taskId: "a" });
  });

  it("uses the time block happening now", () => {
    expect(
      pickFocusTarget({
        activeTimerTask: null,
        todayTasks: [task("first", 0), task("blocked", 5)],
        todayTimeBlocks: [
          block("first", "2026-09-24T12:00:00Z", "2026-09-24T13:00:00Z"),
          block(null, "2026-09-24T14:30:00Z", "2026-09-24T15:30:00Z"),
          block("blocked", "2026-09-24T14:30:00Z", "2026-09-24T15:30:00Z"),
        ],
        now,
      })
    ).toEqual({ kind: "task", taskId: "blocked" });
  });

  it("skips a current block whose task is already complete", () => {
    expect(
      pickFocusTarget({
        activeTimerTask: null,
        todayTasks: [task("done", 0, { completedAt: now }), task("next", 3), task("later", 7)],
        todayTimeBlocks: [block("done", "2026-09-24T14:30:00Z", "2026-09-24T15:30:00Z")],
        now,
      })
    ).toEqual({ kind: "task", taskId: "next" });
  });

  it("falls back to the first incomplete task by position", () => {
    expect(
      pickFocusTarget({
        activeTimerTask: null,
        todayTasks: [task("b", 2), task("a", 1), task("done", 0, { completedAt: now })],
        todayTimeBlocks: [],
        now,
      })
    ).toEqual({ kind: "task", taskId: "a" });
  });

  it("reports all done when every task today is complete", () => {
    expect(
      pickFocusTarget({
        activeTimerTask: null,
        todayTasks: [task("done", 0, { completedAt: now })],
        todayTimeBlocks: [],
        now,
      })
    ).toEqual({ kind: "all-done" });
  });

  it("reports nothing planned when today is empty", () => {
    expect(
      pickFocusTarget({ activeTimerTask: null, todayTasks: [], todayTimeBlocks: [], now })
    ).toEqual({ kind: "nothing-planned" });
  });
});
