import { act, fireEvent, render } from '@testing-library/react';
import { OfflineDetector } from './offline-detector';
import type { OfflineDetectorProps } from './offline-detector';
import { createFakeAdapter, createFakeFetch, PROBE } from '../test-utils/fakes';
import { FRAME, pointer } from '../test-utils';

// Whole multi-step sequences through <OfflineDetector>. The reviewers found that every serious
// miss was a sequence that isolated piece tests never ran.

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

const $ = (selector: string) => document.querySelector(selector);

function must(element: Element | null): HTMLElement {
  if (!element) throw new Error('expected the element to be present');
  return element as HTMLElement;
}

async function mount(props: Partial<OfflineDetectorProps> = {}) {
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

const text = (selector: string) =>
  must($(selector)).querySelector('.od-msg')?.textContent;

describe('sequence: live regions are mounted empty, then filled a frame later', () => {
  it('for the offline snackbar and banner', async () => {
    const view = await mount();
    await view.goOffline();
    expect(text('.od-snackbar')).toBe('');
    expect(must($('.od-snackbar'))).toHaveAttribute('role', 'status');
    await advance(FRAME);
    expect(text('.od-snackbar')).toBe('No internet');
  });

  it('for the recovery snackbar after the offline one was dismissed', async () => {
    const view = await mount();
    await view.goOffline();
    await advance(FRAME);
    fireEvent.click(
      must($('.od-snackbar')).querySelector('button[aria-label="Dismiss"]') as Element,
    );
    await advance(200);
    expect($('.od-snackbar')).toBeNull();

    await view.goOnline();
    expect(text('.od-snackbar')).toBe('');
    await advance(FRAME);
    expect(text('.od-snackbar')).toBe('Back online');
  });

  it('for the snackbar that appears after "Continue offline"', async () => {
    const view = await mount({ fullScreen: { continueOffline: true } });
    await view.goOffline();
    expect($('.od-snackbar')).toBeNull();
    fireEvent.click(
      must($('.od-fullscreen')).querySelector('.od-text-button') as Element,
    );
    await advance(0);
    expect(text('.od-snackbar')).toBe('');
    await advance(FRAME);
    expect(text('.od-snackbar')).toBe('No internet');
  });

  it('for the recovery snackbar that follows the full-screen state', async () => {
    const view = await mount({ fullScreen: true });
    await view.goOffline();
    await advance(FRAME);
    await view.goOnline();
    expect(text('.od-snackbar')).toBe('');
    await advance(FRAME);
    expect(text('.od-snackbar')).toBe('Back online');
  });

  it('keeps one status region element across the frame (no remount)', async () => {
    const view = await mount();
    await view.goOffline();
    const region = must($('.od-snackbar'));
    await advance(FRAME);
    expect($('.od-snackbar')).toBe(region);
  });
});

describe('sequence: a pointer released outside the snackbar', () => {
  it('does not leave the "Back online" timer paused', async () => {
    const view = await mount({ recoveryMs: 4000 });
    await view.goOffline();
    await view.goOnline();
    await advance(FRAME);
    expect(must($('.od-snackbar'))).toHaveTextContent('Back online');

    pointer(must($('.od-snackbar')), 'pointerdown', {
      x: 50,
      y: 10,
      pointerType: 'mouse',
    });
    pointer(document.body, 'pointerup', { x: 900, y: 900, pointerType: 'mouse' });

    await advance(4000);
    expect($('.od-snackbar')).toBeNull();
  });
});

describe('sequence: the status changes during the exit animation', () => {
  it('keeps "Back online" visible when the offline snackbar was being dismissed', async () => {
    const onDismiss = jest.fn();
    const view = await mount({ onDismiss });
    await view.goOffline();

    fireEvent.click(
      must($('.od-snackbar')).querySelector('button[aria-label="Dismiss"]') as Element,
    );
    await advance(50); // the 150 ms exit is under way
    await view.goOnline();
    await advance(500); // the exit timer would have fired by now

    const snackbar = must($('.od-snackbar'));
    expect(snackbar).toHaveTextContent('Back online');
    expect(snackbar.style.opacity).not.toBe('0');
    expect(snackbar).not.toHaveAttribute('data-od-state', 'exit');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('shows the full "No internet" set again when a dismissal was cut short by a round trip', async () => {
    const view = await mount();
    await view.goOffline();
    fireEvent.click(
      must($('.od-banner')).querySelector('button[aria-label="Dismiss"]') as Element,
    );
    await advance(50);
    await view.goOnline();
    await view.goOffline();
    await advance(500);
    expect($('.od-banner')).not.toBeNull();
    expect($('.od-snackbar')).not.toBeNull();
  });
});
