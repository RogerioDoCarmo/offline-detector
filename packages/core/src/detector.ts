import { probeAny } from './probe';
import type {
  ClearTimeoutFn,
  OfflineDetector,
  OfflineDetectorOptions,
  OfflineReason,
  OfflineState,
  OfflineStatus,
  ProbeFetch,
  SetTimeoutFn,
  StateListener,
} from './types';

export const DEFAULT_PROBE_URLS: readonly string[] = [
  'https://cp.cloudflare.com/generate_204',
  'https://www.gstatic.com/generate_204',
];
const DEFAULT_TIMEOUT_MS = 5000;

function sameState(a: OfflineState, b: OfflineState): boolean {
  return (
    a.status === b.status &&
    a.reason === b.reason &&
    a.checking === b.checking &&
    a.lastChecked === b.lastChecked &&
    a.lastOnlineAt === b.lastOnlineAt
  );
}

function resolveFetch(options: OfflineDetectorOptions, probing: boolean): ProbeFetch {
  if (options.fetch) return options.fetch;
  if (typeof globalThis.fetch === 'function') {
    return (url, init) => globalThis.fetch(url, init);
  }
  if (probing)
    throw new TypeError('offline-detector: no fetch available; pass options.fetch');
  return () => Promise.reject(new Error('unreachable: interface-only mode never probes'));
}

export function createOfflineDetector(options: OfflineDetectorOptions): OfflineDetector {
  const { adapter } = options;
  const probeOptions = options.probe ?? {};
  const urls = probeOptions.urls ?? DEFAULT_PROBE_URLS;
  const timeoutMs = probeOptions.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const method = probeOptions.method ?? 'HEAD';
  const interfaceOnly = probeOptions.mode === 'interface-only';

  if (!interfaceOnly && urls.length === 0) {
    throw new RangeError('offline-detector: probe.urls must contain at least one URL');
  }
  const fetchFn = resolveFetch(options, !interfaceOnly);
  const now = options.now ?? Date.now;
  const setTimer: SetTimeoutFn = options.setTimeout ?? ((cb, ms) => setTimeout(cb, ms));
  const clearTimer: ClearTimeoutFn =
    options.clearTimeout ??
    ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));

  let state: OfflineState = {
    status: 'unknown',
    reason: null,
    checking: false,
    lastChecked: null,
    lastOnlineAt: null,
  };
  const listeners: Set<StateListener> = new Set();
  // Bumped whenever an interface event or stop() overtakes whatever check is in flight.
  // eslint-disable-next-line prefer-const -- reassigned once stop() and interface events land
  let epoch = 0;
  let inflight: { epoch: number; promise: Promise<OfflineState> } | null = null;

  function guard(fn: () => void): void {
    try {
      fn();
    } catch (error) {
      options.onError?.(error);
    }
  }

  function commit(next: OfflineState): void {
    const previous = state;
    if (sameState(previous, next)) return;
    state = next;
    for (const listener of [...listeners]) guard(() => listener(next, previous));
    if (previous.status === next.status) return;
    guard(() => options.onChange?.(next, previous));
    if (next.status === 'offline') {
      guard(() => options.onOffline?.(next));
    } else if (previous.status === 'offline') {
      guard(() => options.onOnline?.(next));
    }
  }

  function applyResult(status: OfflineStatus, reason: OfflineReason | null): void {
    const at = now();
    commit({
      status,
      reason,
      checking: false,
      lastChecked: at,
      lastOnlineAt: status === 'online' ? at : state.lastOnlineAt,
    });
  }

  async function readInterface(): Promise<boolean> {
    try {
      return await adapter.isInterfaceUp();
    } catch {
      return true;
    }
  }

  async function runCheck(): Promise<OfflineState> {
    const myEpoch = epoch;
    commit({ ...state, checking: true });
    const interfaceUp = await readInterface();
    if (myEpoch !== epoch) return state;
    if (!interfaceUp) {
      applyResult('offline', 'no-interface');
      return state;
    }
    if (interfaceOnly) {
      applyResult('online', null);
      return state;
    }
    const reachable = await probeAny(urls, {
      fetch: fetchFn,
      method,
      timeoutMs,
      setTimeout: setTimer,
      clearTimeout: clearTimer,
    });
    if (myEpoch !== epoch) return state;
    if (reachable) applyResult('online', null);
    else applyResult('offline', 'no-internet');
    return state;
  }

  function checkNow(): Promise<OfflineState> {
    if (inflight && inflight.epoch === epoch) return inflight.promise;
    const promise: Promise<OfflineState> = runCheck().finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
    inflight = { epoch, promise };
    return promise;
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    checkNow,
    start() {
      throw new Error('not implemented');
    },
    stop() {
      throw new Error('not implemented');
    },
  };
}
