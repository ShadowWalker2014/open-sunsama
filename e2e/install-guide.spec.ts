import { expect, test, devices, type Page } from "@playwright/test";

// The "Add to Home Screen" guide on a phone browser. It opens after a quiet
// moment, and only closing it snoozes it; a showing nobody saw doesn't count.
const API = `http://localhost:${process.env.API_PORT ?? 3201}`;
const STORAGE_KEY = "open-sunsama-install-tip-v2";

test.use({ ...devices["iPhone 13"], browserName: "chromium" });
test.setTimeout(90_000);

async function signIn(page: Page) {
  const email = `install-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-e2e@example.com`;
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "E2e-Passw0rd", name: "Install tester" }),
  });
  const { data } = await res.json();
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem("open_sunsama_token", token);
    localStorage.setItem("open_sunsama_user", JSON.stringify(user));
  }, data);
}

const snooze = (page: Page) => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
const guide = (page: Page) => page.getByRole("dialog").filter({ hasText: "Not now" });

test("opens after a pause, and snoozes only when closed", async ({ page }) => {
  await signIn(page);
  await page.goto("/app");
  await expect(guide(page)).toBeVisible({ timeout: 30_000 });
  expect(await snooze(page)).toBeNull();

  // Reloading with the guide open offers it again.
  await page.reload();
  await expect(guide(page)).toBeVisible({ timeout: 30_000 });

  await guide(page).getByRole("button", { name: "Not now" }).first().click();
  await expect(guide(page)).toBeHidden();
  expect(JSON.parse((await snooze(page)) ?? "{}")).toMatchObject({ dismissals: 1 });

  await page.reload();
  await page.waitForTimeout(16_000);
  await expect(guide(page)).toBeHidden();
});

test("waits while the tab is hidden", async ({ page }) => {
  await signIn(page);
  await page.addInitScript(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "hidden" });
  });
  await page.goto("/app");
  await page.waitForTimeout(16_000);
  await expect(guide(page)).toBeHidden();
  expect(await snooze(page)).toBeNull();
});
