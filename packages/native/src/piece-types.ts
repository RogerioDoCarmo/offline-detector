import type { StyleProp, ViewStyle } from 'react-native';
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import type {
  OfflineStrings,
  PieceRenderProps,
} from '@rogeriodocarmo/offline-detector-react';
import type { PieceIcons } from './glyphs';
import type { Insets } from './insets';
import type { OfflineTheme } from './theme';

/** The phase a piece should show now (docs/design/components.md, "Slots and render props"). */
export type Phase = PieceRenderProps['phase'];

/**
 * Props every piece accepts: the same shape as the web pieces. The first group is the
 * `PieceRenderProps` contract, so a slot can forward its props straight to a bundled piece; the
 * rest are native-only extras. `actions.dismiss` present means "dismissible".
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
  /** False plays the exit animation and then renders nothing. Default true. */
  visible?: boolean;
  /** Props from the provider (test id, live region); they win over the piece's defaults. */
  rootProps?: Record<string, unknown>;
  theme?: OfflineTheme;

  /**
   * True when this piece owns the screen reader announcement of the transition. Default true.
   * When false it renders without a live region (docs/design/accessibility.md, section 1).
   */
  announce?: boolean;
  reduceMotion?: boolean;
  insets?: Partial<Insets>;
  icons?: PieceIcons;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
