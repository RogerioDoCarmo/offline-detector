import * as api from './index';

describe('@rogeriodocarmo/offline-detector-web', () => {
  it('exports its package name', () => {
    expect(api.packageName).toBe('@rogeriodocarmo/offline-detector-web');
  });

  it('exports exactly the public runtime API', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Banner',
      'FullScreen',
      'Indicator',
      'OfflineTokens',
      'SWIPE_RULES',
      'Snackbar',
      'createWebAdapter',
      'createWebProbeFetch',
      'lockAxis',
      'offlineCss',
      'offlineTokensCss',
      'packageName',
      'shouldDismiss',
      'useReducedMotion',
      'useSettledChecking',
      'useSwipeDismiss',
    ]);
  });

  it('keeps the swipe thresholds at the design values', () => {
    expect(api.SWIPE_RULES).toEqual({
      distanceRatio: 0.3,
      velocity: 0.5,
      axisLockPx: 8,
      exitMs: 150,
    });
  });
});
