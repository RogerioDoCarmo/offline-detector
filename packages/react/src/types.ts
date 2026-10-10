import type {
  OfflineDetectorInstance,
  OfflineState,
  PlatformAdapter,
  ProbeFetch,
  ProbeOptions,
} from '@rogeriodocarmo/offline-detector-core';
import type { ReactNode } from 'react';

/** The four UI pieces. */
export type PieceName = 'snackbar' | 'banner' | 'indicator' | 'fullScreen';

/** The pieces that can be swiped away. The full-screen state has its own "Continue offline". */
export type DismissiblePiece = Exclude<PieceName, 'fullScreen'>;

/** The bundled locales. */
export type Locale = 'en' | 'pt-BR' | 'es';

export type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface OfflineDetectorProviderProps {
  /** The platform seam (`createWebAdapter()` or `createNativeAdapter()`). Read once per mount. */
  adapter: PlatformAdapter;
  /** Probe settings. Read once per mount. */
  probe?: ProbeOptions;
  /** Fires when the status becomes `offline`, including when the first result is offline. */
  onOffline?(state: OfflineState): void;
  /** Fires when the status goes from `offline` back to `online`. */
  onOnline?(state: OfflineState): void;
  /** Fires on every status change, including the first result. */
  onChange?(state: OfflineState, previous: OfflineState): void;
  /** Receives exceptions thrown by listeners and callbacks. */
  onError?(error: unknown): void;
  /** Probe transport (web wraps `fetch` with `no-cors`). Read once per mount. */
  fetch?: ProbeFetch;
  /** SSR hint: what the first render assumes. Default: the detector's own `unknown` state. */
  initialStatus?: 'online' | 'offline';
  /**
   * Test seam: use this detector instead of creating one. The provider still starts and stops it,
   * but the callback props are not wired to it (they belong to the detector the provider builds).
   */
  detector?: OfflineDetectorInstance;
  children: ReactNode;
}

export type UseNetworkStatusResult = OfflineState & {
  /** `true` while `status` is `unknown`: an app is assumed online until proven otherwise. */
  isOnline: boolean;
  /** Forces a check now. Concurrent calls share one probe. */
  checkNow(): Promise<OfflineState>;
};

export interface RecheckOnReturnOptions {
  /**
   * `'brief'` asks the UI layer to show a "Checking" state while the return-triggered check is
   * pending; `'none'` (default) shows nothing.
   */
  checkingFeedback?: 'brief' | 'none';
  /** Called with the outcome of each return-triggered check. */
  onResult?(isOnline: boolean): void;
}

export interface DismissOptions {
  /** Global switch. Default `true`. */
  dismissible?: boolean;
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  /** Called once when the user dismisses a piece. */
  onDismiss?(piece: DismissiblePiece): void;
}

/** Every user-facing string. See `docs/design/strings.md`. */
export interface OfflineStrings {
  offline: string;
  offlineNoInterface: string;
  offlineNoInternet: string;
  online: string;
  retry: string;
  checking: string;
  continueOffline: string;
  dismiss: string;
  dismissHint: string;
  indicatorLabelOnline: string;
  indicatorLabelOffline: string;
  indicatorLabelChecking: string;
  /** Contains the literal token `{status}`, replaced by the matching `indicatorLabel*`. */
  indicatorAccessibleName: string;
  fullScreenTitle: string;
  fullScreenBody: string;
  fullScreenRetry: string;
}

/** Options shared by the web and native `OfflineDetector` wrappers. */
export interface OfflineUiOptions extends DismissOptions {
  /** Overrides the host locale. Any string is accepted; see `resolveLocale`. */
  locale?: string;
  /** Partial copy overrides merged over the locale. */
  strings?: Partial<OfflineStrings>;
  /** Say "no network connection" vs "connected, but no internet". Default `false`. */
  distinguishReason?: boolean;
  /** Full-screen state; `{ continueOffline: true }` adds the escape hatch. Default off. */
  fullScreen?: boolean | { continueOffline?: boolean };
  indicator?: {
    position?: IndicatorPosition;
    variant?: 'chip' | 'dot';
    dismissible?: boolean;
  };
  banner?: { position?: 'top' | 'bottom'; overlay?: boolean; dismissible?: boolean };
  snackbar?: { dismissible?: boolean };
  motion?: 'auto' | 'reduced' | 'full';
  colorScheme?: 'auto' | 'light' | 'dark';
}

/**
 * What every piece (and every replacement slot) receives. Exactly the contract in
 * `docs/design/components.md`, "Slots and render props".
 *
 * `Theme` is a type parameter because the theme object is a native concept: web inherits CSS
 * variables, so it leaves the default (`unknown`).
 */
export interface PieceRenderProps<Theme = unknown> {
  /** status, reason, checking, lastChecked, lastOnlineAt. */
  state: OfflineState;
  /** What the piece should show now. */
  phase: 'offline' | 'checking' | 'recovered';
  /** Already localised, already reason-aware. */
  message: string;
  actions: {
    /** Wraps `checkNow` and drives the checking phase. */
    retry: () => Promise<OfflineState>;
    /** Only when the full-screen state opted in. */
    continueOffline?: () => void;
    /** Present unless `dismissible` is false for this piece. */
    dismiss?: () => void;
  };
  /** Every string, for custom layouts. */
  strings: OfflineStrings;
  /** Native theme object; on web, tokens are inherited CSS variables. */
  theme: Theme;
  /** `false` during the exit animation window. */
  visible: boolean;
  /** Role, aria-live, testID, dir: spread on your root element. */
  rootProps: Record<string, unknown>;
}
