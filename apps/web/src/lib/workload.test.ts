import { describe, expect, it } from "vitest";
import type { Task } from "@open-sunsama/types";
import { actualMinutes } from "./workload";

const task = (fields: Partial<Task>) =>
  ({ actualMins: null, timerStartedAt: null, timerAccumulatedSeconds: 0, ...fields }) as Task;

describe("actualMinutes", () => {
  it("uses the logged actual time when no timer runs", () => {
    expect(actualMinutes(task({ actualMins: 25 }))).toBe(25);
    expect(actualMinutes(task({}))).toBe(0);
  });

  it("counts a running timer up to now", () => {
    const now = new Date(2026, 9, 25, 10, 0).getTime();
    const running = task({
      actualMins: 10,
      timerAccumulatedSeconds: 600,
      timerStartedAt: new Date(2026, 9, 25, 9, 30),
    });
    expect(actualMinutes(running, now)).toBe(40);
  });
});
