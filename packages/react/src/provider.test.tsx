import { StrictMode } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { createOfflineDetector } from '@rogeriodocarmo/offline-detector-core';
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import {
  OfflineDetectorProvider,
  useNetworkStatus,
  useOfflineDetector,
} from './provider';
import type { OfflineDetectorProviderProps } from './types';
import {
  createAdapter,
  createFakeDetector,
  createFetch,
  PROBE,
  stateOf,
} from '../tests/helpers';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

/** Runs timers and promise continuations to quiescence at the current fake time. */
const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });

/** Mounts inside an async act so the effects' first check cannot update outside act. */
async function mount(element: React.ReactElement) {
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(element);
  });
  return view;
}

async function mountHook<T>(
  callback: () => T,
  wrapper: React.ComponentType<{ children: React.ReactNode }>,
) {
  let hook!: { result: { current: T } };
  await act(async () => {
    hook = renderHook(callback, { wrapper });
  });
  return hook;
}

function Status() {
  const { status, isOnline } = useNetworkStatus();
  return (
    <span data-testid="status">
      {status}:{String(isOnline)}
    </span>
  );
}

function setup(extra: Partial<OfflineDetectorProviderProps> = {}) {
  const adapter = createAdapter();
  const fetch = createFetch();
  const props = { adapter: adapter.adapter, probe: PROBE, fetch, ...extra };
  const ui = (p: Partial<OfflineDetectorProviderProps> = {}, strict = false) => {
    const tree = (
      <OfflineDetectorProvider {...props} {...p}>
        <Status />
      </OfflineDetectorProvider>
    );
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  return { adapter, fetch, ui };
}

function wrapperFor(props: Omit<OfflineDetectorProviderProps, 'children'>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <OfflineDetectorProvider {...props}>{children}</OfflineDetectorProvider>;
  };
}

describe('lifecycle', () => {
  it('creates one detector, starts it after mount, and reaches online', async () => {
    const { ui, fetch, adapter } = setup();
    const view = render(ui());
    expect(view.getByTestId('status').textContent).toBe('unknown:true');
    await settle();
    expect(view.getByTestId('status').textContent).toBe('online:true');
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(adapter.interfaceListenerCount()).toBe(1);
  });

  it('does not subscribe to foreground returns by itself', async () => {
    const { ui, adapter } = setup();
    await mount(ui());
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(0);
  });

  it('stops on unmount: no listeners, no timers', async () => {
    const { ui, adapter } = setup();
    const view = await mount(ui());
    await settle();
    expect(jest.getTimerCount()).toBe(1);
    view.unmount();
    await settle();
    expect(adapter.interfaceListenerCount()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('starts and stops an injected detector exactly once each', async () => {
    const fake = createFakeDetector();
    const { ui } = setup({ detector: fake.detector });
    const view = await mount(ui());
    await settle();
    expect(fake.counts).toEqual({ start: 1, stop: 0, checkNow: 0 });
    view.unmount();
    await settle();
    expect(fake.counts).toEqual({ start: 1, stop: 1, checkNow: 0 });
    expect(fake.listenerCount()).toBe(0);
  });

  it('StrictMode double mount: one start, no stop, one listener, one probe, one timer', async () => {
    const fake = createFakeDetector();
    const strictFake = setup({ detector: fake.detector });
    const first = await mount(strictFake.ui({}, true));
    await settle();
    expect(fake.counts.start).toBe(1);
    expect(fake.counts.stop).toBe(0);
    first.unmount();
    await settle();
    expect(fake.counts.stop).toBe(1);

    const real = setup();
    const view = await mount(real.ui({}, true));
    await settle();
    expect(view.getByTestId('status').textContent).toBe('online:true');
    expect(real.adapter.interfaceListenerCount()).toBe(1);
    expect(real.fetch.calls).toEqual(['https://a.test']);
    expect(jest.getTimerCount()).toBe(1);
    view.unmount();
    await settle();
    expect(real.adapter.interfaceListenerCount()).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps the detector it created at mount when the props change', async () => {
    const { ui, adapter, fetch } = setup();
    const view = await mount(ui());
    await settle();
    const other = createAdapter();
    view.rerender(ui({ adapter: other.adapter, probe: { urls: ['https://b.test'] } }));
    await settle();
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(adapter.interfaceListenerCount()).toBe(1);
    expect(other.interfaceListenerCount()).toBe(0);
  });
});

describe('callbacks', () => {
  it('fire on status transitions only, with the documented arguments', async () => {
    const onOffline = jest.fn();
    const onOnline = jest.fn();
    const onChange = jest.fn();
    const { ui, adapter, fetch } = setup({ onOffline, onOnline, onChange });
    await mount(ui());
    await settle();

    // First result is online: onChange yes, onOnline no.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].status).toBe('online');
    expect(onChange.mock.calls[0][1].status).toBe('unknown');
    expect(onOnline).not.toHaveBeenCalled();
    expect(onOffline).not.toHaveBeenCalled();

    // Re-probing while online changes timestamps, not the status.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(30000);
    });
    expect(fetch.calls).toHaveLength(2);
    expect(onChange).toHaveBeenCalledTimes(1);

    await act(async () => adapter.setUp(false));
    await settle();
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onOffline.mock.calls[0][0].reason).toBe('no-interface');
    expect(onChange).toHaveBeenCalledTimes(2);

    // Same status, different reason: not a transition for the callbacks.
    fetch.setOk(false);
    await act(async () => adapter.setUp(true));
    await settle();
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(2);

    // Backoff: 1 s after the interface drop, then 2 s after the failed probe.
    fetch.setOk(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    await settle();
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOnline.mock.calls[0][0].status).toBe('online');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('changing callback props neither restarts the detector nor loses the latest callback', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { ui, adapter, fetch } = setup({ onChange: first });
    const view = await mount(ui());
    await settle();
    expect(first).toHaveBeenCalledTimes(1);

    view.rerender(ui({ onChange: second }));
    await settle();
    expect(fetch.calls).toHaveLength(1);
    expect(adapter.interfaceListenerCount()).toBe(1);

    await act(async () => adapter.setUp(false));
    await settle();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('removing a callback prop silences it', async () => {
    const onChange = jest.fn();
    const { ui, adapter } = setup({ onChange });
    const view = await mount(ui());
    await settle();
    view.rerender(ui({ onChange: undefined }));
    await act(async () => adapter.setUp(false));
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('routes a throwing callback to onError', async () => {
    const boom = new Error('boom');
    const onError = jest.fn();
    const { ui } = setup({
      onChange: () => {
        throw boom;
      },
      onError,
    });
    await mount(ui());
    await settle();
    expect(onError).toHaveBeenCalledWith(boom);
  });
});

describe('useNetworkStatus', () => {
  it('exposes the state, isOnline and checkNow', async () => {
    const fetch = createFetch();
    const wrapper = wrapperFor({ adapter: createAdapter().adapter, probe: PROBE, fetch });
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });
    expect(result.current).toMatchObject({
      status: 'unknown',
      reason: null,
      lastChecked: null,
      lastOnlineAt: null,
      isOnline: true,
    });
    await settle();
    expect(result.current.status).toBe('online');
    expect(result.current.isOnline).toBe(true);
    expect(typeof result.current.lastChecked).toBe('number');

    fetch.setOk(false);
    let checked: OfflineState | undefined;
    await act(async () => {
      const pending = result.current.checkNow();
      await jest.advanceTimersByTimeAsync(0);
      checked = await pending;
    });
    expect(checked?.status).toBe('offline');
    expect(checked?.reason).toBe('no-internet');
    expect(result.current.status).toBe('offline');
    expect(result.current.reason).toBe('no-internet');
    expect(result.current.isOnline).toBe(false);
  });

  it('keeps the same checkNow function across state changes', async () => {
    const wrapper = wrapperFor({
      adapter: createAdapter().adapter,
      probe: PROBE,
      fetch: createFetch(),
    });
    const { result } = await mountHook(() => useNetworkStatus(), wrapper);
    const first = result.current.checkNow;
    await settle();
    expect(result.current.checkNow).toBe(first);
  });

  it('throws a clear error outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNetworkStatus())).toThrow(
      'useNetworkStatus must be used inside <OfflineDetectorProvider>.',
    );
    expect(() => renderHook(() => useOfflineDetector())).toThrow(
      'useOfflineDetector must be used inside <OfflineDetectorProvider>.',
    );
    spy.mockRestore();
  });
});

describe('useOfflineDetector', () => {
  it('returns the detector in use (the injected one)', async () => {
    const fake = createFakeDetector();
    const wrapper = wrapperFor({
      adapter: createAdapter().adapter,
      detector: fake.detector,
    });
    const { result } = await mountHook(() => useOfflineDetector(), wrapper);
    expect(result.current).toBe(fake.detector);
  });

  it('returns a working detector the provider created', async () => {
    const wrapper = wrapperFor({
      adapter: createAdapter().adapter,
      probe: PROBE,
      fetch: createFetch(),
    });
    const { result } = await mountHook(() => useOfflineDetector(), wrapper);
    await settle();
    expect(result.current.getState().status).toBe('online');
  });
});

describe('initialStatus', () => {
  it('is what the first render shows, and holds until the first check completes', async () => {
    const { ui, fetch } = setup({ initialStatus: 'offline' });
    fetch.hold();
    const view = await mount(ui());
    expect(view.getByTestId('status').textContent).toBe('offline:false');
    await settle();
    expect(view.getByTestId('status').textContent).toBe('offline:false');
    await act(async () => fetch.release());
    await settle();
    expect(view.getByTestId('status').textContent).toBe('online:true');
  });

  it('assumes an offline reason of no-internet for the hint', async () => {
    const wrapper = wrapperFor({
      adapter: createAdapter().adapter,
      probe: PROBE,
      fetch: createFetch(),
      initialStatus: 'offline',
    });
    const { result } = renderHook(() => useNetworkStatus(), { wrapper });
    expect(result.current.reason).toBe('no-internet');
    expect(result.current.status).toBe('offline');
    await settle();
  });

  it('is ignored once the detector knows better (a real offline reason wins)', async () => {
    const fake = createFakeDetector(stateOf('offline', 'no-interface'));
    const { ui } = setup({ detector: fake.detector, initialStatus: 'online' });
    const view = await mount(ui());
    expect(view.getByTestId('status').textContent).toBe('offline:false');
  });

  it('accepts the real core detector as the injected one', async () => {
    const adapter = createAdapter();
    const detector = createOfflineDetector({
      adapter: adapter.adapter,
      probe: { mode: 'interface-only' },
    });
    const wrapper = wrapperFor({ adapter: adapter.adapter, detector });
    const { result } = await mountHook(() => useNetworkStatus(), wrapper);
    await settle();
    expect(result.current.status).toBe('online');
  });
});
