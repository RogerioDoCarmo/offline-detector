import { expect, test } from './fixtures/test';
import { reloadWithRetry } from './fixtures/stability';

test.describe('offline fixture smoke test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('Online');
  });

  test('goOffline() makes the page see the offline event and blocks the network', async ({
    page,
    goOffline,
  }) => {
    await goOffline();

    await expect(page.getByRole('status')).toHaveText('Offline');
    const outcome = await page.evaluate(() =>
      fetch('/index.html', { cache: 'no-store' }).then(
        () => 'reachable',
        () => 'blocked',
      ),
    );
    expect(outcome).toBe('blocked');
  });

  test('goOnline() restores the network and the online status', async ({
    page,
    goOffline,
    goOnline,
  }) => {
    await goOffline();
    await expect(page.getByRole('status')).toHaveText('Offline');

    await goOnline();

    await expect(page.getByRole('status')).toHaveText('Online');
    const outcome = await page.evaluate(() =>
      fetch('/index.html', { cache: 'no-store' }).then(
        (response) => response.status,
        () => 'blocked',
      ),
    );
    expect(outcome).toBe(200);
  });

  test('a reload after reconnecting shows the online status', async ({
    page,
    goOffline,
    goOnline,
  }) => {
    await goOffline();
    await goOnline();

    await reloadWithRetry(page);

    await expect(page.getByRole('status')).toHaveText('Online');
  });

  test('has no accessibility violations online or offline', async ({
    goOffline,
    checkA11y,
  }) => {
    await checkA11y();

    await goOffline();

    await checkA11y();
  });
});
