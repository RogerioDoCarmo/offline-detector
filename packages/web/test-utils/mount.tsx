import { act, render } from '@testing-library/react';
import { OfflineDetector } from '../src/offline-detector';
import type { OfflineDetectorProps } from '../src/offline-detector';
import { createFakeAdapter, createFakeFetch, PROBE } from './fakes';

/** Advances fake timers inside act. */
export const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

export const $ = (selector: string) => document.querySelector(selector);

export function must(element: Element | null): HTMLElement {
  if (!element) throw new Error('expected the element to be present');
  return element as HTMLElement;
}

/**
 * Mounts `<OfflineDetector>` around a host button with a fake adapter and probe. Needs fake
 * timers. `goOffline` / `goOnline` flip the interface and let the detector settle.
 */
export async function mountDetector(props: Partial<OfflineDetectorProps> = {}) {
  const fake = createFakeAdapter(true);
  const fetch = createFakeFetch();
  render(
    <OfflineDetector adapter={fake.adapter} probe={PROBE} fetch={fetch} {...props}>
      <button>Host button</button>
    </OfflineDetector>,
  );
  await advance(0);
  return {
    fake,
    fetch,
    goOffline: async () => {
      act(() => fake.setUp(false));
      await advance(0);
    },
    goOnline: async () => {
      act(() => fake.setUp(true));
      await advance(0);
    },
  };
}
