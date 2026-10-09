import {
  useCheckingFeedback,
  useNetworkStatus,
  useOfflineDetector,
  useRecheckOnReturn,
} from '@rogeriodocarmo/offline-detector-react';
import * as api from './index';

describe('@rogeriodocarmo/offline-detector-web', () => {
  it('exports its package name', () => {
    expect(api.packageName).toBe('@rogeriodocarmo/offline-detector-web');
  });

  it('exports exactly the public runtime API, and none of the internals', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Banner',
      'FullScreen',
      'Indicator',
      'OfflineDetector',
      'OfflineTokens',
      'Snackbar',
      'createWebAdapter',
      'createWebProbeFetch',
      'offlineCss',
      'offlineTokensCss',
      'packageName',
      'useCheckingFeedback',
      'useNetworkStatus',
      'useOfflineDetector',
      'useRecheckOnReturn',
    ]);
  });

  it('re-exports the react hooks themselves, not copies', () => {
    expect(api.useNetworkStatus).toBe(useNetworkStatus);
    expect(api.useRecheckOnReturn).toBe(useRecheckOnReturn);
    expect(api.useOfflineDetector).toBe(useOfflineDetector);
    expect(api.useCheckingFeedback).toBe(useCheckingFeedback);
  });
});
