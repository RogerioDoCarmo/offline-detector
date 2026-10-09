import type {
  PlatformAdapter,
  ProbeFetch,
  ProbeResponse,
} from '@rogeriodocarmo/offline-detector-core';

/** An in-memory adapter driven by hand. It never reads `navigator` or listens to the window. */
export function createFakeAdapter(initialUp = true) {
  let up = initialUp;
  const interfaceListeners = new Set<(up: boolean) => void>();
  const foregroundListeners = new Set<() => void>();
  const adapter: PlatformAdapter = {
    isInterfaceUp: () => up,
    subscribeInterface: (listener) => {
      interfaceListeners.add(listener);
      return () => {
        interfaceListeners.delete(listener);
      };
    },
    subscribeForeground: (listener) => {
      foregroundListeners.add(listener);
      return () => {
        foregroundListeners.delete(listener);
      };
    },
  };
  return {
    adapter,
    setUp(next: boolean) {
      up = next;
      for (const listener of [...interfaceListeners]) listener(next);
    },
    foreground() {
      for (const listener of [...foregroundListeners]) listener();
    },
  };
}

/**
 * A probe that never leaves the page: it answers `ok` or not on demand, and `hold()` keeps the
 * answer pending so a story can sit in the "checking" state.
 */
export function createFakeFetch(initialOk = true) {
  let ok = initialOk;
  let held: Array<() => void> | null = null;
  const calls: string[] = [];
  const fetchFn: ProbeFetch = (url) => {
    calls.push(url);
    const answer = (): ProbeResponse => ({ ok });
    if (held === null) return Promise.resolve(answer());
    const waiting = held;
    return new Promise<ProbeResponse>((resolve) => {
      waiting.push(() => resolve(answer()));
    });
  };
  return Object.assign(fetchFn, {
    calls,
    setOk(next: boolean) {
      ok = next;
    },
    hold() {
      held = [];
    },
    release() {
      const waiting = held ?? [];
      held = null;
      for (const resolve of waiting) resolve();
    },
  });
}

export type FakeNetwork = ReturnType<typeof createFakeNetwork>;

/**
 * The pair a detector story needs. `reachable` is what the probe answers; `interfaceUp` is what
 * the adapter reports. "Offline" with the interface still up is the "Connected, but no internet"
 * case; `setReachable(false)` drops the interface as well.
 */
export function createFakeNetwork(initial: {
  reachable: boolean;
  interfaceUp?: boolean;
}) {
  const adapter = createFakeAdapter(initial.interfaceUp ?? initial.reachable);
  const fetch = createFakeFetch(initial.reachable);
  return {
    adapter: adapter.adapter,
    fetch,
    setReachable(reachable: boolean) {
      fetch.setOk(reachable);
      adapter.setUp(reachable);
    },
    foreground: adapter.foreground,
  };
}

/** Probe settings for stories: one fake URL, and an interval too long to ever fire. */
export const STORY_PROBE = {
  urls: ['https://probe.story.test'],
  timeoutMs: 5000,
  intervalMs: 3_600_000,
};
