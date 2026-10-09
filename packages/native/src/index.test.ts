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
      'Snackbar',
      'createNativeAdapter',
      'createTheme',
      'darkTheme',
      'lightTheme',
      'packageName',
      'useCheckingFeedback',
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
});
