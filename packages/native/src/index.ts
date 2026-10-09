export const packageName = '@rogeriodocarmo/offline-detector-native';

export { createNativeAdapter } from './adapter';
export type { AppStateLike, NativeAdapterOptions, NetInfoLike } from './adapter';

export { useSwipeDismiss } from './use-swipe-dismiss';
export type { UseSwipeDismissOptions } from './use-swipe-dismiss';

export { createTheme, darkTheme, lightTheme } from './theme';
export type { Bezier, OfflineTheme, ShadowStyle } from './theme';
export { useOfflineTheme, useReducedMotion } from './hooks';

export { defaultInsets } from './insets';
export type { Insets } from './insets';
export type { PieceIcons } from './glyphs';

export { Snackbar } from './snackbar';
export type { SnackbarProps } from './snackbar';
export { Banner } from './banner';
export type { BannerProps } from './banner';
export { Indicator } from './indicator';
export type { IndicatorProps } from './indicator';
export { OfflineDetector } from './offline-detector';
export type {
  OfflineDetectorProps,
  OfflineDetectorSlot,
  OfflineDetectorSlots,
} from './offline-detector';
export { FullScreen, hostContentAccessibilityProps } from './full-screen';
export type { FullScreenProps } from './full-screen';
