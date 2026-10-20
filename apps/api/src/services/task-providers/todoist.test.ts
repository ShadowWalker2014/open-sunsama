import { afterEach, describe, expect, it, vi } from "vitest";
import { TodoistProvider } from "./todoist";
import { ProviderCredentialError, ProviderTaskNotFoundError } from "./index";

const id = "6cF5Q2gH9P3V8d7R";
const credentials = { token: "sample-token-12345" };

afterEach(() => vi.unstubAllGlobals());

describe("Todoist API v1 adapter", () => {
  it("verifies a personal token with a bearer-authenticated user request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "1234567890", email: "user@example.com", full_name: "Sample User",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await new TodoistProvider().verifyCredentials(credentials)).toMatchObject({
      providerAccountId: "1234567890", label: "Sample User", credentials,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://api.todoist.com/api/v1/user", {
      headers: { Authorization: `Bearer ${credentials.token}` },
    });
  });

  it("fetches a task and project using the parsed ID from a slugged URL", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id, project_id: "1234567890", section_id: null, content: "Ship the thing", description: "Remote notes",
        priority: 3, checked: false, completed_at: null,
        updated_at: "2026-09-01T10:00:00Z", due: null, duration: null,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1234567890", name: "Engineering" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new TodoistProvider();
    const parsed = provider.parseReference(`https://app.todoist.com/app/task/ship-the-thing-${id}`);

    expect(parsed).toBe(id);
    expect(await provider.fetchTask(credentials, parsed!)).toMatchObject({
      externalId: id, title: "Ship the thing", priority: "P1", containerName: "Engineering",
    });
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `https://api.todoist.com/api/v1/tasks/${id}`,
      "https://api.todoist.com/api/v1/projects/1234567890",
    ]);
  });

  it("lists open tasks for the source picker", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/projects?")) {
        return Promise.resolve(new Response(JSON.stringify({ results: [{
          id: "1234567890", name: "Engineering",
        }], next_cursor: null }), { status: 200 }));
      }
      if (url.includes("/sections?")) {
        return Promise.resolve(new Response(JSON.stringify({ results: [{
          id: "9876543210", project_id: "1234567890", name: "Current sprint",
        }], next_cursor: null }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ results: [{
        id, project_id: "1234567890", section_id: "9876543210", content: "Pick me", description: "",
        priority: 1, checked: false, completed_at: null,
        updated_at: "2026-09-01T10:00:00Z", due: null, duration: null,
      }], next_cursor: null }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(new TodoistProvider().listTasks(credentials)).resolves.toMatchObject([{
      externalId: id, title: "Pick me", statusName: "open",
      projectName: "Engineering", sectionName: "Current sprint",
      containerName: "Engineering / Current sprint",
    }]);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://api.todoist.com/api/v1/tasks?limit=200",
      "https://api.todoist.com/api/v1/projects?limit=200",
      "https://api.todoist.com/api/v1/sections?limit=200",
    ]);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
      headers: { Authorization: `Bearer ${credentials.token}` },
    });
  });

  it("maps rejected tokens and unavailable tasks to provider errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));
    await expect(new TodoistProvider().verifyCredentials(credentials)).rejects.toBeInstanceOf(ProviderCredentialError);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Missing", { status: 404 })));
    await expect(new TodoistProvider().fetchTask(credentials, id)).rejects.toBeInstanceOf(ProviderTaskNotFoundError);
  });
});
