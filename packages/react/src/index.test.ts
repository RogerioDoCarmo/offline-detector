import * as api from './index';
import { packageName } from './index';

describe('@rogeriodocarmo/offline-detector-react', () => {
  it('exports its package name', () => {
    expect(packageName).toBe('@rogeriodocarmo/offline-detector-react');
  });

  it('exports exactly the public runtime API (the internal context stays private)', () => {
    expect(Object.keys(api).sort()).toEqual([
      'OfflineDetectorProvider',
      'STRINGS',
      'indicatorName',
      'offlineMessage',
      'packageName',
      'resolveDismissible',
      'resolveLocale',
      'resolveStrings',
      'useCheckingFeedback',
      'useDismissals',
      'useNetworkStatus',
      'useOfflineDetector',
      'useRecheckOnReturn',
    ]);
  });
});
