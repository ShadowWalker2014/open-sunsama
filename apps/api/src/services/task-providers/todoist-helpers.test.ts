import { describe, expect, it } from "vitest";
import { normalizeTask, parseTodoistReference, type TodoistTask } from "./todoist-helpers";

const id = "6cF5Q2gH9P3V8d7R";

function rawTask(overrides: Partial<TodoistTask> = {}): TodoistTask {
  return {
    id,
    project_id: "1234567890",
    content: "Ship the thing",
    description: "Do the work",
    priority: 4,
    checked: false,
    completed_at: null,
    updated_at: "2026-09-01T10:00:00Z",
    due: null,
    duration: null,
    ...overrides,
  };
}

describe("Todoist task mapping", () => {
  it("maps remote priority, duration, due date, and project without scheduling locally", () => {
    const task = normalizeTask(rawTask({
      due: { date: "2026-09-02" }, duration: { amount: 30, unit: "minute" },
    }), { id: "1234567890", name: "Engineering" });
    expect(task).toMatchObject({ externalId: id, priority: "P0", estimatedMins: 30,
      isCompleted: false, containerName: "Engineering", subtasks: [] });
    expect(task.dueDate).toBeInstanceOf(Date);
    expect(task.url).toBe(`https://app.todoist.com/app/task/${id}`);
  });

  it("handles completed tasks and unsupported day durations", () => {
    const task = normalizeTask(rawTask({ checked: true, priority: 1,
      duration: { amount: 1, unit: "day" } }), null);
    expect(task.isCompleted).toBe(true);
    expect(task.priority).toBe("P3");
    expect(task.estimatedMins).toBeNull();
  });
});

describe("Todoist task references", () => {
  it("extracts the ID from both plain and slugged task URLs", () => {
    expect(parseTodoistReference(`https://app.todoist.com/app/task/${id}`)).toBe(id);
    expect(parseTodoistReference(`https://app.todoist.com/app/task/buy-milk-${id}?foo=1#details`)).toBe(id);
    expect(parseTodoistReference("https://app.todoist.com/app/task/buy-milk-1234567890")).toBe("1234567890");
  });

  it("accepts server IDs, but not arbitrary words", () => {
    expect(parseTodoistReference(`  ${id}\n`)).toBe(id);
    expect(parseTodoistReference("1234567890")).toBe("1234567890");
    expect(parseTodoistReference("weekend")).toBeNull();
    expect(parseTodoistReference("buy-milk")).toBeNull();
  });

  it("rejects unrelated hosts and malformed task URLs", () => {
    expect(parseTodoistReference(`https://example.com/app/task/${id}`)).toBeNull();
    expect(parseTodoistReference(`https://app.todoist.com/app/project/${id}`)).toBeNull();
    expect(parseTodoistReference(`https://app.todoist.com/app/task/${id}/extra`)).toBeNull();
  });
});
