import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// Each worker gets its own client IP, so rate-limit buckets (e.g. the guest-link brute-force
// lockout) don't accumulate across tests and reruns. The app reads x-forwarded-for, as on Vercel.
const workerIp = `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 250) + 1).join(".")}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry", extraHTTPHeaders: { "x-forwarded-for": workerIp } },
  timeout: 60_000,
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
