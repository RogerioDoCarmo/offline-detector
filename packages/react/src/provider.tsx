import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import { createOfflineDetector, isOnline } from '@rogeriodocarmo/offline-detector-core';
import type {
  OfflineDetectorInstance,
  OfflineState,
} from '@rogeriodocarmo/offline-detector-core';
import { CoreContext, useCore } from './context';
import type { FeedbackRegistry, ProviderCore } from './context';
import type { OfflineDetectorProviderProps, UseNetworkStatusResult } from './types';

function createFeedbackRegistry(): FeedbackRegistry {
  let pending = 0;
  const listeners: Set<() => void> = new Set();
  const notify = () => {
    for (const listener of [...listeners]) listener();
  };
  return {
    begin() {
      pending++;
      notify();
      let ended = false;
      return () => {
        if (ended) return;
        ended = true;
        pending--;
        notify();
      };
    },
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    getSnapshot: () => (pending > 0 ? 'brief' : 'none'),
  };
}

/** What the first render assumes when the host passes `initialStatus`. */
function hintState(status: 'online' | 'offline'): OfflineState {
  return {
    status,
    reason: status === 'offline' ? 'no-internet' : null,
    checking: false,
    lastChecked: null,
    lastOnlineAt: null,
  };
}

function createCore(props: OfflineDetectorProviderProps): ProviderCore {
  const latest = { current: props };
  const reportError = (error: unknown) => latest.current.onError?.(error);

  // Callbacks are forwarded through `latest`, so a new function prop never restarts anything.
  const detector: OfflineDetectorInstance =
    props.detector ??
    createOfflineDetector({
      adapter: props.adapter,
      probe: props.probe,
      fetch: props.fetch,
      onOffline: (state) => latest.current.onOffline?.(state),
      onOnline: (state) => latest.current.onOnline?.(state),
      onChange: (state, previous) => latest.current.onChange?.(state, previous),
      onError: reportError,
    });

  const hint = props.initialStatus ? hintState(props.initialStatus) : null;
  const serverSnapshot = hint ?? detector.getState();

  return {
    detector,
    adapter: props.adapter,
    latest,
    lifecycle: { stopPending: false },
    reportError,
    feedback: createFeedbackRegistry(),
    checkNow: () => detector.checkNow(),
    store: {
      subscribe: (onChange) => detector.subscribe(() => onChange()),
      // The hint stands in only until the first real result, so the UI does not flip to unknown.
      getSnapshot: () => {
        const state = detector.getState();
        return hint !== null && state.status === 'unknown' ? hint : state;
      },
      getServerSnapshot: () => serverSnapshot,
    },
  };
}

/**
 * Owns one detector per mount. Starts it in an effect (never during render, so SSR and hydration
 * are untouched) and stops it on unmount. `adapter`, `probe`, `fetch` and `detector` are read
 * once; the callback props are always the latest.
 */
export function OfflineDetectorProvider(
  props: OfflineDetectorProviderProps,
): ReactElement {
  const [core] = useState(() => createCore(props));

  // Declared before the start effect so the first check already sees the current callbacks.
  useEffect(() => {
    core.latest.current = props;
  });

  useEffect(() => {
    // StrictMode runs setup, cleanup, setup on the same instance. The stop is deferred one
    // microtask and cancelled by the immediate re-setup, so the detector sees exactly one start.
    const lifecycle = core.lifecycle;
    if (lifecycle.stopPending) {
      lifecycle.stopPending = false;
    } else {
      core.detector.start();
    }
    return () => {
      lifecycle.stopPending = true;
      void Promise.resolve().then(() => {
        if (!lifecycle.stopPending) return;
        lifecycle.stopPending = false;
        core.detector.stop();
      });
    };
  }, [core]);

  return <CoreContext.Provider value={core}>{props.children}</CoreContext.Provider>;
}

/** The current state plus `isOnline` and `checkNow`. Re-renders on every state change. */
export function useNetworkStatus(): UseNetworkStatusResult {
  const core = useCore('useNetworkStatus');
  const state = useSyncExternalStore(
    core.store.subscribe,
    core.store.getSnapshot,
    core.store.getServerSnapshot,
  );
  return useMemo(
    () => ({ ...state, isOnline: isOnline(state), checkNow: core.checkNow }),
    [state, core],
  );
}

/** The underlying core detector, for advanced use. */
export function useOfflineDetector(): OfflineDetectorInstance {
  return useCore('useOfflineDetector').detector;
}
