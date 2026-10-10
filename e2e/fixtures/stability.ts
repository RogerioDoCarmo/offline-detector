/**
 * Helpers that keep E2E specs steady on slow runners (CI's WebKit above all). Adapted from the
 * website repo. Both fix a race in the test, not a bug in the app:
 *
 * - A server-rendered page can show a clickable button well before React has hydrated and
 *   attached its handlers; a click in that window does nothing.
 * - An app that reloads itself can collide with `page.reload()`, and WebKit then reports
 *   "Frame load interrupted".
 */

import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Waits until React has hydrated the element: hydration attaches an internal `__reactProps$...` /
 * `__reactFiber$...` key to every DOM node it owns, which server-rendered HTML does not have.
 */
export async function waitForHydrated(locator: Locator, timeout = 20_000): Promise<void> {
  await expect
    .poll(
      () =>
        locator
          .first()
          .evaluate((el) =>
            Object.keys(el).some(
              (key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$'),
            ),
          ),
      { timeout, message: 'element was never hydrated by React' },
    )
    .toBe(true);
}

/** Errors that mean a navigation was cut short by another one, so the reload is worth repeating. */
const INTERRUPTED_NAVIGATION =
  /Frame load interrupted|Execution context was destroyed|interrupted by another navigation/i;

/**
 * `page.reload()` that tries again when it collides with a navigation the app started itself.
 * Any other failure is rethrown straight away.
 */
export async function reloadWithRetry(page: Page, attempts = 3): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await page.reload();
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= attempts || !INTERRUPTED_NAVIGATION.test(message)) throw error;
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(500);
    }
  }
}
