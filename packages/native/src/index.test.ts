import * as react from '@rogeriodocarmo/offline-detector-react';
import * as api from './index';

describe('@rogeriodocarmo/offline-detector-native', () => {
  it('exports its package name', () => {
    expect(api.packageName).toBe('@rogeriodocarmo/offline-detector-native');
  });

  it('exports exactly the public runtime API', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Banner',
      'FullScreen',
      'Indicator',
      'OfflineDetector',
      'STRINGS',
      'Snackbar',
      'createNativeAdapter',
      'createTheme',
      'darkTheme',
      'indicatorName',
      'lightTheme',
      'offlineMessage',
      'packageName',
      'resolveDismissible',
      'resolveLocale',
      'resolveStrings',
      'useCheckingFeedback',
      'useDismissals',
      'useNetworkStatus',
      'useOfflineDetector',
      'useOfflineTheme',
      'useRecheckOnReturn',
      'useReducedMotion',
    ]);
  });

  it.each([
    'useSwipeDismiss',
    'defaultInsets',
    'hostContentAccessibilityProps',
    'SWIPE_DISTANCE_RATIO',
    'SWIPE_VELOCITY',
    'SWIPE_AXIS_LOCK',
    'useSettledChecking',
    'resolveInsets',
    'usePieceTransition',
  ])('keeps the internal %s private', (name) => {
    expect(name in api).toBe(false);
  });

  it.each([
    'STRINGS',
    'indicatorName',
    'offlineMessage',
    'resolveDismissible',
    'resolveLocale',
    'resolveStrings',
    'useDismissals',
  ])('re-exports the react helper %s itself, so one package is enough', (name) => {
    expect((api as Record<string, unknown>)[name]).toBe(
      (react as Record<string, unknown>)[name],
    );
  });
});
