export const packageName = '@rogeriodocarmo/offline-detector-core';

export { createOfflineDetector, DEFAULT_PROBE_URLS } from './detector';
export { isOnline } from './types';
export type {
  ClearTimeoutFn,
  OfflineDetector,
  OfflineDetectorOptions,
  OfflineReason,
  OfflineState,
  OfflineStatus,
  PlatformAdapter,
  ProbeFetch,
  ProbeOptions,
  ProbeResponse,
  SetTimeoutFn,
  StateListener,
  TimerHandle,
} from './types';
