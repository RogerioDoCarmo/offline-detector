import { I18nManager, Platform, StatusBar } from 'react-native';
import { defaultInsets, inlineInsets, resolveInsets } from './insets';

afterEach(() => jest.restoreAllMocks());

function withPlatform(os: 'ios' | 'android', run: () => void) {
  const original = Platform.OS;
  Platform.OS = os;
  try {
    run();
  } finally {
    Platform.OS = original;
  }
}

describe('defaultInsets', () => {
  it('uses the Android status bar height on top', () => {
    jest.replaceProperty(StatusBar, 'currentHeight', 24);
    withPlatform('android', () => {
      expect(defaultInsets()).toEqual({ top: 24, right: 0, bottom: 0, left: 0 });
    });
  });

  it('uses zero on Android when the height is unknown', () => {
    jest.replaceProperty(StatusBar, 'currentHeight', undefined);
    withPlatform('android', () => {
      expect(defaultInsets().top).toBe(0);
    });
  });

  it('is all zero on iOS, where the host passes insets', () => {
    withPlatform('ios', () => {
      expect(defaultInsets()).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    });
  });
});

describe('resolveInsets', () => {
  it('overrides only the given sides', () => {
    withPlatform('ios', () => {
      expect(resolveInsets({ bottom: 34 })).toEqual({
        top: 0,
        right: 0,
        bottom: 34,
        left: 0,
      });
    });
  });
});

describe('inlineInsets', () => {
  const insets = { top: 0, right: 10, bottom: 0, left: 44 };

  it('maps left to start in left-to-right layouts', () => {
    expect(inlineInsets(insets)).toEqual({ start: 44, end: 10 });
  });

  it('maps right to start in right-to-left layouts', () => {
    jest.replaceProperty(I18nManager, 'isRTL', true);
    expect(inlineInsets(insets)).toEqual({ start: 10, end: 44 });
  });
});
