import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config — Renew PMS
 *
 * Runs against a live dev server (localhost:3200).
 * Tests use staging Supabase credentials from .env.local.
 *
 * Usage:
 *   npx playwright test                   # Run all E2E tests
 *   npx playwright test --headed          # Watch in browser
 *   npx playwright test tests/e2e/auth    # Run auth tests only
 */

const PORT = process.env.CI ? 3000 : 3200;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          port: PORT,
          reuseExistingServer: true,
          timeout: 30_000,
        },
      }),
});
