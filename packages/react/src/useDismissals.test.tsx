import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { OfflineDetectorProvider } from './provider';
import { useDismissals } from './dismissal';
import type { DismissiblePiece, DismissOptions } from './types';
import { createAdapter, createFakeDetector, stateOf } from '../tests/helpers';

function setup(options?: DismissOptions) {
  const fake = createFakeDetector(stateOf('offline', 'no-internet'));
  const adapter = createAdapter().adapter;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <OfflineDetectorProvider adapter={adapter} detector={fake.detector}>
      {children}
    </OfflineDetectorProvider>
  );
  const hook = renderHook((props: DismissOptions | undefined) => useDismissals(props), {
    wrapper,
    initialProps: options,
  });
  return { fake, ...hook };
}

const PIECES: DismissiblePiece[] = ['snackbar', 'banner', 'indicator'];
const dismissedNow = (current: ReturnType<typeof useDismissals>) =>
  PIECES.filter((piece) => current.isDismissed(piece));

describe('useDismissals', () => {
  it('starts with nothing dismissed', () => {
    const { result } = setup();
    expect(dismissedNow(result.current)).toEqual([]);
  });

  it('dismisses one piece and leaves the others', () => {
    const { result } = setup();
    act(() => result.current.dismiss('banner'));
    expect(dismissedNow(result.current)).toEqual(['banner']);
    act(() => result.current.dismiss('indicator'));
    expect(dismissedNow(result.current)).toEqual(['banner', 'indicator']);
  });

  it('calls onDismiss once per actual dismissal', () => {
    const onDismiss = jest.fn();
    const { result } = setup({ onDismiss });
    act(() => result.current.dismiss('snackbar'));
    act(() => result.current.dismiss('snackbar'));
    act(() => result.current.dismiss('banner'));
    expect(onDismiss.mock.calls).toEqual([['snackbar'], ['banner']]);
  });

  it('is a no-op for a piece that is not dismissible', () => {
    const onDismiss = jest.fn();
    const { result } = setup({ banner: { dismissible: false }, onDismiss });
    act(() => result.current.dismiss('banner'));
    act(() => result.current.dismiss('snackbar'));
    expect(dismissedNow(result.current)).toEqual(['snackbar']);
    expect(onDismiss.mock.calls).toEqual([['snackbar']]);
  });

  it('is a no-op for every piece when the global flag is false', () => {
    const onDismiss = jest.fn();
    const { result } = setup({ dismissible: false, onDismiss });
    for (const piece of PIECES) act(() => result.current.dismiss(piece));
    expect(dismissedNow(result.current)).toEqual([]);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('honours a per-piece override of a false global flag', () => {
    const { result } = setup({ dismissible: false, indicator: { dismissible: true } });
    for (const piece of PIECES) act(() => result.current.dismiss(piece));
    expect(dismissedNow(result.current)).toEqual(['indicator']);
  });

  it('un-dismisses everything on the next status transition', () => {
    const { result, fake } = setup();
    act(() => result.current.dismiss('snackbar'));
    act(() => result.current.dismiss('banner'));
    act(() => fake.set(stateOf('online')));
    expect(dismissedNow(result.current)).toEqual([]);
    act(() => result.current.dismiss('banner'));
    expect(dismissedNow(result.current)).toEqual(['banner']);
    act(() => fake.set(stateOf('offline', 'no-interface')));
    expect(dismissedNow(result.current)).toEqual([]);
  });

  it('does not revive a dismissal when the same status comes back later', () => {
    const { result, fake } = setup();
    act(() => result.current.dismiss('banner'));
    act(() => fake.set(stateOf('online')));
    act(() => fake.set(stateOf('offline', 'no-internet')));
    expect(dismissedNow(result.current)).toEqual([]);
  });

  it('keeps a dismissal made on the initialStatus hint when the real result agrees', () => {
    const fake = createFakeDetector();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OfflineDetectorProvider
        adapter={createAdapter().adapter}
        detector={fake.detector}
        initialStatus="offline"
      >
        {children}
      </OfflineDetectorProvider>
    );
    const { result } = renderHook(() => useDismissals(), { wrapper });
    act(() => result.current.dismiss('snackbar'));
    act(() => fake.set(stateOf('offline', 'no-interface')));
    expect(dismissedNow(result.current)).toEqual(['snackbar']);
    act(() => fake.set(stateOf('online')));
    expect(dismissedNow(result.current)).toEqual([]);
  });

  it('keeps a dismissal through changes that are not status transitions', () => {
    const { result, fake } = setup();
    act(() => result.current.dismiss('indicator'));
    act(() => fake.set({ ...stateOf('offline', 'no-internet'), checking: true }));
    act(() => fake.set({ ...stateOf('offline', 'no-internet'), lastChecked: 5 }));
    act(() => fake.set(stateOf('offline', 'no-interface')));
    expect(dismissedNow(result.current)).toEqual(['indicator']);
  });

  it('does not bring a piece back by hiding and showing the same status twice in a row', () => {
    const { result, fake } = setup();
    act(() => result.current.dismiss('snackbar'));
    act(() => fake.set(stateOf('offline', 'no-internet')));
    expect(dismissedNow(result.current)).toEqual(['snackbar']);
  });

  it('uses the latest onDismiss and options without a reset', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = setup({ onDismiss: first });
    act(() => result.current.dismiss('snackbar'));
    rerender({ onDismiss: second, banner: { dismissible: false } });
    expect(dismissedNow(result.current)).toEqual(['snackbar']);
    act(() => result.current.dismiss('banner'));
    act(() => result.current.dismiss('indicator'));
    expect(first.mock.calls).toEqual([['snackbar']]);
    expect(second.mock.calls).toEqual([['indicator']]);
  });

  it('works with no options argument at all', () => {
    const fake = createFakeDetector(stateOf('offline', 'no-internet'));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <OfflineDetectorProvider adapter={createAdapter().adapter} detector={fake.detector}>
        {children}
      </OfflineDetectorProvider>
    );
    const { result } = renderHook(() => useDismissals(), { wrapper });
    act(() => result.current.dismiss('snackbar'));
    expect(result.current.isDismissed('snackbar')).toBe(true);
  });

  it('throws a clear error outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useDismissals())).toThrow(
      'useDismissals must be used inside <OfflineDetectorProvider>.',
    );
    spy.mockRestore();
  });
});
