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
  page.locator("div.flex-col.border-r").filter({ has: page.getByRole("button", { name: /^Today/ }) });

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
  await page.getByPlaceholder("Task title...").fill(title);
  await page.getByRole("button", { name: "Create", exact: true }).click();

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
  await expect(dialog.getByText("Draft the outline")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await card.getByRole("checkbox").first().click();
  await expect(page.getByText(/^Completed \(1\)/)).toBeVisible();

  const tasks = await api<Array<{ title: string; completedAt: string | null; id: string }>>(
    "GET",
    `/tasks?from=${today}&to=${today}`,
    undefined,
    session.token
  );
  const saved = tasks.find((t) => t.title === title);
  expect(saved?.completedAt, "task is completed in the database").toBeTruthy();
  const subtasks = await api<Array<{ title: string }>>("GET", `/tasks/${saved!.id}/subtasks`, undefined, session.token);
  expect(subtasks.map((s) => s.title)).toEqual(["Draft the outline"]);
});

test("shows a time block on the calendar", async ({ page }) => {
  const session = await register();
  await api("POST", "/time-blocks", { title: "Deep work", date: today, startTime: "09:00", endTime: "10:30" }, session.token);
  await signInWithToken(page, session);
  await page.goto(`/app/calendar?date=${today}`);
  await expect(page.getByRole("button", { name: /^Time block: Deep work from 9:00 AM to 10:30 AM/ })).toBeVisible();
});
