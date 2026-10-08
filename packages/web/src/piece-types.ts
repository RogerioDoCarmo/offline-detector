import type { CSSProperties, ReactNode } from 'react';
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import type { OfflineStrings, PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';

export type Phase = PieceRenderProps['phase'];
export type Motion = 'auto' | 'reduced' | 'full';

export interface PieceIcons {
  offline?: ReactNode;
  online?: ReactNode;
  checking?: ReactNode;
}

/**
 * Props every piece accepts. The first group is the `PieceRenderProps` contract (docs/design,
 * "Slots and render props"), so a slot can forward its props straight to a bundled piece; the
 * rest are web-only extras. `actions.dismiss` present means "dismissible".
 */
export interface PieceProps {
  /** What the piece should show now. */
  phase: Phase;
  /** Already localised and reason-aware. */
  message: string;
  strings: OfflineStrings;
  /** Accepted for parity with `PieceRenderProps`; the pieces are driven by `phase`. */
  state?: OfflineState;
  actions?: {
    /** Returns whatever the provider's `retry` returns (a promise of the new state); ignored. */
    retry?: () => unknown;
    continueOffline?: () => void;
    dismiss?: () => void;
  };
  /** False during the exit window: the piece plays its exit animation and ignores input. */
  visible?: boolean;
  /** Role / live-region / dir props from the provider; they win over the piece's defaults. */
  rootProps?: Record<string, unknown>;
  /** Native-only in the contract; ignored on the web, where tokens are inherited CSS variables. */
  theme?: unknown;

  /**
   * Whether this piece owns the screen reader announcement of the transition. Default true.
   * When false it renders without a live role (see docs/design/accessibility.md, section 1).
   */
  announce?: boolean;
  /** `auto` follows `prefers-reduced-motion`; default `auto`. */
  motion?: Motion;
  className?: string;
  style?: CSSProperties;
  icons?: PieceIcons;
  /** Pending time before the checking visual appears. Default 150; 0 for a user-pressed Retry. */
  checkingDelayMs?: number;
  /** Minimum time the checking visual stays once shown. Default 400. */
  checkingMinMs?: number;
}

export const CHECKING_DELAY_MS = 150;
export const CHECKING_MIN_MS = 400;
