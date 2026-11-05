import { describe, expect, it } from "vitest";
import type { WorkSession } from "@open-sunsama/types";
import { mergeBackToBackRuns } from "./work-sessions";

function run(
  taskId: string,
  start: string,
  end: string,
  isRunning = false
): WorkSession {
  return {
    id: `${taskId}-${start}`,
    taskId,
    taskTitle: taskId,
    startedAt: new Date(`2026-10-23T${start}:00`),
    endedAt: new Date(`2026-10-23T${end}:00`),
    isRunning,
  };
}

describe("mergeBackToBackRuns", () => {
  it("joins a pause and resume of the same task into one block", () => {
    const merged = mergeBackToBackRuns([
      run("report", "09:00", "09:40"),
      run("report", "09:45", "10:00", true),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      startedAt: new Date("2026-10-23T09:00:00"),
      endedAt: new Date("2026-10-23T10:00:00"),
      isRunning: true,
    });
  });

  it("keeps runs apart when the pause is 15 minutes or longer", () => {
    const merged = mergeBackToBackRuns([
      run("report", "09:00", "09:40"),
      run("report", "09:55", "10:30"),
    ]);
    expect(merged).toHaveLength(2);
  });

  it("keeps runs apart when another task was worked on in between", () => {
    const merged = mergeBackToBackRuns([
      run("report", "09:00", "09:20"),
      run("email", "09:21", "09:25"),
      run("report", "09:26", "10:00"),
    ]);
    expect(merged.map((s) => s.taskId)).toEqual(["report", "email", "report"]);
  });

  it("leaves the input untouched", () => {
    const first = run("report", "09:00", "09:40");
    mergeBackToBackRuns([first, run("report", "09:45", "10:00")]);
    expect(first.endedAt).toEqual(new Date("2026-10-23T09:40:00"));
  });
});
