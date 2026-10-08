/**
 * Design tokens as a typed object. Names are the CSS names from docs/design/tokens.md without
 * the `--od-` prefix, in camelCase.
 */

export type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type Bezier = [number, number, number, number];

export type OfflineTheme = {
  colorSurface: string;
  colorSurfaceRaised: string;
  colorSurfaceInverse: string;
  colorText: string;
  colorTextMuted: string;
  colorTextInverse: string;
  colorTextMutedInverse: string;
  colorBorder: string;
  colorBorderSubtle: string;
  colorStatusOffline: string;
  colorStatusOfflineSubtle: string;
  colorStatusOnline: string;
  colorStatusChecking: string;
  colorAction: string;
  colorOnAction: string;
  colorActionInverse: string;
  colorFocusRing: string;
  colorScrim: string;
  spaceXs: number;
  spaceSm: number;
  spaceMd: number;
  spaceLg: number;
  spaceXl: number;
  space2xl: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusFull: number;
  fontFamily: string | undefined;
  fontSizeLabel: number;
  fontSizeBody: number;
  fontSizeTitle: number;
  fontSizeHeadline: number;
  lineHeightLabel: number;
  lineHeightBody: number;
  lineHeightTitle: number;
  lineHeightHeadline: number;
  fontWeightRegular: '400';
  fontWeightMedium: '500';
  fontWeightSemibold: '600';
  sizeTouchTarget: number;
  sizeIndicatorDot: number;
  sizeIcon: number;
  sizeSnackbarMinHeight: number;
  sizeSnackbarMaxWidth: number;
  sizeFullscreenMeasure: number;
  focusRingWidth: number;
  durationFast: number;
  durationBase: number;
  durationSlow: number;
  durationExit: number;
  durationPulse: number;
  easeOut: Bezier;
  easeIn: Bezier;
  easeStandard: Bezier;
  zBanner: number;
  zIndicator: number;
  zSnackbar: number;
  zFullscreen: number;
  shadowChip: ShadowStyle;
  shadowSnackbar: ShadowStyle;
};

const shared = {
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 12,
  spaceLg: 16,
  spaceXl: 24,
  space2xl: 32,
  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 12,
  radiusFull: 999,
  fontFamily: undefined,
  fontSizeLabel: 12,
  fontSizeBody: 14,
  fontSizeTitle: 16,
  fontSizeHeadline: 22,
  lineHeightLabel: 16,
  lineHeightBody: 20,
  lineHeightTitle: 24,
  lineHeightHeadline: 28,
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  sizeTouchTarget: 44,
  sizeIndicatorDot: 14,
  sizeIcon: 20,
  sizeSnackbarMinHeight: 48,
  sizeSnackbarMaxWidth: 560,
  sizeFullscreenMeasure: 320,
  focusRingWidth: 2,
  durationFast: 120,
  durationBase: 200,
  durationSlow: 320,
  durationExit: 150,
  durationPulse: 1200,
  easeOut: [0.16, 1, 0.3, 1],
  easeIn: [0.7, 0, 0.84, 0],
  easeStandard: [0.4, 0, 0.2, 1],
  zBanner: 1000,
  zIndicator: 1010,
  zSnackbar: 1020,
  zFullscreen: 1100,
  shadowChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowSnackbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },
} satisfies Partial<OfflineTheme>;

export const lightTheme: OfflineTheme = {
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
  ...shared,
};

export const darkTheme: OfflineTheme = {
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
  ...shared,
};

/** The full theme for a scheme, with optional overrides merged over it. */
export function createTheme(
  overrides?: Partial<OfflineTheme>,
  scheme: 'light' | 'dark' = 'light',
): OfflineTheme {
  return { ...(scheme === 'dark' ? darkTheme : lightTheme), ...overrides };
}
