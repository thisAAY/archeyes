import { defineConfig, devices } from "@playwright/test";

// E2E manages the archeyes CLI process itself (spawns `review`, reads the session
// port/token), so there's no webServer block here. Run: npm run test:e2e
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    viewport: { width: 1400, height: 900 },
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
