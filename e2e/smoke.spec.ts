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

test("shows and resizes a time block on the full calendar", async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${today}T09:00:00Z`));
  const session = await register();
  const block = await api<{id: string}>("POST", "/time-blocks", { title: "Deep work", date: today, startTime: "09:00", endTime: "10:30" }, session.token);
  await signInWithToken(page, session);
  await page.goto(`/app/calendar?date=${today}`);
  await expect(page.getByRole("button", { name: /^Time block: Deep work from 9:00 AM to 10:30 AM/ })).toBeVisible();
  await page.locator('[data-time-block]').filter({ hasText: 'Deep work' }).scrollIntoViewIfNeeded();
  const handle = (await page.locator('[data-time-block]').filter({ hasText: 'Deep work' }).locator('[data-resize="bottom"]').boundingBox())!;
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 32, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await api<{durationMins:number}>('GET', `/time-blocks/${block.id}`, undefined, session.token)).durationMins).toBe(120);
  await expect(page.getByRole('dialog')).toBeHidden();
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

test("completion cannot leave a task or subtask timer running after concurrent starts", async () => {
  const session = await register();
  for (const completion of ["task", "task-patch", "subtask"]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const task = await api<{id: string}>("POST", "/tasks", { title: "Concurrent completion" }, session.token);
      const subtask = await api<{id: string}>("POST", `/tasks/${task.id}/subtasks`, { title: "Subtask" }, session.token);
      const completePath = completion === "subtask" ? `/tasks/${task.id}/subtasks/${subtask.id}` : completion === "task-patch" ? `/tasks/${task.id}` : `/tasks/${task.id}/complete`;
      const body = completion === "subtask" ? { completed: true } : completion === "task-patch" ? { completedAt: new Date().toISOString() } : {};
      const [start, complete] = await Promise.all([
        fetch(`${API}/tasks/${task.id}/subtasks/${subtask.id}/timer/start`, { method: "POST", headers: { Authorization: `Bearer ${session.token}` } }),
        fetch(`${API}${completePath}`, { method: completion === "task" ? "POST" : "PATCH", headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      ]);
      expect([200, 400]).toContain(start.status);
      expect(complete.status).toBe(200);
      const current = await api<{completedAt: string | null; timerStartedAt: string | null}>("GET", `/tasks/${task.id}`, undefined, session.token);
      const subtasks = await api<Array<{completed: boolean; timerStartedAt: string | null}>>("GET", `/tasks/${task.id}/subtasks`, undefined, session.token);
      expect(subtasks[0]!.timerStartedAt).toBeNull();
      if (completion === "subtask") expect(subtasks[0]!.completed).toBe(true);
      else { expect(current.completedAt).toBeTruthy(); expect(current.timerStartedAt).toBeNull(); }
    }
  }
});

test("E edits planned time and W edits actual time consistently", async ({ page }) => {
  const session = await register();
  const task = await api<{id: string}>("POST", "/tasks", { title: "Shortcut consistency", scheduledDate: today, estimatedMins:30 }, session.token);
  await api("PATCH", `/tasks/${task.id}`, { actualMins: 5 }, session.token);
  await signInWithToken(page, session);
  await page.goto("/app");
  const card = todayColumn(page).locator(`[data-task-id="${task.id}"]`);
  await card.hover();
  await page.keyboard.press("e");
  await expect(page.getByRole("textbox", { name: "Planned", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await card.getByText("Shortcut consistency", { exact: true }).click();
  for (const view of ["modal", "focus", "list"]) {
    if (view === "focus") await page.getByRole("button", { name: "Open in focus mode" }).click();
    if (view === "list") {
      await page.goto("/app/tasks");
      await page.getByRole("button", { name: "Shortcut consistency", exact: true }).hover();
    } else await page.getByRole("button", { name: "Start timer", exact: true }).focus();
    await page.keyboard.press("e");
    const planned = page.getByRole("textbox", { name: "Planned", exact: true });
    await expect(planned).toBeVisible();
    await expect(planned).toHaveValue("0:30");
    await expect(page.getByRole("dialog").last().getByText("E", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    if (view === "list") continue;
    await page.getByRole("button", { name: "Start timer", exact: true }).focus();
    await page.keyboard.press("w");
    await expect(page.getByRole("textbox", { name: "Actual", exact: true })).toHaveValue("0:05");
    await expect(page.getByRole("dialog").last().getByText("W", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    if (view === "focus") await expect(page).toHaveURL(new RegExp(`/app/focus/${task.id}`));
  }
});


test("task list buttons activate with the keyboard without dragging", async ({ page }) => {
  const session = await register();
  await api("POST", "/tasks", { title: "Keyboard task", scheduledDate: today }, session.token);
  await signInWithToken(page, session);
  await page.goto("/app/tasks");
  await page.getByRole("button", { name: "Keyboard task", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "Open in focus mode" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit planned time", exact: true }).press("Space");
  await expect(page.getByRole("textbox", { name: "Planned", exact: true })).toBeVisible();
});

test("mobile new task immediately focuses its title", async ({ page }) => {
  const session = await register();
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithToken(page, session);
  await page.goto("/app");
  await page.getByRole("button", { name: "Add task A", exact: true }).click();
  const title = page.getByRole("textbox", { name: "Task title", exact: true });
  await expect(title).toBeFocused();
  await page.keyboard.type("Type immediately on mobile");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await expect(page.getByText("Type immediately on mobile", { exact: true })).toBeVisible();
});

test("mobile Ideas swipes over cards without an extra navigation row", async ({ browser }) => {
  const session = await register();
  const board = await api<{id: string}>("POST", "/ideas/boards", { name: "Mobile navigation" }, session.token);
  const columns = await api<Array<{id: string}>>("GET", `/ideas/columns?boardId=${board.id}`, undefined, session.token);
  for (const name of ["Exploring", "Ready", "Later"]) columns.push(await api<{id: string}>("POST", "/ideas/columns", { boardId: board.id, name }, session.token));
  const idea = await api<{id: string}>("POST", "/ideas", { boardId: board.id, columnId: columns[0]!.id, title: "Swipe across this card" }, session.token);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await signInWithToken(page, session);
    await page.goto("/app/ideas");
    await expect(page.getByRole("navigation", { name: "Ideas columns" })).toHaveCount(0);
    const first = page.locator(`[data-idea-column-id="${columns[0]!.id}"]`);
    await expect(first).toBeVisible();
    const initialX = (await first.boundingBox())!.x;
    const card = page.getByText("Swipe across this card", { exact: true });
    const box = (await card.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const x = box.x + box.width * 0.7, y = box.y + box.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - step * 19, y }] });
      // Give each touch move a frame, like a finger crossing the card.
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => (await first.boundingBox())!.x).toBeLessThan(initialX - 100);
    await expect(page.getByRole("dialog")).toBeHidden();
    const unchanged = await api<{columnId: string}>("GET", `/ideas/${idea.id}`, undefined, session.token);
    expect(unchanged.columnId).toBe(columns[0]!.id);
  } finally { await context.close(); }
});

test("view shortcuts and priority shortcuts work without changing typed text", async ({ page }) => {
  const session = await register();
  await signInWithToken(page, session);
  await page.goto("/app");
  await expect(page.getByRole("radio", { name: "Today", exact: true })).toBeVisible();
  await page.keyboard.press("Shift+T");
  await expect(page.getByRole("radio", { name: "Today", exact: true })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Shift+B");
  await expect(page.getByRole("radio", { name: "Board", exact: true, includeHidden: true })).toHaveAttribute("aria-checked", "true");
  await todayColumn(page).getByRole("button", { name: "Add task" }).click();
  const title = page.getByRole("textbox", { name: "Task title", exact: true });
  await title.fill("Priority keyboard test");
  await title.press("Alt+Shift+1");
  await expect(page.getByRole("button", { name: "Priority: P1 High", exact: true })).toBeVisible();
  await expect(title).toHaveValue("Priority keyboard test");
  await title.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await todayColumn(page).getByText("Priority keyboard test", { exact: true }).click();
  await title.press("Alt+Shift+0");
  await expect(page.getByRole("button", { name: "Priority: P0 Urgent", exact: true })).toBeVisible();
  await expect(title).toHaveValue("Priority keyboard test");
  await title.press("Shift+T");
  await expect(page.getByRole("radio", { name: "Board", exact: true, includeHidden: true })).toHaveAttribute("aria-checked", "true");
  await expect(title).toHaveValue(/T/);
  await title.fill("Priority keyboard test");
  await expect.poll(async () => {
    const tasks = await api<Array<{title: string; priority: string}>>("GET", `/tasks?scheduledDate=${today}`, undefined, session.token);
    return tasks.find(task => task.title === "Priority keyboard test")?.priority;
  }).toBe("P0");
  await title.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.reload();
  await todayColumn(page).getByText("Priority keyboard test", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Priority: P0 Urgent", exact: true })).toBeVisible();
});

test("calendar resizes a projected task into one saved block and resizes it again", async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${today}T09:00:00Z`));
  const session = await register();
  const task = await api<{id: string}>("POST", "/tasks", { title: "Resize the plan", scheduledDate: today, estimatedMins: 30 }, session.token);
  await signInWithToken(page, session);
  await page.goto("/app");
  const preview = page.locator(`[data-projected-task="${task.id}"]`);
  await preview.scrollIntoViewIfNeeded();
  const handle = await preview.locator('[data-resize="bottom"]').boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2 + 32, { steps: 8 });
  const created = page.waitForResponse(r => r.url().endsWith('/time-blocks') && r.request().method() === 'POST');
  await page.mouse.up();
  const block = (await (await created).json()).data;
  expect(block.taskId).toBe(task.id);
  expect(block.durationMins).toBe(60);
  const saved = page.locator('[data-time-block]').filter({ hasText: 'Resize the plan' });
  await expect(saved).toBeVisible();
  const bottom = await saved.locator('[data-resize="bottom"]').boundingBox();
  await page.mouse.move(bottom!.x + bottom!.width / 2, bottom!.y + bottom!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bottom!.x + bottom!.width / 2, bottom!.y + bottom!.height / 2 + 32, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await api<{durationMins:number}>('GET', `/time-blocks/${block.id}`, undefined, session.token)).durationMins).toBe(90);
  await expect(page.getByRole('dialog')).toBeHidden();
  const all = await api<Array<{id:string}>>('GET', `/time-blocks?date=${today}`, undefined, session.token);
  expect(all).toHaveLength(1);
});

test("editable calendar events resize from either edge in the sidebar", async ({ page }) => {
  const session = await register();
  let event = { id: "event-resize", calendarId: "calendar-resize", title: "Provider event", startTime: `${today}T14:00:00.000Z`, endTime: `${today}T15:00:00.000Z`, isAllDay: false, color: "#4285f4", responseStatus: "accepted" };
  const updates: unknown[] = [];
  await page.route(`${API}/calendar/accounts`, r => r.fulfill({ json: { success: true, data: [{ id: 'account-resize', provider: 'google', isActive: true }] } }));
  await page.route(`${API}/calendars`, r => r.fulfill({ json: { success: true, data: [{ id: 'account-resize', provider: 'google', calendars: [{ id: 'calendar-resize', name: 'Test calendar', isReadOnly: false, isVisible: true }] }] } }));
  await page.route(`${API}/calendar-events?**`, r => r.fulfill({ json: { success: true, data: [event] } }));
  await page.route(`${API}/calendar-events/event-resize`, async r => {
    const patch = r.request().postDataJSON();
    updates.push(patch);
    event = { ...event, ...patch };
    await r.fulfill({ json: { success: true, data: event } });
  });
  await signInWithToken(page, session);
  await page.goto('/app');
  const block = page.locator('[data-external-event]').filter({ hasText: 'Provider event' });
  for (const [edge, dy, expectedStart, expectedEnd] of [['bottom', 32, 14, 15.5], ['top', -32, 13.5, 15.5]] as const) {
    await block.scrollIntoViewIfNeeded();
    const handle = (await block.locator(`[data-resize="${edge}"]`).boundingBox())!;
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + dy, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => new Date(event.startTime).getUTCHours() + new Date(event.startTime).getUTCMinutes() / 60).toBe(expectedStart);
    await expect.poll(() => new Date(event.endTime).getUTCHours() + new Date(event.endTime).getUTCMinutes() / 60).toBe(expectedEnd);
  }
  expect(updates).toHaveLength(2);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test("question mark toggles shortcuts and sort stays compact", async ({ page }) => {
  const session = await register();
  await signInWithToken(page, session);
  await page.goto('/app');
  await expect(page.getByRole('button', {name:'Sort: Manual'})).toBeVisible();
  await page.keyboard.press('Shift+?');
  await expect(page.getByRole('heading', {name:'Keyboard Shortcuts'})).toBeVisible();
  await page.keyboard.press('Shift+?');
  await expect(page.getByRole('heading', {name:'Keyboard Shortcuts'})).toBeHidden();
  await page.getByRole('button', {name:'Sort: Manual'}).click();
  await page.getByRole('menuitem', {name:'Priority (P0 → P3)',exact:true}).click();
  const sort = page.getByRole('button', {name:'Sort: Priority (P0 → P3)',exact:true});
  await expect(sort).toBeVisible();
  expect((await sort.boundingBox())!.width).toBeLessThanOrEqual(32);
});

test("dropping a task schedules it directly without a blank create dialog", async ({ page }) => {
  const session = await register();
  const task = await api<{id:string}>('POST','/tasks',{title:'Drag this task',scheduledDate:today,estimatedMins:30},session.token);
  await signInWithToken(page, session);
  await page.goto('/app');
  const card = page.locator(`[data-task-id="${task.id}"]`).first();
  await expect(card).toBeVisible();
  const from = (await card.boundingBox())!;
  const grid = (await page.locator('[data-calendar-create-column]').boundingBox())!;
  await page.mouse.move(from.x+100,from.y+25);
  await page.mouse.down();
  await page.mouse.move(from.x+110,from.y+25,{steps:3});
  await page.mouse.move(grid.x+120,228,{steps:15});
  await page.mouse.up();
  await expect.poll(async()=> (await api<Array<{taskId:string}>>('GET',`/time-blocks?date=${today}`,undefined,session.token)).filter(b=>b.taskId===task.id).length).toBe(1);
  const minutes = Math.round(((228 - grid.y) / 64 * 60) / 15) * 15;
  const expectedTime = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const blocks = await api<Array<{taskId:string;startTime:string}>>('GET',`/time-blocks?date=${today}`,undefined,session.token);
  expect(blocks.find(b=>b.taskId===task.id)?.startTime).toBe(expectedTime);
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.locator('[data-time-block]').filter({hasText:'Drag this task'})).toBeVisible();
});

test("Ideas tray navigates columns and drags an idea into today's tasks", async ({ page }) => {
  const session = await register();
  const board = await api<{id:string}>('POST','/ideas/boards',{name:'Planner ideas'},session.token);
  const columns = await api<Array<{id:string}>>('GET',`/ideas/columns?boardId=${board.id}`,undefined,session.token);
  await api<{id:string}>('POST','/ideas/columns',{boardId:board.id,name:'Ready'},session.token);
  const idea = await api<{id:string}>('POST','/ideas',{boardId:board.id,columnId:columns[0]!.id,title:'Idea to plan',estimatedMins:25},session.token);
  await api('POST',`/ideas/${idea.id}/subtasks`,{title:'Keep this checklist'},session.token);
  await signInWithToken(page, session);
  await page.goto('/app');
  await page.getByRole('navigation',{name:'Right panel'}).getByRole('button',{name:'Ideas',exact:true}).click();
  const tray = page.getByRole('region',{name:'Ideas tray'});
  await expect(tray.getByText('Planner ideas',{exact:true})).toBeVisible();
  await tray.getByRole('tab',{name:/Ready.*0/}).click();
  await expect(tray.getByText('Ideas for ready go here.')).toBeVisible();
  await tray.getByRole('tab',{name:/Ready.*0/}).press('ArrowLeft');
  await expect(tray.getByRole('tab').first()).toHaveAttribute('aria-selected','true');
  const source = (await tray.getByText('Idea to plan',{exact:true}).boundingBox())!;
  const target = (await todayColumn(page).boundingBox())!;
  await page.mouse.move(source.x+45,source.y+8);
  await page.mouse.down();
  await page.mouse.move(source.x+55,source.y+8,{steps:3});
  await page.mouse.move(target.x+100,target.y+160,{steps:15});
  await page.mouse.up();
  await expect(todayColumn(page).getByText('Idea to plan',{exact:true})).toBeVisible();
  const tasks = await api<Array<{id:string;title:string;estimatedMins:number}>>('GET',`/tasks?date=${today}`,undefined,session.token);
  const task = tasks.find(t=>t.title==='Idea to plan')!;
  expect(task.estimatedMins).toBe(25);
  const subtasks = await api<Array<{title:string}>>('GET',`/tasks/${task.id}/subtasks`,undefined,session.token);
  expect(subtasks.map(s=>s.title)).toContain('Keep this checklist');
  await expect(tray.getByRole('link',{name:'Open task',exact:true})).toBeVisible();
  const card = (await tray.getByText('Idea to plan',{exact:true}).boundingBox())!;
  const tab = tray.getByRole('tab',{name:/Ready.*0/});
  const tabBox = (await tab.boundingBox())!;
  await page.mouse.move(card.x+30,card.y+8);
  await page.mouse.down();
  await page.mouse.move(card.x+45,card.y+8,{steps:3});
  await page.mouse.move(tabBox.x+tabBox.width/2,tabBox.y+tabBox.height/2,{steps:8});
  await expect(tab).toHaveAttribute('aria-selected','true');
  const drop = (await page.locator('[data-ideas-tray-drop]').boundingBox())!;
  await page.mouse.move(drop.x+100,drop.y+150,{steps:8});
  await page.mouse.up();
  await expect(tray.getByText('Idea to plan',{exact:true})).toBeVisible();
  await page.reload();
  await tray.getByRole('tab',{name:/Ready.*1/}).click();
  await expect(tray.getByText('Idea to plan',{exact:true})).toBeVisible();
});

test("task drops save one linked idea with its checklist and reject another user's task", async ({ page }) => {
  const session = await register();
  const other = await register();
  const board = await api<{id:string}>('POST','/ideas/boards',{name:'Linked ideas'},session.token);
  const columns = await api<Array<{id:string}>>('GET',`/ideas/columns?boardId=${board.id}`,undefined,session.token);
  const task = await api<{id:string}>('POST','/tasks',{title:'Keep the existing task',scheduledDate:today,estimatedMins:45},session.token);
  await api('POST',`/tasks/${task.id}/subtasks`,{title:'Preserve checklist'},session.token);
  await signInWithToken(page,session);
  await page.goto('/app');
  await page.getByRole('navigation',{name:'Right panel'}).getByRole('button',{name:'Ideas',exact:true}).click();
  await expect(page.getByRole('region',{name:'Ideas tray'})).toBeVisible();
  const from = (await page.locator(`[data-task-id="${task.id}"]`).first().boundingBox())!;
  const to = (await page.locator('[data-ideas-tray-drop]').boundingBox())!;
  await page.mouse.move(from.x+100,from.y+25);
  await page.mouse.down();
  await page.mouse.move(from.x+110,from.y+25,{steps:3});
  await page.mouse.move(to.x+100,to.y+100,{steps:15});
  await page.mouse.up();
  await expect(page.getByRole('region',{name:'Ideas tray'}).getByText('Keep the existing task',{exact:true})).toBeVisible();
  const payload = {taskId:task.id,boardId:board.id,columnId:columns[0]!.id};
  const results = await Promise.all([api<{id:string}>('POST','/ideas/from-task',payload,session.token),api<{id:string}>('POST','/ideas/from-task',payload,session.token)]);
  expect(results[0]!.id).toBe(results[1]!.id);
  const saved = await api<Array<{promotedTaskId:string}>>('GET',`/ideas?boardId=${board.id}`,undefined,session.token);
  expect(saved).toHaveLength(1);
  expect(saved[0]!.promotedTaskId).toBe(task.id);
  const checklist = await api<Array<{title:string}>>('GET',`/ideas/${results[0]!.id}/subtasks`,undefined,session.token);
  expect(checklist.map(i=>i.title)).toEqual(['Preserve checklist']);
  expect((await api<{scheduledDate:string}>('GET',`/tasks/${task.id}`,undefined,session.token)).scheduledDate).toBe(today);
  const foreignTask = await api<{id:string}>('POST','/tasks',{title:'Private task'},other.token);
  const denied = await fetch(`${API}/ideas/from-task`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify({...payload,taskId:foreignTask.id})});
  expect(denied.status).toBe(404);
});

test('Ideas surfaces stay neutral across accent colors and adapt to light and dark mode', async ({ page }) => {
  const session = await register();
  const board = await api<{id:string}>('POST','/ideas/boards',{name:'Theme validation'},session.token);
  await signInWithToken(page, session);
  const colors: string[] = [];
  for (const mode of ['Light', 'Dark']) {
    for (const theme of ['Ocean', 'Rose']) {
      await page.goto('/app/settings?tab=appearance');
      await page.getByRole('button',{name:mode,exact:true}).click();
      await page.getByRole('button',{name:theme,exact:true}).click();
      await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme.toLowerCase()}`));
      await page.goto(`/app/ideas?board=${board.id}`);
      const column = page.locator('[data-idea-column-id]').first();
      await expect(column).toBeVisible();
      const color = await column.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      colors.push(color);
      await page.goto('/app');
      const tray = page.locator('[data-ideas-tray-drop]');
      const toggle = page.getByRole('navigation',{name:'Right panel'}).getByRole('button',{name:'Ideas',exact:true});
      await expect(toggle).toBeVisible();
      if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
      await expect(tray).toBeVisible();
      await expect.poll(() => tray.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(color);
    }
  }
  expect(colors[0]).toBe(colors[1]);
  expect(colors[2]).toBe(colors[3]);
  expect(colors[0]).not.toBe(colors[2]);
});
