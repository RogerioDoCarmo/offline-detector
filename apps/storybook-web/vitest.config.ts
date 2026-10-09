import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs every story, and its play function, in a real browser. CI installs Playwright's Chromium.
 * Locally, `OD_BROWSER_CHANNEL=chrome` uses the Chrome that is already installed instead, so no
 * browser has to be downloaded.
 */
const channel = process.env.OD_BROWSER_CHANNEL;

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(channel ? { launchOptions: { channel } } : {}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
