import AxeBuilder from '@axe-core/playwright';
import { expect, test as base } from '@playwright/test';

type Fixtures = {
  /** Cuts the network AND fires `offline` on the window, so the app is told as a browser would. */
  goOffline: () => Promise<void>;
  /** Restores the network AND fires `online` on the window. */
  goOnline: () => Promise<void>;
  /** Fails the test when axe finds a WCAG 2.0/2.1 A or AA violation on the current page. */
  checkA11y: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  // `context.setOffline` flips the browser's connectivity, but not every engine raises the window
  // event for it (and the ones that do raise it on their own schedule), so dispatch it ourselves
  // to make the page's view deterministic. Listeners that run twice must be idempotent, as a real
  // app's are.
  goOffline: async ({ context, page }, use) => {
    await use(async () => {
      await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    });
  },
  goOnline: async ({ context, page }, use) => {
    await use(async () => {
      await context.setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
    });
  },
  checkA11y: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  },
});

export { expect };
