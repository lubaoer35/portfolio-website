import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5180",
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath, args: ["--no-sandbox"] },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5180 --strictPort",
      url: "http://127.0.0.1:5180",
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        "node node_modules/vite/bin/vite.js --mode editor --host 127.0.0.1 --port 5181 --strictPort",
      url: "http://127.0.0.1:5181",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node tests/fixtures/cms-server.mjs",
      url: "http://127.0.0.1:5182/api/health",
      reuseExistingServer: false,
    },
  ],
});
