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
      'Snackbar',
      'createNativeAdapter',
      'createTheme',
      'darkTheme',
      'defaultInsets',
      'hostContentAccessibilityProps',
      'lightTheme',
      'packageName',
      'useOfflineTheme',
      'useReducedMotion',
      'useSwipeDismiss',
    ]);
  });
});
