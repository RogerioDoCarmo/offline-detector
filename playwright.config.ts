import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright base for web E2E, adapted from the website repo's skeleton.
 *
 * Projects: Chromium, Firefox, WebKit, Pixel 5 (mobile-chrome) and iPhone 12 (mobile-safari).
 * Pull requests run chromium only; `main`/`develop` pushes and the nightly run use all five (see
 * .github/workflows/e2e.yml).
 *
 * `PLAYWRIGHT_BASE_URL` points the suite at an already-running app and skips the built-in server.
 */

const isCI = !!process.env.CI;
const port = Number(process.env.PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,

  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 4 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(isCI ? [['github'] as ['github']] : []),
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 10_000,
    actionTimeout: 8_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],

  // A plain node script, so nothing is downloaded when the tests start. It also serves the static
  // export of apps/demo-web under /offline-detector/demo/ and builds that export first when it is
  // missing (the long timeout covers a cold build of the packages and the demo).
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'node e2e/fixtures/serve.mjs',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 300_000,
        env: { PORT: String(port) },
      },
});
