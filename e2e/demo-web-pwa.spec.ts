import { DEMO_URL, indicator, openDemo, snackbar } from './demo-web-helpers';
import { expect, test } from './fixtures/test';

/**
 * The demo as an installed app (PWA): manifest, service worker, and the one thing that matters to
 * the library: the worker serves the page offline but never answers a reachability probe, so the
 * detector still reports the truth. Chromium only: it is the engine whose install and service
 * worker behaviour the check is about.
 */
test.skip(({ browserName }) => browserName !== 'chromium', 'PWA check runs on Chromium');

test.describe('demo-web, installed app', () => {
  test('links a web manifest that makes it installable', async ({ page, request }) => {
    await openDemo(page);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('/offline-detector/demo/manifest.webmanifest');

    const response = await request.get(new URL(href as string, DEMO_URL).toString());
    expect(response.ok()).toBe(true);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: 'offline-detector web demo',
      start_url: '/offline-detector/demo/',
      scope: '/offline-detector/demo/',
      display: 'standalone',
    });
    expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual([
      '192x192',
      '512x512',
    ]);
    for (const icon of manifest.icons) {
      const file = await request.get(new URL(icon.src, response.url()).toString());
      expect(file.ok()).toBe(true);
      expect(file.headers()['content-type']).toBe('image/png');
    }
  });

  test('registers a service worker that takes control of the page', async ({ page }) => {
    await openDemo(page);
    await expect(page.getByTestId('pwa-worker')).toHaveText('ready');
    await expect(page.getByTestId('pwa-controlled')).toHaveText('yes');
    await expect(page.getByTestId('pwa-display')).toHaveText('browser tab');
  });

  test('reloading offline still opens the page, and the detector reports offline', async ({
    page,
    goOffline,
  }) => {
    await openDemo(page);
    await expect(page.getByTestId('pwa-controlled')).toHaveText('yes');

    await goOffline();
    await page.reload();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'offline-detector web demo',
    );
    await expect(page.getByTestId('status')).toHaveText('offline');
    await expect(page.getByTestId('reason')).toHaveText('no-interface');
    await expect(snackbar(page)).toContainText('No internet');
    await expect(indicator(page)).toBeVisible();
  });

  test('the worker answers only the page and its static files, never a probe', async ({
    page,
    goOffline,
  }) => {
    await openDemo(page);
    await expect(page.getByTestId('pwa-controlled')).toHaveText('yes');
    await goOffline();

    const outcomes = await page.evaluate(async () => {
      const attempt = (url: string, method: string) =>
        fetch(url, { method, cache: 'no-store' }).then(
          () => 'answered',
          () => 'rejected',
        );
      return {
        // Cross-origin, as the default probe URLs are.
        crossOrigin: await attempt('https://cp.cloudflare.com/generate_204', 'HEAD'),
        // Same-origin and cached at install, but not a page or a static file: must not be served.
        sameOrigin: await attempt('/offline-detector/demo/manifest.webmanifest', 'GET'),
      };
    });

    expect(outcomes).toEqual({ crossOrigin: 'rejected', sameOrigin: 'rejected' });
  });
});
