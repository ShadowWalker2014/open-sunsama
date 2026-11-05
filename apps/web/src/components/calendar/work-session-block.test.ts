import { describe, expect, it } from "vitest";
import type { TimeBlock, WorkSession } from "@open-sunsama/types";
import {
  plannedColor,
  sessionsOnDay,
  sessionLayoutItem,
} from "./work-session-block";

function session(id: string, startedAt: Date, endedAt: Date): WorkSession {
  return {
    id,
    taskId: "task-1",
    taskTitle: "Write report",
    startedAt,
    endedAt,
    isRunning: false,
  };
}

const DAY = new Date(2026, 9, 23);

describe("sessionsOnDay", () => {
  it("keeps sessions that overlap the day", () => {
    const morning = session(
      "a",
      new Date(2026, 9, 23, 9),
      new Date(2026, 9, 23, 10)
    );
    const yesterday = session(
      "b",
      new Date(2026, 9, 22, 9),
      new Date(2026, 9, 22, 10)
    );
    const overnight = session(
      "c",
      new Date(2026, 9, 22, 23),
      new Date(2026, 9, 23, 1)
    );
    expect(
      sessionsOnDay([morning, yesterday, overnight], DAY).map((s) => s.id)
    ).toEqual(["a", "c"]);
  });
});

describe("sessionLayoutItem", () => {
  it("clips a session that started the day before to the start of the day", () => {
    const overnight = session(
      "c",
      new Date(2026, 9, 22, 23),
      new Date(2026, 9, 23, 1)
    );
    expect(sessionLayoutItem(overnight, DAY)).toEqual({
      id: "session:c",
      start: new Date(2026, 9, 23, 0),
      end: new Date(2026, 9, 23, 1),
    });
  });
});

describe("sessionLayoutItem for a short session", () => {
  it("takes up at least 20 minutes so it doesn't draw over the next block", () => {
    const short = session(
      "d",
      new Date(2026, 9, 23, 9, 0),
      new Date(2026, 9, 23, 9, 2)
    );
    expect(sessionLayoutItem(short, DAY).end).toEqual(
      new Date(2026, 9, 23, 9, 20)
    );
  });
});

describe("plannedColor", () => {
  const morning = session(
    "e",
    new Date(2026, 9, 23, 9),
    new Date(2026, 9, 23, 10)
  );
  const block = (taskId: string, startTime: Date, color: string) =>
    ({ taskId, startTime, color }) as TimeBlock;

  it("uses the color of the task's planned block that day", () => {
    const blocks = [
      block("task-2", new Date(2026, 9, 23, 9), "#EF4444"),
      block("task-1", new Date(2026, 9, 22, 9), "#22C55E"),
      block("task-1", new Date(2026, 9, 23, 14), "#8B5CF6"),
    ];
    expect(plannedColor(morning, DAY, blocks)).toBe("#8B5CF6");
  });

  it("falls back to the planned blocks' default blue", () => {
    expect(plannedColor(morning, DAY, [])).toBe("#3B82F6");
  });
});
