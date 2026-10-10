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

  // axe reads computed colours. A scheme flip or an entrance starts a CSS transition, and judged
  // half-way it reports a contrast failure that nobody sees once it settles; WebKit is slow enough
  // to be caught there (it failed the full-screen demo test on CI). The transition here is long
  // and linear so the half-way colour is the same in every engine: dark text on a mid blue that
  // is below 4.5:1 for most of the run, ending on a pale background where it is far above it.
  test('checkA11y waits for a running transition and judges the settled colours', async ({
    page,
    checkA11y,
  }) => {
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent =
        '#t{color:#0b1b33;background:#1163d3;transition:background-color 800ms linear}' +
        '#t.done{background:#f2f6ff}';
      document.head.append(style);
      const button = document.createElement('button');
      button.id = 't';
      button.textContent = 'Try again';
      document.body.append(button);
    });
    await page.evaluate(() => document.getElementById('t')?.classList.add('done'));

    await checkA11y();
  });
});
