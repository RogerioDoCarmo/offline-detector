import type {
  OfflineDetector,
  OfflineState,
  PlatformAdapter,
  ProbeFetch,
  StateListener,
} from '@rogeriodocarmo/offline-detector-core';

/** Lets every pending promise continuation run. */
export const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/** An in-memory adapter that tests drive by hand. */
export function createAdapter(initialUp = true) {
  let up = initialUp;
  const interfaceListeners: Set<(up: boolean) => void> = new Set();
  const foregroundListeners: Set<() => void> = new Set();
  let subscribeForegroundCalls = 0;

  const adapter: PlatformAdapter = {
    isInterfaceUp: () => up,
    subscribeInterface: (listener) => {
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
    setUp: (next: boolean) => {
      up = next;
      for (const listener of [...interfaceListeners]) listener(next);
    },
    foreground: () => {
      for (const listener of [...foregroundListeners]) listener();
    },
    interfaceListenerCount: () => interfaceListeners.size,
    foregroundListenerCount: () => foregroundListeners.size,
    subscribeForegroundCalls: () => subscribeForegroundCalls,
  };
}

/** A probe fetch that succeeds or fails on demand. `hold()` makes the next calls wait. */
export function createFetch() {
  let ok = true;
  let held: (() => void)[] | null = null;
  const calls: string[] = [];
  const fetchFn: ProbeFetch = (url) => {
    calls.push(url);
    const outcome = () => (ok ? { ok: true } : { ok: false });
    if (held === null) return Promise.resolve(outcome());
    const waiting = held;
    return new Promise((resolve: (value: { ok: boolean }) => void) => {
      waiting.push(() => resolve(outcome()));
    });
  };
  return Object.assign(fetchFn, {
    calls,
    setOk: (next: boolean) => {
      ok = next;
    },
    hold: () => {
      held = [];
    },
    release: () => {
      const waiting = held ?? [];
      held = null;
      for (const resolve of waiting) resolve();
    },
  });
}

export const PROBE = { urls: ['https://a.test'], timeoutMs: 5000, intervalMs: 30000 };

export const INITIAL: OfflineState = {
  status: 'unknown',
  reason: null,
  checking: false,
  lastChecked: null,
  lastOnlineAt: null,
};

export const stateOf = (
  status: OfflineState['status'],
  reason: OfflineState['reason'] = null,
): OfflineState => ({ ...INITIAL, status, reason: status === 'offline' ? reason : null });

/** A detector the test controls by hand; counts start/stop and keeps its listeners. */
export function createFakeDetector(initial: OfflineState = INITIAL) {
  let state = initial;
  const listeners: Set<StateListener> = new Set();
  const counts = { start: 0, stop: 0, checkNow: 0 };
  let nextCheck: OfflineState | null = null;
  const detector: OfflineDetector = {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: () => {
      counts.start++;
    },
    stop: () => {
      counts.stop++;
    },
    checkNow: () => {
      counts.checkNow++;
      if (nextCheck !== null) set(nextCheck);
      return Promise.resolve(state);
    },
  };
  function set(next: OfflineState) {
    const previous = state;
    state = next;
    for (const listener of [...listeners]) listener(next, previous);
  }
  return {
    detector,
    counts,
    set,
    /** What the next `checkNow()` will move the state to. */
    willCheckTo: (next: OfflineState | null) => {
      nextCheck = next;
    },
    listenerCount: () => listeners.size,
  };
}
