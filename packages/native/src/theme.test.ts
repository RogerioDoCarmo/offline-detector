import { createTheme, darkTheme, lightTheme } from './theme';

describe('lightTheme', () => {
  it('has the light colour roles from tokens.md', () => {
    expect({
      colorSurface: lightTheme.colorSurface,
      colorSurfaceRaised: lightTheme.colorSurfaceRaised,
      colorSurfaceInverse: lightTheme.colorSurfaceInverse,
      colorText: lightTheme.colorText,
      colorTextMuted: lightTheme.colorTextMuted,
      colorTextInverse: lightTheme.colorTextInverse,
      colorTextMutedInverse: lightTheme.colorTextMutedInverse,
      colorBorder: lightTheme.colorBorder,
      colorBorderSubtle: lightTheme.colorBorderSubtle,
      colorStatusOffline: lightTheme.colorStatusOffline,
      colorStatusOfflineSubtle: lightTheme.colorStatusOfflineSubtle,
      colorStatusOnline: lightTheme.colorStatusOnline,
      colorStatusChecking: lightTheme.colorStatusChecking,
      colorAction: lightTheme.colorAction,
      colorOnAction: lightTheme.colorOnAction,
      colorActionInverse: lightTheme.colorActionInverse,
      colorFocusRing: lightTheme.colorFocusRing,
      colorScrim: lightTheme.colorScrim,
    }).toEqual({
      colorSurface: '#ffffff',
      colorSurfaceRaised: '#f4f5f7',
      colorSurfaceInverse: '#1f2328',
      colorText: '#1b1f23',
      colorTextMuted: '#545b64',
      colorTextInverse: '#ffffff',
      colorTextMutedInverse: '#c4c9d0',
      colorBorder: '#80878f',
      colorBorderSubtle: '#d9dce1',
      colorStatusOffline: '#b3261e',
      colorStatusOfflineSubtle: '#fdecea',
      colorStatusOnline: '#1a7f37',
      colorStatusChecking: '#8a5a00',
      colorAction: '#0b5fd1',
      colorOnAction: '#ffffff',
      colorActionInverse: '#8ab4ff',
      colorFocusRing: '#0b5fd1',
      colorScrim: 'rgba(0, 0, 0, 0.4)',
    });
  });
});

describe('darkTheme', () => {
  it('has the dark colour roles from tokens.md', () => {
    expect({
      colorSurface: darkTheme.colorSurface,
      colorSurfaceRaised: darkTheme.colorSurfaceRaised,
      colorSurfaceInverse: darkTheme.colorSurfaceInverse,
      colorText: darkTheme.colorText,
      colorTextMuted: darkTheme.colorTextMuted,
      colorTextInverse: darkTheme.colorTextInverse,
      colorTextMutedInverse: darkTheme.colorTextMutedInverse,
      colorBorder: darkTheme.colorBorder,
      colorBorderSubtle: darkTheme.colorBorderSubtle,
      colorStatusOffline: darkTheme.colorStatusOffline,
      colorStatusOfflineSubtle: darkTheme.colorStatusOfflineSubtle,
      colorStatusOnline: darkTheme.colorStatusOnline,
      colorStatusChecking: darkTheme.colorStatusChecking,
      colorAction: darkTheme.colorAction,
      colorOnAction: darkTheme.colorOnAction,
      colorActionInverse: darkTheme.colorActionInverse,
      colorFocusRing: darkTheme.colorFocusRing,
      colorScrim: darkTheme.colorScrim,
    }).toEqual({
      colorSurface: '#1c1c1e',
      colorSurfaceRaised: '#2c2c2e',
      colorSurfaceInverse: '#f2f3f5',
      colorText: '#f2f3f5',
      colorTextMuted: '#a8aeb7',
      colorTextInverse: '#1b1f23',
      colorTextMutedInverse: '#4a5058',
      colorBorder: '#8a9099',
      colorBorderSubtle: '#3a3a3c',
      colorStatusOffline: '#ff8a80',
      colorStatusOfflineSubtle: '#4a1f1c',
      colorStatusOnline: '#4cc38a',
      colorStatusChecking: '#f0b429',
      colorAction: '#8ab4ff',
      colorOnAction: '#0b1b33',
      colorActionInverse: '#0b5fd1',
      colorFocusRing: '#8ab4ff',
      colorScrim: 'rgba(0, 0, 0, 0.6)',
    });
  });
});

describe('scheme-independent tokens', () => {
  it.each([
    ['light', lightTheme],
    ['dark', darkTheme],
  ])(
    '%s theme carries spacing, radius, type, size, motion and layering',
    (_name, theme) => {
      const {
        spaceXs,
        spaceSm,
        spaceMd,
        spaceLg,
        spaceXl,
        space2xl,
        radiusSm,
        radiusMd,
        radiusLg,
        radiusFull,
      } = theme;
      expect([spaceXs, spaceSm, spaceMd, spaceLg, spaceXl, space2xl]).toEqual([
        4, 8, 12, 16, 24, 32,
      ]);
      expect([radiusSm, radiusMd, radiusLg, radiusFull]).toEqual([4, 8, 12, 999]);
      expect(theme.fontFamily).toBeUndefined();
      expect([
        theme.fontSizeLabel,
        theme.fontSizeBody,
        theme.fontSizeTitle,
        theme.fontSizeHeadline,
      ]).toEqual([12, 14, 16, 22]);
      expect([
        theme.lineHeightLabel,
        theme.lineHeightBody,
        theme.lineHeightTitle,
        theme.lineHeightHeadline,
      ]).toEqual([16, 20, 24, 28]);
      expect([
        theme.fontWeightRegular,
        theme.fontWeightMedium,
        theme.fontWeightSemibold,
      ]).toEqual(['400', '500', '600']);
      expect([
        theme.sizeTouchTarget,
        theme.sizeIndicatorDot,
        theme.sizeIcon,
        theme.sizeSnackbarMinHeight,
        theme.sizeSnackbarMaxWidth,
        theme.sizeFullscreenMeasure,
        theme.focusRingWidth,
      ]).toEqual([44, 14, 20, 48, 560, 320, 2]);
      expect([
        theme.durationFast,
        theme.durationBase,
        theme.durationSlow,
        theme.durationExit,
        theme.durationPulse,
      ]).toEqual([120, 200, 320, 150, 1200]);
      expect(theme.easeOut).toEqual([0.16, 1, 0.3, 1]);
      expect(theme.easeIn).toEqual([0.7, 0, 0.84, 0]);
      expect(theme.easeStandard).toEqual([0.4, 0, 0.2, 1]);
      expect([
        theme.zBanner,
        theme.zIndicator,
        theme.zSnackbar,
        theme.zFullscreen,
      ]).toEqual([1000, 1010, 1020, 1100]);
      expect(theme.shadowChip).toEqual({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
      });
      expect(theme.shadowSnackbar).toEqual({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.24,
        shadowRadius: 8,
        elevation: 6,
      });
    },
  );
});

describe('createTheme', () => {
  it('defaults to the light theme', () => {
    expect(createTheme()).toEqual(lightTheme);
  });

  it('selects the dark theme', () => {
    expect(createTheme(undefined, 'dark').colorSurface).toBe('#1c1c1e');
  });

  it('merges overrides over the chosen scheme', () => {
    const theme = createTheme({ colorAction: '#ff0000', spaceLg: 20 }, 'dark');
    expect(theme.colorAction).toBe('#ff0000');
    expect(theme.spaceLg).toBe(20);
    expect(theme.colorSurface).toBe('#1c1c1e');
  });
});
