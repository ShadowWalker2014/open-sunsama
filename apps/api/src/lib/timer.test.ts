import { describe, expect, it } from "vitest";
import { stopTimerFields, timerSeconds } from "./timer.js";

const T0 = Date.UTC(2026, 8, 28, 9, 0, 0);

describe("timerSeconds", () => {
  it("adds the running time to the seconds logged before this run", () => {
    const task = {
      timerStartedAt: new Date(T0),
      timerAccumulatedSeconds: 90,
      actualMins: 2,
    };
    expect(timerSeconds(task, T0 + 30_000)).toBe(120);
  });

  it("never goes backwards when the clock is behind the start", () => {
    const task = {
      timerStartedAt: new Date(T0),
      timerAccumulatedSeconds: 60,
      actualMins: 1,
    };
    expect(timerSeconds(task, T0 - 5_000)).toBe(60);
  });

  it("resumes from the exact seconds after a stop", () => {
    expect(
      timerSeconds({ timerStartedAt: null, timerAccumulatedSeconds: 65, actualMins: 2 })
    ).toBe(65);
  });

  it("uses a manual edit of actual time over stale seconds", () => {
    expect(
      timerSeconds({ timerStartedAt: null, timerAccumulatedSeconds: 65, actualMins: 30 })
    ).toBe(1800);
  });

  it("starts from actual minutes when there are no seconds", () => {
    expect(
      timerSeconds({ timerStartedAt: null, timerAccumulatedSeconds: 0, actualMins: 5 })
    ).toBe(300);
    expect(
      timerSeconds({ timerStartedAt: null, timerAccumulatedSeconds: 0, actualMins: null })
    ).toBe(0);
  });
});

describe("stopTimerFields", () => {
  it("rounds actual minutes up and keeps the exact seconds", () => {
    const task = {
      timerStartedAt: new Date(T0),
      timerAccumulatedSeconds: 0,
      actualMins: null,
    };
    expect(stopTimerFields(task, T0 + 5_000)).toEqual({
      actualMins: 1,
      timerStartedAt: null,
      timerAccumulatedSeconds: 5,
    });
  });

  it("does not inflate time over many quick start/stop cycles", () => {
    let task = {
      timerStartedAt: null as Date | null,
      timerAccumulatedSeconds: 0,
      actualMins: null as number | null,
    };
    let now = T0;
    for (let i = 0; i < 10; i++) {
      // start: resume from the logged seconds
      task = {
        ...task,
        timerStartedAt: new Date(now),
        timerAccumulatedSeconds: timerSeconds(task, now),
      };
      now += 3_000;
      task = { ...task, ...stopTimerFields(task, now) };
    }
    expect(task.timerAccumulatedSeconds).toBe(30);
    expect(task.actualMins).toBe(1);
  });
});
