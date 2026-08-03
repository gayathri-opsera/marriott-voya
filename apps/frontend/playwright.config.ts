import { defineConfig, devices } from "@playwright/test";

/**
 * Voya — Playwright E2E configuration.
 * Tests run against the locally started Next.js dev server (port 3200).
 * If PLAYWRIGHT_BASE_URL is set in the environment, it overrides localhost.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,        // sequential to avoid DB/service race conditions
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:3200",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Extra time for AI streaming responses
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start the Next.js dev server before running tests if not already running.
  // reuseExistingServer: always — the run-e2e.sh script starts the server first.
  webServer: {
    command: "node_modules/.bin/next dev -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
