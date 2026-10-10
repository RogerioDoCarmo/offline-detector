import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { waitForHydrated } from './fixtures/stability';

/** The exported demo under its GitHub Pages base path (see e2e/fixtures/serve.mjs). */
export const DEMO_URL = `${process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4173}`}/offline-detector/demo/`;

export const snackbar = (page: Page) => page.locator('.od-snackbar');
export const banner = (page: Page) => page.locator('.od-banner');
export const indicator = (page: Page) => page.locator('.od-indicator');
export const fullScreen = (page: Page) => page.locator('.od-fullscreen');

const simulateButton = (page: Page) =>
  page.getByRole('button', { name: /^Simulate (offline|online)$/ });

/** Opens the demo and waits until React has hydrated and the first (stub) probe answered. */
export async function openDemo(page: Page): Promise<void> {
  await page.goto(DEMO_URL);
  await waitForHydrated(simulateButton(page));
  await expect(page.getByTestId('status')).toHaveText('online');
}

export async function simulateOffline(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Simulate offline' }).click();
}

export async function simulateOnline(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Simulate online' }).click();
}

/** Lets the entrance animations finish so axe measures final colours. */
export async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(500);
}

/**
 * A mouse drag across `fraction` of the element's width, in 12 steps (fast, so it is a flick and
 * dismisses on speed as well as distance).
 */
export async function swipe(
  page: Page,
  target: Locator,
  fraction: number,
): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('element has no box');
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + box.width * fraction, startY, { steps: 12 });
  await page.mouse.up();
}
