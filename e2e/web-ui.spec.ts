import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures/test';

/**
 * The real <OfflineDetector> from the web package (see e2e/web-ui-fixture/fixture.jsx): the web
 * adapter, the detector and the react hooks, reacting to the real `offline` / `online` events of
 * a real browser. Only the probe `fetch` is a stub (window.__probeOk), so no network is needed.
 *
 * The fixture is bundled with Rspack (shipped by @rslib/core) into a temporary folder and injected
 * with `addScriptTag`, so no static file has to be added to e2e/fixtures/site.
 */
let bundle = '';

test.beforeAll(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'od-web-ui-'));
  bundle = execFileSync(
    process.execPath,
    [join(__dirname, 'web-ui-fixture/build.mjs'), outDir],
    {
      encoding: 'utf8',
    },
  ).trim();
});

async function open(page: Page, props: Record<string, unknown> = {}) {
  await page.setContent(
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Web UI fixture</title></head><body><div id="root"></div></body></html>',
  );
  await page.evaluate((p) => {
    (window as unknown as { __odProps: unknown }).__odProps = p;
  }, props);
  await page.addScriptTag({ path: bundle });
  await expect(page.getByRole('heading', { name: 'Host app' })).toBeVisible();
}

/**
 * A mouse drag across `fraction` of the element's width (and `dy` px down), in 12 steps. A `slow`
 * drag takes about 600 ms, so its speed stays far under the 0.5 px/ms flick threshold and only
 * the 30% distance rule can dismiss it; a fast one is a flick.
 */
async function swipe(
  page: Page,
  target: Locator,
  fraction: number,
  dy = 0,
  slow = false,
) {
  const box = await target.boundingBox();
  if (!box) throw new Error('element has no box');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  if (slow) {
    for (let step = 1; step <= 12; step++) {
      await page.mouse.move(
        startX + (box.width * fraction * step) / 12,
        startY + (dy * step) / 12,
      );
      await page.waitForTimeout(50);
    }
  } else {
    await page.mouse.move(startX + box.width * fraction, startY + dy, { steps: 12 });
  }
  await page.mouse.up();
}

const snackbar = (page: Page) => page.locator('.od-snackbar');

test.describe('web UI pieces in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('shows nothing while online', async ({ page }) => {
    await expect(snackbar(page)).toHaveCount(0);
    await expect(page.locator('.od-banner')).toHaveCount(0);
    await expect(page.locator('.od-indicator')).toHaveCount(0);
  });

  test('going offline shows the snackbar, banner and indicator with the right roles', async ({
    page,
    goOffline,
  }) => {
    await goOffline();

    await expect(page.getByRole('status')).toHaveCount(1);
    await expect(page.getByRole('status')).toHaveText(/No internet/);
    await expect(page.getByRole('region', { name: 'No internet' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: 'Connection status: No internet' }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('has no accessibility violations offline, in light and dark', async ({
    page,
    goOffline,
    checkA11y,
  }) => {
    await goOffline();
    await expect(snackbar(page)).toBeVisible();
    // Let the entrance animations finish so axe measures final colours.
    await page.waitForTimeout(500);

    await page.emulateMedia({ colorScheme: 'light' });
    await checkA11y();
    await page.emulateMedia({ colorScheme: 'dark' });
    await checkA11y();
  });

  test('swiping the snackbar sideways dismisses it; the banner then announces', async ({
    page,
    goOffline,
  }) => {
    await goOffline();
    await expect(snackbar(page)).toBeVisible();

    await swipe(page, snackbar(page), 0.5);

    await expect(snackbar(page)).toHaveCount(0);
    await expect(page.locator('.od-banner')).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/No internet/);
  });

  test('a short drag springs back and a vertical drag is ignored', async ({
    page,
    goOffline,
  }) => {
    await goOffline();
    await expect(snackbar(page)).toBeVisible();

    await swipe(page, snackbar(page), 0.1, 0, true);
    await page.waitForTimeout(400);
    await expect(snackbar(page)).toBeVisible();
    await expect(snackbar(page)).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

    await swipe(page, snackbar(page), 0.02, 120, true);
    await page.waitForTimeout(400);
    await expect(snackbar(page)).toBeVisible();
  });

  test('the Dismiss buttons and Escape on the indicator dismiss without a gesture', async ({
    page,
    goOffline,
  }) => {
    await goOffline();

    await snackbar(page).getByRole('button', { name: 'Dismiss' }).click();
    await expect(snackbar(page)).toHaveCount(0);

    await page.locator('.od-banner').getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.locator('.od-banner')).toHaveCount(0);

    await page.getByRole('img', { name: 'Connection status: No internet' }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.od-indicator')).toHaveCount(0);
  });

  test('coming back online announces "Back online", then clears itself', async ({
    page,
    goOffline,
    goOnline,
  }) => {
    await goOffline();
    await expect(snackbar(page)).toBeVisible();

    await goOnline();

    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await expect(page.locator('.od-banner')).toHaveCount(0);
    await expect(snackbar(page)).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('.od-indicator')).toHaveCount(0);
  });

  test('dismissed pieces come back on the next offline transition', async ({
    page,
    goOffline,
    goOnline,
  }) => {
    await goOffline();
    await swipe(page, snackbar(page), 0.5);
    await expect(snackbar(page)).toHaveCount(0);

    await goOnline();
    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await goOffline();

    await expect(snackbar(page)).toBeVisible();
  });

  test('with reduced motion the swipe still dismisses, without a slide', async ({
    page,
    goOffline,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await goOffline();
    await expect(snackbar(page)).toBeVisible();

    await swipe(page, snackbar(page), 0.5);

    await expect(snackbar(page)).toHaveCount(0);
  });
});

test.describe('OfflineDetector options and the probe', () => {
  const setProbe = (page: Page, ok: boolean) =>
    page.evaluate((value) => {
      (window as unknown as { __probeOk: boolean }).__probeOk = value;
    }, ok);

  test('launching offline shows the pieces straight away', async ({ page, context }) => {
    await context.setOffline(true);
    await open(page);

    await expect(snackbar(page)).toContainText('No internet');
    await expect(page.locator('.od-banner')).toBeVisible();
    await expect(page.locator('.od-indicator')).toBeVisible();
    await expect(page.getByText('Back online')).toHaveCount(0);
  });

  test('Retry probes: it stays offline while the probe fails, then recovers', async ({
    page,
    context,
    goOffline,
  }) => {
    await open(page);
    await setProbe(page, false);
    await goOffline();
    // The interface comes back but the internet does not: the probe decides.
    await context.setOffline(false);
    await expect(snackbar(page)).toContainText('No internet');

    const calls = () =>
      page.evaluate(() => (window as unknown as { __probeCalls: number }).__probeCalls);
    const before = await calls();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect.poll(calls).toBeGreaterThan(before);
    await expect(snackbar(page)).toContainText('No internet');

    await setProbe(page, true);
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('status')).toHaveText(/Back online/);
    await expect(page.locator('.od-banner')).toHaveCount(0);
  });

  test('the opt-in full-screen state replaces the other pieces; Continue offline closes it', async ({
    page,
    goOffline,
  }) => {
    await open(page, { fullScreen: { continueOffline: true } });
    await goOffline();

    await expect(page.locator('.od-fullscreen')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No internet' })).toBeVisible();
    await expect(snackbar(page)).toHaveCount(0);
    await expect(page.locator('.od-banner')).toHaveCount(0);

    await page.getByRole('button', { name: 'Continue offline' }).click();
    await expect(page.locator('.od-fullscreen')).toHaveCount(0);
    await expect(page.locator('.od-banner')).toBeVisible();
  });

  test('speaks Portuguese when asked', async ({ page, goOffline, goOnline }) => {
    await open(page, { locale: 'pt-BR' });
    await goOffline();
    await expect(snackbar(page)).toContainText('Sem internet');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();

    await goOnline();
    await expect(page.getByRole('status')).toHaveText(/Conexão restabelecida/);
  });

  test('a forced dark scheme sets data-od-theme on a wrapper', async ({ page }) => {
    await open(page, { colorScheme: 'dark' });
    await expect(page.locator('[data-od-theme="dark"]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Host app' })).toBeVisible();
  });
});
