export const packageName = '@rogeriodocarmo/offline-detector-react';

export {
  OfflineDetectorProvider,
  useNetworkStatus,
  useOfflineDetector,
} from './provider';
export { useCheckingFeedback, useRecheckOnReturn } from './recheck';
export { resolveDismissible, useDismissals } from './dismissal';
export {
  indicatorName,
  offlineMessage,
  resolveLocale,
  resolveStrings,
  STRINGS,
} from './strings';
export type {
  DismissiblePiece,
  DismissOptions,
  IndicatorPosition,
  Locale,
  OfflineDetectorProviderProps,
  OfflineStrings,
  OfflineUiOptions,
  PieceName,
  PieceRenderProps,
  RecheckOnReturnOptions,
  UseNetworkStatusResult,
} from './types';
