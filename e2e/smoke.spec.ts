import { expect, test, type Page } from "@playwright/test";

// Smoke tests for the flows every user depends on. Each test registers its own
// account through the API, so tests never share state.
const API = `http://localhost:${process.env.API_PORT ?? 3201}`;
const PASSWORD = "E2e-Passw0rd";
const today = new Date().toISOString().slice(0, 10); // the browser runs in UTC

type Session = { token: string; user: unknown };

async function api<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data as T;
}

async function register(): Promise<Session & { email: string }> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const session = await api<Session>("POST", "/auth/register", { email, password: PASSWORD, name: "E2E User" });
  return { ...session, email };
}

async function signInWithToken(page: Page, session: Session) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("open_sunsama_token", token);
    localStorage.setItem("open_sunsama_user", JSON.stringify(user));
  }, session);
}

// Fail any test whose page throws an uncaught error.
let uncaught: string[] = [];
test.beforeEach(async ({ page }) => {
  uncaught = [];
  page.on("pageerror", (err) => uncaught.push(err.message));
});
test.afterEach(() => {
  expect(uncaught, "uncaught errors in the page").toEqual([]);
});

const todayColumn = (page: Page) =>
  page.locator(`[data-board-day="${today}"]`);

test("signs in with email and password", async ({ page }) => {
  const { email } = await register();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(todayColumn(page)).toBeVisible();
});

test("creates a task, adds a subtask and completes it", async ({ page }) => {
  const session = await register();
  await signInWithToken(page, session);
  await page.goto("/app");

  const title = `Write the launch notes ${Date.now()}`;
  await todayColumn(page).getByRole("button", { name: "Add task" }).click();
  const composer = page.getByRole("dialog", { name: "Add task" });
  await composer.getByRole("textbox", { name: "Task title" }).fill(title);
  // Tab starts a subtask line; Enter on the empty line after it adds the task.
  await page.keyboard.press("Tab");
  await composer.getByRole("textbox", { name: "Subtask 1" }).fill("Collect feedback");
  // The card shows before the save lands; wait for the subtask save, which
  // runs after the task's, so the reload below proves both were stored.
  const subtaskSaved = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/subtasks$/.test(r.url())
  );
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(composer).toBeHidden();
  expect((await subtaskSaved).ok()).toBe(true);

  const card = page.locator("[data-task-id]").filter({ hasText: title });
  await expect(card).toBeVisible();

  // The task was saved, not just drawn: it survives a reload.
  await page.reload();
  await expect(card).toBeVisible();

  await card.click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  const subtaskInput = dialog.getByRole("textbox", { name: "Add a subtask" });
  await subtaskInput.fill("Draft the outline");
  await subtaskInput.press("Enter");
  await expect(dialog.getByText("Collect feedback")).toBeVisible();
  await expect(dialog.getByText("Draft the outline")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // The card is ticked at once; wait for the save before reading it back.
  const completed = page.waitForResponse((r) => /\/complete$/.test(r.url()));
  await card.getByRole("checkbox", { name: "Complete task" }).click();
  await expect(page.getByText(/^Completed \(1\)/)).toBeVisible();
  expect((await completed).ok()).toBe(true);

  const tasks = await api<Array<{ title: string; completedAt: string | null; id: string }>>(
    "GET",
    `/tasks?from=${today}&to=${today}`,
    undefined,
    session.token
  );
  const saved = tasks.find((t) => t.title === title);
  expect(saved?.completedAt, "task is completed in the database").toBeTruthy();
  const subtasks = await api<Array<{ title: string }>>("GET", `/tasks/${saved!.id}/subtasks`, undefined, session.token);
  expect(subtasks.map((s) => s.title)).toEqual(["Collect feedback", "Draft the outline"]);
});

test("shows a time block on the calendar", async ({ page }) => {
  const session = await register();
  await api("POST", "/time-blocks", { title: "Deep work", date: today, startTime: "09:00", endTime: "10:30" }, session.token);
  await signInWithToken(page, session);
  await page.goto(`/app/calendar?date=${today}`);
  await expect(page.getByRole("button", { name: /^Time block: Deep work from 9:00 AM to 10:30 AM/ })).toBeVisible();
});

test("a subtask timer also times its task", async ({ page }) => {
  const session = await register();
  const task = await api<{ id: string }>("POST", "/tasks", { title: "Ship the release", scheduledDate: today }, session.token);
  const subtask = await api<{ id: string }>("POST", `/tasks/${task.id}/subtasks`, { title: "Write the changelog" }, session.token);
  await signInWithToken(page, session);
  await page.goto(`/app/focus/${task.id}`);

  const row = page.locator(`[data-subtask-id="${subtask.id}"]`);
  await row.hover();
  const started = page.waitForResponse((r) => /\/timer\/start$/.test(r.url()));
  await row.getByRole("button", { name: "Start subtask timer" }).click();
  expect((await started).ok()).toBe(true);
  await expect(row.getByRole("button", { name: "Stop subtask timer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop timer" })).toBeVisible();

  const stopped = page.waitForResponse((r) => /\/timer\/stop$/.test(r.url()));
  await row.getByRole("button", { name: "Stop subtask timer" }).click();
  await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
  expect((await stopped).ok()).toBe(true);

  const saved = await api<{ timerStartedAt: string | null }>("GET", `/tasks/${task.id}`, undefined, session.token);
  expect(saved.timerStartedAt, "stopping the subtask stops the task").toBeNull();
  const subtasks = await api<Array<{ timerStartedAt: string | null; timerAccumulatedSeconds: number }>>(
    "GET",
    `/tasks/${task.id}/subtasks`,
    undefined,
    session.token
  );
  expect(subtasks[0]?.timerStartedAt).toBeNull();
});

test("an idea with subtasks becomes a task for today", async ({ page }) => {
  const session = await register();
  await api("POST", "/ideas/boards", { name: "Startup ideas" }, session.token);
  await signInWithToken(page, session);
  await page.goto("/app/ideas");

  await page.getByRole("button", { name: "Add idea" }).first().click();
  const composer = page.getByRole("dialog", { name: /Add idea/ });
  await composer.getByRole("textbox", { name: "Task title" }).fill("AI meal planner");
  await page.keyboard.press("Tab");
  await composer.getByRole("textbox", { name: "Subtask 1" }).fill("Interview parents");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(composer).toBeHidden();
  await expect(page.getByText("Interview parents")).toBeVisible();

  await page.getByText("AI meal planner").click({ button: "right" });
  const promoted = page.waitForResponse((r) => /\/promote$/.test(r.url()));
  await page.getByRole("menuitem", { name: "Add to Today" }).click();
  expect((await promoted).ok()).toBe(true);

  const tasks = await api<Array<{ id: string; title: string }>>(
    "GET",
    `/tasks?date=${today}`,
    undefined,
    session.token
  );
  const task = tasks.find((t) => t.title === "AI meal planner");
  expect(task, "the idea is on today's list").toBeTruthy();
  const subtasks = await api<Array<{ title: string }>>("GET", `/tasks/${task!.id}/subtasks`, undefined, session.token);
  expect(subtasks.map((s) => s.title)).toEqual(["Interview parents"]);
});

test("moves a task's time block with it to another day, and clears it for the backlog", async () => {
  const session = await register();
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const task = await api<{ id: string }>("POST", "/tasks", { title: "Plan the week", scheduledDate: today }, session.token);
  await api("POST", "/time-blocks", { taskId: task.id, title: "Plan the week", date: today, startTime: "09:00", endTime: "10:00" }, session.token);

  await api("PATCH", `/tasks/${task.id}`, { scheduledDate: tomorrow }, session.token);
  type Block = { taskId: string | null; date: string; startTime: string };
  const onTomorrow = await api<Block[]>("GET", `/time-blocks?date=${tomorrow}`, undefined, session.token);
  expect(onTomorrow.map((b) => [b.taskId, b.date])).toEqual([[task.id, tomorrow]]);
  expect(await api<Block[]>("GET", `/time-blocks?date=${today}`, undefined, session.token)).toEqual([]);

  await api("POST", "/tasks/reorder", { date: "backlog", taskIds: [task.id] }, session.token);
  expect(await api<Block[]>("GET", `/time-blocks?date=${tomorrow}`, undefined, session.token)).toEqual([]);
});


test("task list searches every page and expands checklists", async ({ page }) => {
  const session = await register();
  for (let batch = 0; batch < 11; batch++) {
    await Promise.all(Array.from({ length: 10 }, (_, n) => api("POST", "/tasks", { title: `List item ${batch * 10 + n}`, scheduledDate: today }, session.token)));
  }
  const task = await api<{ id: string }>("POST", "/tasks", { title: "Needle beyond first page", scheduledDate: today, position: 999 }, session.token);
  await api("POST", `/tasks/${task.id}/subtasks`, { title: "Visible checklist item" }, session.token);
  await signInWithToken(page, session);
  await page.goto("/app/tasks");
  await expect(page.getByRole("button", { name: "Load more tasks" })).toBeVisible();
  await page.getByRole("button", { name: "Load more tasks" }).click();
  await expect(page.getByRole("button", { name: "Needle beyond first page", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search all tasks" }).fill("Needle beyond");
  const row = page.locator(`[data-task-id="${task.id}"]`);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Expand subtasks" }).click();
  await expect(row.getByText("Visible checklist item", { exact: true })).toBeVisible();
});

test("concurrent timer starts keep one timer and stale stops do not stop another subtask", async () => {
  const session = await register();
  const first = await api<{ id: string }>("POST", "/tasks", { title: "First timer", scheduledDate: today }, session.token);
  const second = await api<{ id: string }>("POST", "/tasks", { title: "Second timer", scheduledDate: today }, session.token);
  await Promise.all([first, second].map((t) => api("POST", `/tasks/${t.id}/timer/start`, {}, session.token)));
  const saved = await api<Array<{ timerStartedAt: string | null }>>("GET", `/tasks?date=${today}`, undefined, session.token);
  expect(saved.filter((t) => t.timerStartedAt)).toHaveLength(1);
  const a = await api<{ id: string }>("POST", `/tasks/${first.id}/subtasks`, { title: "A" }, session.token);
  const b = await api<{ id: string }>("POST", `/tasks/${first.id}/subtasks`, { title: "B" }, session.token);
  await api("POST", `/tasks/${first.id}/subtasks/${a.id}/timer/start`, {}, session.token);
  await api("POST", `/tasks/${first.id}/subtasks/${b.id}/timer/start`, {}, session.token);
  await api("POST", `/tasks/${first.id}/subtasks/${a.id}/timer/stop`, {}, session.token);
  const rows = await api<Array<{ id: string; timerStartedAt: string | null }>>("GET", `/tasks/${first.id}/subtasks`, undefined, session.token);
  expect(rows.find((s) => s.id === b.id)?.timerStartedAt).toBeTruthy();
  await api("POST", `/tasks/${first.id}/timer/stop`, {}, session.token);
});

test("mobile board fits above compact navigation", async ({ page }) => {
  const session = await register();
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithToken(page, session);
  await page.goto("/app");
  const nav = page.locator("nav").filter({ has: page.getByRole("link", { name: "More", exact: true }) });
  await expect(nav).toBeVisible();
  const box = await nav.boundingBox();
  expect(box!.height).toBe(56);
  expect(box!.y + box!.height).toBe(844);
  const main = await page.locator("main").boundingBox();
  expect(main!.y + main!.height).toBeLessThanOrEqual(844);
  await page.getByRole("link", { name: "Ideas", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create your first board" })).toBeVisible();
});


test("Today keeps its sidebar beside the calendar and sweeps an hour", async ({ page }) => {
  const session = await register();
  await signInWithToken(page, session);
  await page.goto("/app");
  const column = page.locator("[data-calendar-create-column]");
  await expect(column).toBeVisible();
  const calendar = await column.boundingBox();
  const rail = await page.getByRole("navigation", { name: "Right panel" }).boundingBox();
  expect(Math.abs(rail!.x - (calendar!.x + calendar!.width))).toBeLessThan(4);
  const y = Math.max(calendar!.y, 160) + 80;
  await page.mouse.move(calendar!.x + 80, y);
  await page.mouse.down();
  await page.mouse.move(calendar!.x + 80, y + 64, { steps: 8 });
  await page.mouse.up();
  const dialog = page.getByRole("dialog", { name: "Create", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Sweep review");
  const saved = page.waitForResponse((r) => r.url().endsWith("/time-blocks") && r.request().method() === "POST");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  const block = (await (await saved).json()).data;
  expect(block.durationMins).toBe(60);
});

test("mobile subtask titles keep readable width alongside timer controls", async ({ page }) => {
  const session = await register();
  const task = await api<{id: string}>("POST", "/tasks", { title: "Mobile layout", scheduledDate: today }, session.token);
  const subtask = await api<{id: string}>("POST", `/tasks/${task.id}/subtasks`, { title: "Check the launch checklist" }, session.token);
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithToken(page, session);
  await page.goto("/app");
  await page.getByText("Mobile layout", { exact: true }).click();
  const row = page.locator(`[data-subtask-id="${subtask.id}"]`);
  await expect(row).toBeVisible();
  const title = await row.getByText("Check the launch checklist", { exact: true }).boundingBox();
  expect(title!.width).toBeGreaterThan(230);
  expect(title!.height).toBeLessThan(50);
  await expect(row.getByRole("button", { name: "Start subtask timer" })).toBeVisible();
});
