export const packageName = '@rogeriodocarmo/offline-detector-web';

export { createWebAdapter } from './adapter';
export type { WebAdapterEnv } from './adapter';
export { createWebProbeFetch } from './probe-fetch';
export { SWIPE_RULES, lockAxis, shouldDismiss, useSwipeDismiss } from './swipe';
export type {
  Axis,
  DismissKey,
  SwipeDismissProps,
  UseSwipeDismissResult,
  UseSwipeDismissOptions,
} from './swipe';
export { OfflineTokens, offlineCss, offlineTokensCss } from './tokens';
export type { OfflineTokensProps } from './tokens';
export { useReducedMotion, useSettledChecking } from './hooks';
export { OfflineDetector } from './offline-detector';
export type { OfflineDetectorProps, OfflineDetectorSlots } from './offline-detector';
export { Snackbar } from './snackbar';
export type { SnackbarProps } from './snackbar';
export { Banner } from './banner';
export type { BannerProps } from './banner';
export { Indicator } from './indicator';
export type { IndicatorProps } from './indicator';
export { FullScreen } from './fullscreen';
export type { Motion, Phase, PieceIcons, PieceProps } from './piece-types';
