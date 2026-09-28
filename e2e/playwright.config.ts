import { defineConfig } from "@playwright/test";

// Runs against the stack started by e2e/start-stack.sh.
export default defineConfig({
  testDir: ".",
  outputDir: "./test-results",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "./playwright-report" }]] : "list",
  use: {
    baseURL: `http://localhost:${process.env.WEB_PORT ?? 3207}`,
    viewport: { width: 1440, height: 900 },
    timezoneId: "UTC",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
