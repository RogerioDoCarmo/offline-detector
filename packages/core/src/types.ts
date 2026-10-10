export type OfflineStatus = 'online' | 'offline' | 'unknown';
export type OfflineReason = 'no-interface' | 'no-internet';

export type OfflineState = {
  /** `unknown` only until the first check completes. */
  status: OfflineStatus;
  /** Why the app is offline; `null` unless `status` is `offline`. */
  reason: OfflineReason | null;
  /** True while a check is in flight. */
  checking: boolean;
  /** `now()` when the last check completed. */
  lastChecked: number | null;
  /** `now()` when the app was last seen online. */
  lastOnlineAt: number | null;
};

/** `true` while the status is `unknown`: an app is assumed online until proven otherwise. */
export function isOnline(state: OfflineState): boolean {
  return state.status !== 'offline';
}

/**
 * The seam each platform implements. Core never touches the DOM or React Native; web and
 * native supply an adapter built on `navigator.onLine` / NetInfo / `AppState`.
 */
export interface PlatformAdapter {
  /** Whether the network interface reports being up (a fast hint, not proof of internet). */
  isInterfaceUp(): boolean | Promise<boolean>;
  /** Notify when the interface goes up or down. Returns an unsubscribe function. */
  subscribeInterface(listener: (up: boolean) => void): () => void;
  /** Notify when the app returns to the foreground. Returns an unsubscribe function. */
  subscribeForeground(listener: () => void): () => void;
}

/**
 * The request the probe makes. The resolved value is ignored: any completed response, whatever its
 * status, means the network was reachable. Only a rejection (network error, TLS failure, abort,
 * timeout) means unreachable.
 */
export type ProbeFetch = (
  url: string,
  init: { method: string; signal: AbortSignal; credentials: 'omit' },
) => Promise<unknown>;

export type TimerHandle = unknown;
export type SetTimeoutFn = (callback: () => void, ms: number) => TimerHandle;
export type ClearTimeoutFn = (handle: TimerHandle) => void;

export interface ProbeOptions {
  /** Tried in order; the first success wins. */
  urls?: readonly string[];
  /** Per-URL timeout. Default 5000. */
  timeoutMs?: number;
  /** Re-probe period while online. Default 30000. */
  intervalMs?: number;
  /** Default `HEAD`. */
  method?: 'HEAD' | 'GET';
  /** `interface-only` never calls `fetch`. Default `probe`. */
  mode?: 'probe' | 'interface-only';
}

export type StateListener = (state: OfflineState, previous: OfflineState) => void;

export interface OfflineDetectorOptions {
  adapter: PlatformAdapter;
  probe?: ProbeOptions;
  /**
   * Re-check immediately whenever the adapter reports a foreground return. Off by default: the
   * react layer exposes this as an explicit per-screen hook instead of an always-on behavior.
   */
  recheckOnForeground?: boolean;
  onOffline?: (state: OfflineState) => void;
  onOnline?: (state: OfflineState) => void;
  onChange?: (state: OfflineState, previous: OfflineState) => void;
  /** Receives exceptions thrown by listeners and callbacks. They are otherwise swallowed. */
  onError?: (error: unknown) => void;
  fetch?: ProbeFetch;
  now?: () => number;
  setTimeout?: SetTimeoutFn;
  clearTimeout?: ClearTimeoutFn;
}

export interface OfflineDetectorInstance {
  getState(): OfflineState;
  subscribe(listener: StateListener): () => void;
  start(): void;
  stop(): void;
  checkNow(): Promise<OfflineState>;
}
