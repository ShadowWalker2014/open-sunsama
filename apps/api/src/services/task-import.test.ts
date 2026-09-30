import { describe, it, expect } from "vitest";
import {
  buildImportedTaskPatch,
  buildLinkMeta,
  IMPORTED_TASK_FIELDS,
  LOCAL_ONLY_TASK_FIELDS,
} from "./task-import";
import type { ExternalTask } from "./task-providers/index";

function external(overrides: Partial<ExternalTask> = {}): ExternalTask {
  return {
    externalId: "external-task-123",
    title: "Ship the thing",
    description: "Do the work",
    priority: "P1",
    estimatedMins: 60,
    isCompleted: false,
    statusName: "in progress",
    dueDate: null,
    url: "https://tasks.example.com/task/external-task-123",
    containerName: "Engineering",
    remoteUpdatedAt: new Date("2026-09-01T10:00:00Z"),
    subtasks: [],
    ...overrides,
  };
}

describe("buildImportedTaskPatch", () => {
  const current = { priority: "P3", completedAt: null, notes: "My own notes" };

  it("never writes a field that belongs to local planning", () => {
    // This is the whole promise of the refresh button: pulling fresh
    // values must not disturb the day you planned.
    const patch = buildImportedTaskPatch(external(), current);

    for (const field of LOCAL_ONLY_TASK_FIELDS) {
      expect(patch).not.toHaveProperty(field);
    }
  });

  it("writes exactly the declared imported fields", () => {
    const patch = buildImportedTaskPatch(external(), current);
    expect(Object.keys(patch).sort()).toEqual([...IMPORTED_TASK_FIELDS].sort());
  });

  it("overwrites the imported fields from the remote", () => {
    const patch = buildImportedTaskPatch(external(), current);

    expect(patch.title).toBe("Ship the thing");
    expect(patch.notes).toBe("Do the work");
    expect(patch.estimatedMins).toBe(60);
    expect(patch.priority).toBe("P1");
  });

  it("preserves local notes when the provider has no description", () => {
    expect(buildImportedTaskPatch(external({ description: null }), current).notes).toBe("My own notes");
    expect(buildImportedTaskPatch(external({ description: "  " }), current).notes).toBe("My own notes");
    expect(buildImportedTaskPatch(external({ description: null }), { ...current, notes: null }).notes).toBeNull();
  });

  it("keeps the local priority when the remote has none set", () => {
    const patch = buildImportedTaskPatch(external({ priority: null }), current);
    expect(patch.priority).toBe("P3");
  });

  it("truncates an over-long remote title to the column width", () => {
    const patch = buildImportedTaskPatch(
      external({ title: "x".repeat(600) }),
      current
    );
    expect(patch.title).toHaveLength(500);
  });

  it("preserves the original completion time instead of bumping it on each refresh", () => {
    const completedAt = new Date("2026-09-01T09:00:00Z");
    const patch = buildImportedTaskPatch(
      external({ isCompleted: true }),
      { priority: "P2", completedAt },
      new Date("2026-09-17T12:00:00Z")
    );

    expect(patch.completedAt).toBe(completedAt);
  });

  it("stamps a completion time when the task closed upstream", () => {
    const now = new Date("2026-09-17T12:00:00Z");
    const patch = buildImportedTaskPatch(
      external({ isCompleted: true }),
      current,
      now
    );

    expect(patch.completedAt).toBe(now);
  });

  it("reopens a task that was reopened upstream", () => {
    const patch = buildImportedTaskPatch(external({ isCompleted: false }), {
      priority: "P2",
      completedAt: new Date("2026-09-01T09:00:00Z"),
    });

    expect(patch.completedAt).toBeNull();
  });
});

describe("buildLinkMeta", () => {
  it("keeps the due date as a plain date string, for display only", () => {
    // It is deliberately never written to scheduledDate — an imported
    // task lands in the backlog and the user picks the day.
    const meta = buildLinkMeta(
      external({ dueDate: new Date("2026-09-20T23:00:00Z") })
    );

    expect(meta.dueDate).toBe("2026-09-20");
  });

  it("carries the container name for the card's source chip", () => {
    expect(buildLinkMeta(external()).containerName).toBe("Engineering");
  });

  it("nulls a missing due date rather than omitting it", () => {
    expect(buildLinkMeta(external()).dueDate).toBeNull();
  });
});
