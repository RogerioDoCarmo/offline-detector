import { createContext, useContext } from 'react';
import type {
  OfflineDetector,
  OfflineState,
  PlatformAdapter,
} from '@rogeriodocarmo/offline-detector-core';
import type { OfflineDetectorProviderProps } from './types';

/** Read-only view of the detector's state, shaped for `useSyncExternalStore`. */
export interface StateStore {
  subscribe(onChange: () => void): () => void;
  getSnapshot(): OfflineState;
  getServerSnapshot(): OfflineState;
}

/** Counts return-triggered checks that asked for a visible "checking" state. */
export interface FeedbackRegistry {
  /** Marks one check as pending. The returned function ends it; calling it again is a no-op. */
  begin(): () => void;
  subscribe(onChange: () => void): () => void;
  getSnapshot(): 'brief' | 'none';
}

/**
 * Everything the hooks need from the provider. Internal: this context is deliberately not
 * exported from the package, so the adapter stays an implementation detail of the provider.
 */
export interface ProviderCore {
  detector: OfflineDetector;
  adapter: PlatformAdapter;
  store: StateStore;
  feedback: FeedbackRegistry;
  checkNow(): Promise<OfflineState>;
  reportError(error: unknown): void;
  /** Start/stop bookkeeping that survives StrictMode's setup, cleanup, setup. */
  lifecycle: { stopPending: boolean };
  /** The latest props, so callbacks are read through here and never captured. */
  latest: { current: OfflineDetectorProviderProps };
}

export const CoreContext = createContext(null as ProviderCore | null);

export function useCore(hookName: string): ProviderCore {
  const core = useContext(CoreContext);
  if (core === null) {
    throw new Error(`${hookName} must be used inside <OfflineDetectorProvider>.`);
  }
  return core;
}
