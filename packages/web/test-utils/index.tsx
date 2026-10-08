// Type-only effect for the tests: brings the jest-dom matchers into the program.
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/react';
import type { OfflineStrings } from '../src/contract-types';

/** The bundled English copy (docs/design/strings.md), written out so tests assert literals. */
export const EN: OfflineStrings = {
  offline: 'No internet',
  offlineNoInterface: 'No network connection',
  offlineNoInternet: 'Connected, but no internet',
  online: 'Back online',
  retry: 'Retry',
  checking: 'Checking…',
  continueOffline: 'Continue offline',
  dismiss: 'Dismiss',
  dismissHint: 'Swipe left or right to dismiss',
  indicatorLabelOnline: 'Online',
  indicatorLabelOffline: 'No internet',
  indicatorLabelChecking: 'Checking connection',
  indicatorAccessibleName: 'Connection status: {status}',
  fullScreenTitle: 'No internet',
  fullScreenBody: 'Check your connection and try again.',
  fullScreenRetry: 'Try again',
};

/** jsdom has no PointerEvent: a MouseEvent carrying the pointer fields React reads. */
export function pointer(
  element: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: {
    x?: number;
    y?: number;
    id?: number;
    pointerType?: string;
    button?: number;
  } = {},
): boolean {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: init.button ?? 0,
  });
  Object.defineProperty(event, 'pointerId', { value: init.id ?? 1 });
  Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'touch' });
  return fireEvent(element, event);
}

/** Gives an element a width and a pointer-capture spy, as a laid-out browser element would have. */
export function layout(element: Element, width: number) {
  const setPointerCapture = jest.fn();
  const releasePointerCapture = jest.fn();
  Object.assign(element, { setPointerCapture, releasePointerCapture });
  element.getBoundingClientRect = () =>
    ({
      width,
      height: 48,
      top: 0,
      left: 0,
      right: width,
      bottom: 48,
      x: 0,
      y: 0,
    }) as DOMRect;
  return { setPointerCapture, releasePointerCapture };
}
