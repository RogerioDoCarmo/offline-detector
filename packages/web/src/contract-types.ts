/**
 * Local structural copies of the shared UI types.
 *
 * Source of truth: docs/superpowers/specs/2026-10-08-ui-layer-contract.md, section 1 and 2, and
 * docs/design/components.md ("Slots and render props"). `@rogeriodocarmo/offline-detector-react`
 * is written in parallel, so phase 2 replaces this file with imports from it.
 */
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';

export type PieceName = 'snackbar' | 'banner' | 'indicator' | 'fullScreen';
export type DismissiblePiece = Exclude<PieceName, 'fullScreen'>;
export type Locale = 'en' | 'pt-BR' | 'es';
export type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

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
  /** Contains the literal token {status}. */
  indicatorAccessibleName: string;
  fullScreenTitle: string;
  fullScreenBody: string;
  fullScreenRetry: string;
}

export interface DismissOptions {
  dismissible?: boolean;
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: DismissiblePiece): void;
}

export interface OfflineUiOptions extends DismissOptions {
  locale?: string;
  strings?: Partial<OfflineStrings>;
  distinguishReason?: boolean;
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

/** docs/design/components.md, "Slots and render props". `theme` is native-only. */
export interface PieceRenderProps {
  state: OfflineState;
  phase: 'offline' | 'checking' | 'recovered';
  message: string;
  actions: {
    retry: () => Promise<OfflineState>;
    continueOffline?: () => void;
    dismiss?: () => void;
  };
  strings: OfflineStrings;
  theme: unknown;
  visible: boolean;
  rootProps: Record<string, unknown>;
}
