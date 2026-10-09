import type { Page } from '@playwright/test';
import {
  banner,
  fullScreen,
  indicator,
  openDemo,
  settle,
  simulateOffline,
  simulateOnline,
  snackbar,
  swipe,
} from './demo-web-helpers';
import { expect, test } from './fixtures/test';

/**
 * The STATIC EXPORT of apps/demo-web (apps/demo-web/out) served under /offline-detector/demo/ by
 * e2e/fixtures/serve.mjs. Simulate Offline drives a stub probe, so nothing here needs the
 * network; the real-offline test uses the shared goOffline()/goOnline() fixtures.
 * Strings are the literals of docs/design/strings.md.
 */

const pieces = (page: Page) => page.locator('.od-snackbar, .od-banner, .od-indicator');

const chooseLocale = (page: Page, locale: string) =>
  page.getByLabel('locale', { exact: true }).selectOption(locale);

test.describe('demo-web, online', () => {
  test('launches online and shows nothing', async ({ page }) => {
    await openDemo(page);

    await expect(page).toHaveURL(/\/offline-detector\/demo\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'offline-detector web demo',
    );
    await expect(snackbar(page)).toHaveCount(0);
    await expect(banner(page)).toHaveCount(0);
    await expect(indicator(page)).toHaveCount(0);
    await expect(page.getByTestId('status')).toHaveText('online');
  });

  test('serves the page with no failed requests under the base path', async ({
    page,
  }) => {
    const failed: string[] = [];
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });
    await openDemo(page);
    expect(failed).toEqual([]);
  });
});

test.describe('demo-web, simulated offline', () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
  });

  test('Simulate offline shows the snackbar, banner and indicator with No internet', async ({
    page,
  }) => {
    await simulateOffline(page);

    await expect(snackbar(page)).toContainText('No internet');
    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(page.getByRole('region', { name: 'No internet' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Connection status: No internet' }),
    ).toBeVisible();
    await expect(page.getByTestId('status')).toHaveText('offline');
    await expect(page.getByTestId('reason')).toHaveText('no-internet');
    await expect(page.getByRole('button', { name: 'Simulate online' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('Simulate online announces Back online, then clears itself', async ({ page }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();

    await simulateOnline(page);

    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await expect(banner(page)).toHaveCount(0);
    await expect(snackbar(page)).toHaveCount(0, { timeout: 8000 });
  });

  test('the callbacks write to the log', async ({ page }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();

    const log = page.getByRole('log', { name: 'Callback log' });
    await expect(log).toContainText('onOffline (no-internet)');
    await expect(log).toContainText('onChange: online to offline');
  });

  test('switching the locale to pt-BR shows the Portuguese strings', async ({ page }) => {
    await simulateOffline(page);
    await chooseLocale(page, 'pt-BR');

    await expect(snackbar(page)).toContainText('Sem internet');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Status da conexão: Sem internet' }),
    ).toBeVisible();

    await simulateOnline(page);
    await expect(page.getByRole('status')).toHaveText(/Conexão restabelecida/);
  });

  test('switching the locale to es shows the Spanish strings', async ({ page }) => {
    await simulateOffline(page);
    await chooseLocale(page, 'es');

    await expect(snackbar(page)).toContainText('Sin internet');
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Estado de la conexión: Sin internet' }),
    ).toBeVisible();

    await simulateOnline(page);
    await expect(page.getByRole('status')).toHaveText(/Conexión restablecida/);
  });

  test('distinguishReason tells the two kinds of offline apart', async ({ page }) => {
    await page.getByLabel('distinguishReason', { exact: true }).check();

    await simulateOffline(page);
    await expect(snackbar(page)).toContainText('Connected, but no internet');

    await page.getByRole('radio', { name: 'No network connection' }).check();
    await expect(snackbar(page)).toContainText('No network connection');
    await expect(page.getByTestId('reason')).toHaveText('no-interface');
  });

  test('swiping the snackbar away dismisses it; every piece returns on the next transition', async ({
    page,
  }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();

    await swipe(page, snackbar(page), 0.5);

    await expect(snackbar(page)).toHaveCount(0);
    await expect(banner(page)).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/No internet/);
    await expect(page.getByRole('log', { name: 'Callback log' })).toContainText(
      'onDismiss: snackbar',
    );

    await simulateOnline(page);
    await expect(snackbar(page)).toContainText('Back online');
    await expect(indicator(page)).toBeVisible();

    await simulateOffline(page);
    await expect(snackbar(page)).toContainText('No internet');
    await expect(banner(page)).toBeVisible();
  });

  test('dismissible off removes the Dismiss buttons', async ({ page }) => {
    await page.getByLabel('dismissible (global)', { exact: true }).uncheck();
    await simulateOffline(page);

    await expect(snackbar(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);
  });

  test('Retry probes again: the stub still fails, so the app stays offline', async ({
    page,
  }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();
    const log = page.getByRole('log', { name: 'Callback log' });
    await expect(log).toContainText('stub probe failed');
    const failures = () => log.getByText(/stub probe failed/).count();
    const before = await failures();

    await snackbar(page).getByRole('button', { name: 'Retry' }).click();

    await expect.poll(failures).toBeGreaterThan(before);
    await expect(snackbar(page)).toContainText('No internet');
  });

  test('the Retry label can be overridden through strings', async ({ page }) => {
    await page.getByLabel('strings.retry (override)').fill('Try once more');
    await simulateOffline(page);

    await expect(
      page.getByRole('button', { name: 'Try once more' }).first(),
    ).toBeVisible();
  });

  test('fullScreen opt-in replaces the other pieces; Continue offline closes it', async ({
    page,
  }) => {
    await page.getByRole('radio', { name: 'On, with Continue offline' }).check();
    await simulateOffline(page);

    await expect(fullScreen(page)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No internet', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText('Check your connection and try again.')).toBeVisible();
    await expect(snackbar(page)).toHaveCount(0);
    await expect(banner(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Continue offline' }).click();
    await expect(fullScreen(page)).toHaveCount(0);
    await expect(banner(page)).toBeVisible();
  });

  test('without the fullScreen option the full-screen state never appears', async ({
    page,
  }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();
    await expect(fullScreen(page)).toHaveCount(0);
  });

  test('the slot example replaces the bundled snackbar', async ({ page }) => {
    await page.getByLabel('Custom snackbar (slots.snackbar)').check();
    await simulateOffline(page);

    const toast = page.locator('.demo-toast');
    await expect(toast).toContainText('No internet');
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(snackbar(page)).toHaveCount(0);

    await toast.getByRole('button', { name: 'Close' }).click();
    await expect(toast).toHaveCount(0);
  });

  test('a forced dark scheme wraps the detector in data-od-theme and themes the page', async ({
    page,
  }) => {
    await page.getByLabel('colorScheme', { exact: true }).selectOption('dark');

    await expect(page.locator('[data-od-theme="dark"]')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('changing the probe settings restarts the detector online', async ({ page }) => {
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();

    await page.getByLabel('probe.intervalMs').fill('60000');

    await expect(snackbar(page)).toHaveCount(0);
    await expect(page.getByTestId('status')).toHaveText('online');
    await expect(page.getByRole('button', { name: 'Simulate offline' })).toBeVisible();
  });
});

test.describe('demo-web, useRecheckOnReturn screen', () => {
  test.beforeEach(async ({ page }) => {
    await openDemo(page);
    await page.getByLabel('Stub probe latency (ms)').fill('1200');
    await page.getByLabel('Mount the screen that uses the hook').check();
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();
  });

  test('with brief, returning to the tab shows Checking while the probe runs', async ({
    page,
  }) => {
    await page.getByLabel('checkingFeedback').selectOption('brief');
    await page.getByRole('button', { name: 'Simulate returning to the tab' }).click();

    await expect(snackbar(page).getByText('Checking…')).toBeVisible();
    await expect(page.getByRole('log', { name: 'Callback log' })).toContainText(
      'useRecheckOnReturn result: offline',
    );
    await expect(snackbar(page).getByText('Checking…')).toHaveCount(0);
  });

  test('with none, the same background probe stays invisible', async ({ page }) => {
    await page.getByLabel('checkingFeedback').selectOption('none');
    await page.getByRole('button', { name: 'Simulate returning to the tab' }).click();

    // Well past the 150 ms delay after which "brief" would have shown it, still inside the probe.
    await page.waitForTimeout(700);
    await expect(pieces(page).getByText(/Checking/)).toHaveCount(0);
    await expect(page.getByRole('log', { name: 'Callback log' })).toContainText(
      'useRecheckOnReturn result: offline',
    );
  });
});

test.describe('demo-web, real offline', () => {
  test('the browser going offline (DevTools) shows the pieces, coming back clears them', async ({
    page,
    goOffline,
    goOnline,
  }) => {
    await openDemo(page);

    await goOffline();
    await expect(snackbar(page)).toContainText('No internet');
    await expect(page.getByTestId('reason')).toHaveText('no-interface');

    await goOnline();
    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await expect(banner(page)).toHaveCount(0);
  });
});

test.describe('demo-web, accessibility', () => {
  const schemes = ['light', 'dark'] as const;

  async function checkBothSchemes(
    page: Page,
    checkA11y: () => Promise<void>,
  ): Promise<void> {
    for (const colorScheme of schemes) {
      await page.emulateMedia({ colorScheme });
      await checkA11y();
    }
  }

  test('online', async ({ page, checkA11y }) => {
    await openDemo(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('simulated offline: snackbar, banner and indicator', async ({
    page,
    checkA11y,
  }) => {
    await openDemo(page);
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();
    await settle(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('after the snackbar is dismissed', async ({ page, checkA11y }) => {
    await openDemo(page);
    await simulateOffline(page);
    await snackbar(page).getByRole('button', { name: 'Dismiss' }).click();
    await expect(snackbar(page)).toHaveCount(0);
    await settle(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('recovered (Back online)', async ({ page, checkA11y }) => {
    await openDemo(page);
    await simulateOffline(page);
    await expect(snackbar(page)).toBeVisible();
    await simulateOnline(page);
    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await settle(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('full screen', async ({ page, checkA11y }) => {
    await openDemo(page);
    await page.getByRole('radio', { name: 'On, with Continue offline' }).check();
    await simulateOffline(page);
    await expect(fullScreen(page)).toBeVisible();
    await settle(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('custom snackbar slot', async ({ page, checkA11y }) => {
    await openDemo(page);
    await page.getByLabel('Custom snackbar (slots.snackbar)').check();
    await simulateOffline(page);
    await expect(page.locator('.demo-toast')).toBeVisible();
    await settle(page);
    await checkBothSchemes(page, checkA11y);
  });

  test('pt-BR offline, with a forced dark scheme', async ({ page, checkA11y }) => {
    await openDemo(page);
    await chooseLocale(page, 'pt-BR');
    await page.getByLabel('colorScheme', { exact: true }).selectOption('dark');
    await simulateOffline(page);
    await expect(snackbar(page)).toContainText('Sem internet');
    await settle(page);
    await checkA11y();
  });
});
