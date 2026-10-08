import { createOfflineDetector } from '../detector';
import type {
  OfflineDetectorOptions,
  PlatformAdapter,
  ProbeFetch,
  ProbeResponse,
  TimerHandle,
} from '../types';

/** Lets every pending promise continuation run. */
export const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

interface FakeTimer {
  at: number;
  callback: () => void;
}

/** A manual clock: nothing fires until `advance` is called. */
export function createClock(start = 1_000_000) {
  let time = start;
  let nextId = 1;
  const timers: Map<number, FakeTimer> = new Map();
  const delays: number[] = [];

  const clock = {
    now: () => time,
    setTimeout: (callback: () => void, ms: number): TimerHandle => {
      const id = nextId++;
      timers.set(id, { at: time + ms, callback });
      delays.push(ms);
      return id;
    },
    clearTimeout: (handle: TimerHandle): void => {
      timers.delete(handle as number);
    },
    /** Every delay ever passed to `setTimeout`, in order. */
    delays,
    pending: () => timers.size,
    /** Runs due timers in order, letting promises settle after each one. */
    advance: async (ms: number): Promise<void> => {
      const target = time + ms;
      for (;;) {
        await flush();
        let dueId: number | undefined;
        let due: FakeTimer | undefined;
        for (const [id, timer] of timers) {
          if (timer.at <= target && (due === undefined || timer.at < due.at)) {
            dueId = id;
            due = timer;
          }
        }
        if (dueId === undefined || due === undefined) break;
        timers.delete(dueId);
        time = due.at;
        due.callback();
      }
      time = target;
      await flush();
    },
    tick: (ms: number) => {
      time += ms;
    },
  };
  return clock;
}

export type FetchBehavior = 'ok' | 'fail' | 'http-error' | 'opaque' | 'hang';

/** A fetch whose outcome per call is chosen by `behave(url, callIndex)`. */
export function createFetch(behave: (url: string, call: number) => FetchBehavior) {
  const calls: string[] = [];
  const inits: { method: string; signal: AbortSignal }[] = [];
  const fetchFn: ProbeFetch = (url, init) => {
    const call = calls.length;
    calls.push(url);
    inits.push(init);
    const behavior = behave(url, call);
    if (behavior === 'hang') {
      const never: Promise<ProbeResponse> = new Promise(() => {});
      return never;
    }
    if (behavior === 'fail')
      return Promise.reject(new TypeError('Network request failed'));
    if (behavior === 'http-error') return Promise.resolve({ ok: false, type: 'basic' });
    if (behavior === 'opaque') return Promise.resolve({ ok: false, type: 'opaque' });
    return Promise.resolve({ ok: true, type: 'basic' });
  };
  return Object.assign(fetchFn, { calls, inits });
}

/** An in-memory adapter that tests drive by hand. */
export function createAdapter(initialUp = true) {
  let up = initialUp;
  const interfaceListeners: Set<(up: boolean) => void> = new Set();
  const foregroundListeners: Set<() => void> = new Set();
  let subscribeInterfaceCalls = 0;
  let subscribeForegroundCalls = 0;

  const adapter: PlatformAdapter = {
    isInterfaceUp: () => up,
    subscribeInterface: (listener) => {
      subscribeInterfaceCalls++;
      interfaceListeners.add(listener);
      return () => {
        interfaceListeners.delete(listener);
      };
    },
    subscribeForeground: (listener) => {
      subscribeForegroundCalls++;
      foregroundListeners.add(listener);
      return () => {
        foregroundListeners.delete(listener);
      };
    },
  };

  return {
    adapter,
    /** Changes the interface and notifies subscribers, like a real platform event. */
    setUp: (next: boolean) => {
      up = next;
      for (const listener of [...interfaceListeners]) listener(next);
    },
    /** Changes the interface silently (no event). */
    setUpSilently: (next: boolean) => {
      up = next;
    },
    foreground: () => {
      for (const listener of [...foregroundListeners]) listener();
    },
    interfaceListenerCount: () => interfaceListeners.size,
    foregroundListenerCount: () => foregroundListeners.size,
    subscribeInterfaceCalls: () => subscribeInterfaceCalls,
    subscribeForegroundCalls: () => subscribeForegroundCalls,
  };
}

export const TEST_URLS = ['https://a.test', 'https://b.test'];

/** A detector wired to fakes, plus a log of every callback that fired. */
export function make(
  behave: (url: string, call: number) => FetchBehavior = () => 'ok',
  options: Partial<OfflineDetectorOptions> = {},
  up = true,
) {
  const clock = createClock();
  const adapter = createAdapter(up);
  const fetch = createFetch(behave);
  const events: string[] = [];
  const detector = createOfflineDetector({
    adapter: adapter.adapter,
    probe: { urls: TEST_URLS, timeoutMs: 5000, intervalMs: 30000 },
    fetch,
    now: clock.now,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    onOffline: (s) => events.push(`offline:${s.reason}`),
    onOnline: () => events.push('online'),
    onChange: (s, p) => events.push(`change:${p.status}>${s.status}`),
    ...options,
  });
  return { detector, clock, adapter, fetch, events };
}
