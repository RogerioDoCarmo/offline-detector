/**
 * Structural copies of the shared UI types from section 2 of
 * docs/superpowers/specs/2026-10-08-ui-layer-contract.md. They are declared locally because
 * @rogeriodocarmo/offline-detector-react is being written in parallel; phase 2 replaces this file
 * with imports from that package. Keep them identical to the contract.
 */
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import type { OfflineTheme } from './theme';

export type PieceName = 'snackbar' | 'banner' | 'indicator' | 'fullScreen';
export type DismissiblePiece = Exclude<PieceName, 'fullScreen'>;
export type Locale = 'en' | 'pt-BR' | 'es';

export interface DismissOptions {
  dismissible?: boolean; // global, default true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: DismissiblePiece): void;
}

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
  indicatorAccessibleName: string; // contains the literal token {status}
  fullScreenTitle: string;
  fullScreenBody: string;
  fullScreenRetry: string;
}

export type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

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

/** The phase a piece should show now (docs/design/components.md, "Slots and render props"). */
export type PiecePhase = 'offline' | 'checking' | 'recovered';

export type PieceRenderProps = {
  state: OfflineState;
  phase: PiecePhase;
  message: string;
  actions: {
    retry: () => Promise<OfflineState>;
    continueOffline?: () => void;
    dismiss?: () => void;
  };
  strings: OfflineStrings;
  theme: OfflineTheme;
  visible: boolean;
  rootProps: Record<string, unknown>;
};
