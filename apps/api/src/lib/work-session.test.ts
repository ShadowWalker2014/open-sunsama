import { describe, expect, it, vi } from "vitest";
import { logWorkSession } from "./timer-service.js";

function fakeDb() {
  const values = vi.fn();
  return { db: { insert: vi.fn(() => ({ values })) } as never, values };
}

const START = new Date("2026-10-23T14:00:00Z");

describe("logWorkSession", () => {
  it("saves the run from when the timer started to when it stopped", async () => {
    const { db, values } = fakeDb();
    const end = new Date("2026-10-23T14:45:00Z");
    await logWorkSession(
      db,
      { id: "task-1", userId: "user-1", timerStartedAt: START },
      end
    );
    expect(values).toHaveBeenCalledWith({
      userId: "user-1",
      taskId: "task-1",
      startedAt: START,
      endedAt: end,
    });
  });

  it("skips runs shorter than a minute", async () => {
    const { db, values } = fakeDb();
    const end = new Date("2026-10-23T14:00:30Z");
    await logWorkSession(
      db,
      { id: "task-1", userId: "user-1", timerStartedAt: START },
      end
    );
    expect(values).not.toHaveBeenCalled();
  });

  it("does nothing when no timer was running", async () => {
    const { db, values } = fakeDb();
    await logWorkSession(db, {
      id: "task-1",
      userId: "user-1",
      timerStartedAt: null,
    });
    expect(values).not.toHaveBeenCalled();
  });
});
