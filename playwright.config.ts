import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Clinique Lumière e2e tests.
 *
 * Assumes the app is already running: frontend on :4200, API on :5050
 * (see qa/README.md). Tests drive the UI and, where an acceptance criterion
 * is about the API contract, call :5050 directly.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
