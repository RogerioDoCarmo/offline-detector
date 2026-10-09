export const packageName = '@rogeriodocarmo/offline-detector-web';

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

export { createWebAdapter } from './adapter';
export type { WebAdapterEnv } from './adapter';
export { createWebProbeFetch } from './probe-fetch';
export { OfflineTokens, offlineCss, offlineTokensCss } from './tokens';
export type { OfflineTokensProps } from './tokens';

// The react API, so a web app installs one package. The same list is re-exported by the native
// package.
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
