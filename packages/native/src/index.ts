export const packageName = '@rogeriodocarmo/offline-detector-native';

export { createNativeAdapter } from './adapter';
export type { AppStateLike, NativeAdapterOptions, NetInfoLike } from './adapter';

export { createTheme, darkTheme, lightTheme } from './theme';
export type { Bezier, OfflineTheme, ShadowStyle } from './theme';
export { useOfflineTheme, useReducedMotion } from './hooks';
export type { Insets } from './insets';
export type { PieceIcons } from './glyphs';

export { OfflineDetector } from './offline-detector';
export type {
  OfflineDetectorProps,
  OfflineDetectorSlot,
  OfflineDetectorSlots,
} from './offline-detector';
export type { Phase, PieceProps } from './piece-types';
export { Snackbar } from './snackbar';
export type { SnackbarProps } from './snackbar';
export { Banner } from './banner';
export type { BannerProps } from './banner';
export { Indicator } from './indicator';
export type { IndicatorProps } from './indicator';
export { FullScreen } from './full-screen';
export type { FullScreenProps } from './full-screen';

// The react API, so an app installs one package.
export {
  useCheckingFeedback,
  useNetworkStatus,
  useOfflineDetector,
  useRecheckOnReturn,
} from '@rogeriodocarmo/offline-detector-react';
export type {
  DismissiblePiece,
  IndicatorPosition,
  Locale,
  OfflineStrings,
  OfflineUiOptions,
  PieceRenderProps,
  RecheckOnReturnOptions,
  UseNetworkStatusResult,
} from '@rogeriodocarmo/offline-detector-react';
export type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
