export const packageName = '@rogeriodocarmo/offline-detector-core';

export { createOfflineDetector, DEFAULT_PROBE_URLS } from './detector';
export { isOnline } from './types';
export type {
  ClearTimeoutFn,
  OfflineDetectorInstance,
  OfflineDetectorOptions,
  OfflineReason,
  OfflineState,
  OfflineStatus,
  PlatformAdapter,
  ProbeFetch,
  ProbeOptions,
  SetTimeoutFn,
  StateListener,
  TimerHandle,
} from './types';
