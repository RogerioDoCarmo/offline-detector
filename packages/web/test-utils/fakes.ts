import type { PlatformAdapter, ProbeFetch } from '@rogeriodocarmo/offline-detector-core';

/** An in-memory adapter the tests drive by hand. */
export function createFakeAdapter(initialUp = true) {
  let up = initialUp;
  const interfaceListeners: Set<(up: boolean) => void> = new Set();
  const foregroundListeners: Set<() => void> = new Set();
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
    interfaceListenerCount: () => interfaceListeners.size,
    foregroundListenerCount: () => foregroundListeners.size,
  };
}

/** A probe fetch that succeeds or fails on demand; `hold()` keeps calls pending. */
export function createFakeFetch() {
  let ok = true;
  let held: (() => void)[] | null = null;
  const calls: string[] = [];
  const fetchFn: ProbeFetch = (url) => {
    calls.push(url);
    const outcome = () => ({ ok });
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
