import { act, render, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { usePublishHeight, useReducedMotion, useSettledChecking } from './hooks';

describe('useSettledChecking (150 ms delay, 400 ms minimum)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  function setup(initial: boolean) {
    return renderHook(({ active }) => useSettledChecking(active, 150, 400), {
      initialProps: { active: initial },
    });
  }

  it('is false when nothing is checking', () => {
    expect(setup(false).result.current).toBe(false);
  });

  it('stays hidden for a check that ends before 150 ms', () => {
    const { result, rerender } = setup(false);
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(149));
    expect(result.current).toBe(false);
    rerender({ active: false });
    act(() => void jest.advanceTimersByTime(1000));
    expect(result.current).toBe(false);
  });

  it('appears at 150 ms of pending', () => {
    const { result, rerender } = setup(false);
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(149));
    expect(result.current).toBe(false);
    act(() => void jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('stays for 400 ms after it appeared even if the check ends at once', () => {
    const { result, rerender } = setup(false);
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(150));
    expect(result.current).toBe(true);
    rerender({ active: false });
    act(() => void jest.advanceTimersByTime(399));
    expect(result.current).toBe(true);
    act(() => void jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('hides immediately when the check ends after the 400 ms minimum', () => {
    const { result, rerender } = setup(false);
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(150));
    act(() => void jest.advanceTimersByTime(400));
    rerender({ active: false });
    expect(result.current).toBe(false);
  });

  it('keeps showing if checking resumes during the minimum window', () => {
    const { result, rerender } = setup(false);
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(150));
    rerender({ active: false });
    act(() => void jest.advanceTimersByTime(100));
    rerender({ active: true });
    act(() => void jest.advanceTimersByTime(5000));
    expect(result.current).toBe(true);
  });

  it('with a zero delay shows on the first render (user-pressed Retry)', () => {
    const { result } = renderHook(() => useSettledChecking(true, 0, 400));
    expect(result.current).toBe(true);
  });

  it('with a zero delay still holds the minimum', () => {
    const { result, rerender } = renderHook(
      ({ active }) => useSettledChecking(active, 0, 400),
      { initialProps: { active: true } },
    );
    jest.advanceTimersByTime(399);
    rerender({ active: false });
    expect(result.current).toBe(true);
    act(() => void jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('clears its timer on unmount', () => {
    const { rerender, unmount } = setup(false);
    rerender({ active: true });
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe('useReducedMotion', () => {
  type Listener = (event: { matches: boolean }) => void;
  const original = window.matchMedia;
  let listeners: Listener[];
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;
    window.matchMedia = ((query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, fn: Listener) => listeners.push(fn),
      removeEventListener: (_: string, fn: Listener) => {
        listeners = listeners.filter((l) => l !== fn);
      },
    })) as never;
  });
  afterEach(() => {
    window.matchMedia = original;
  });

  it("'reduced' is always true and 'full' always false", () => {
    matches = true;
    expect(renderHook(() => useReducedMotion('full')).result.current).toBe(false);
    matches = false;
    expect(renderHook(() => useReducedMotion('reduced')).result.current).toBe(true);
  });

  it("'auto' follows prefers-reduced-motion, including later changes", () => {
    matches = true;
    const { result } = renderHook(() => useReducedMotion('auto'));
    expect(result.current).toBe(true);
    act(() => listeners.forEach((fn) => fn({ matches: false })));
    expect(result.current).toBe(false);
    act(() => listeners.forEach((fn) => fn({ matches: true })));
    expect(result.current).toBe(true);
  });

  it('defaults to auto and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });

  it('is false when matchMedia does not exist', () => {
    window.matchMedia = undefined as never;
    expect(renderHook(() => useReducedMotion('auto')).result.current).toBe(false);
  });
});

describe('usePublishHeight', () => {
  const root = document.documentElement;

  function Probe({ active, extra }: { active: boolean; extra?: number }) {
    const ref = useRef(null as HTMLDivElement | null);
    usePublishHeight('--od-banner-height', ref, active, extra);
    return <div ref={ref} data-testid="probe" />;
  }

  function stubHeight(height: number) {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height,
    } as DOMRect);
  }

  beforeEach(() => {
    root.style.removeProperty('--od-banner-height');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    root.style.removeProperty('--od-banner-height');
    delete (window as unknown as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it('publishes the measured height on the document root and clears it on unmount', () => {
    stubHeight(40);
    const { unmount } = render(<Probe active />);
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('40px');
    unmount();
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('0px');
  });

  it('adds the extra gap', () => {
    stubHeight(48);
    render(<Probe active extra={8} />);
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('56px');
  });

  it('publishes nothing while inactive', () => {
    stubHeight(40);
    render(<Probe active={false} />);
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('');
  });

  it('tracks resizes through ResizeObserver and disconnects it', () => {
    let notify: () => void = () => {};
    const disconnect = jest.fn();
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    };
    stubHeight(40);
    const { unmount } = render(<Probe active />);
    stubHeight(64);
    act(() => notify());
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('64px');
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
