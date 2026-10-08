# Design tokens

Binding for `packages/web` (CSS custom properties, prefix `--od-`) and `packages/native` (a typed
theme object, same names in camelCase). `docs/design/prototype.html` implements exactly these
values. If a value changes, change it here first, then the prototype, then the packages.

Naming rule: the CSS name minus `--od-`, kebab-case to camelCase. `--od-color-surface-raised` is
`colorSurfaceRaised` on native. Names starting with a digit are written out (`space2xl`).

## 1. Colour roles

The default theme is neutral and system-like. Hue appears only where it carries meaning: offline
(red), online (green), checking (amber) and action (blue). Everything else is grey.

### Values

| Role (CSS)                         | Native                     | Light                | Dark                 |
| ---------------------------------- | -------------------------- | -------------------- | -------------------- |
| `--od-color-surface`               | `colorSurface`             | `#ffffff`            | `#1c1c1e`            |
| `--od-color-surface-raised`        | `colorSurfaceRaised`       | `#f4f5f7`            | `#2c2c2e`            |
| `--od-color-surface-inverse`       | `colorSurfaceInverse`      | `#1f2328`            | `#f2f3f5`            |
| `--od-color-text`                  | `colorText`                | `#1b1f23`            | `#f2f3f5`            |
| `--od-color-text-muted`            | `colorTextMuted`           | `#545b64`            | `#a8aeb7`            |
| `--od-color-text-inverse`          | `colorTextInverse`         | `#ffffff`            | `#1b1f23`            |
| `--od-color-text-muted-inverse`    | `colorTextMutedInverse`    | `#c4c9d0`            | `#4a5058`            |
| `--od-color-border`                | `colorBorder`              | `#80878f`            | `#8a9099`            |
| `--od-color-border-subtle`         | `colorBorderSubtle`        | `#d9dce1`            | `#3a3a3c`            |
| `--od-color-status-offline`        | `colorStatusOffline`       | `#b3261e`            | `#ff8a80`            |
| `--od-color-status-offline-subtle` | `colorStatusOfflineSubtle` | `#fdecea`            | `#4a1f1c`            |
| `--od-color-status-online`         | `colorStatusOnline`        | `#1a7f37`            | `#4cc38a`            |
| `--od-color-status-checking`       | `colorStatusChecking`      | `#8a5a00`            | `#f0b429`            |
| `--od-color-action`                | `colorAction`              | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-on-action`             | `colorOnAction`            | `#ffffff`            | `#0b1b33`            |
| `--od-color-action-inverse`        | `colorActionInverse`       | `#8ab4ff`            | `#0b5fd1`            |
| `--od-color-focus-ring`            | `colorFocusRing`           | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-scrim`                 | `colorScrim`               | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.6)` |

Role intent:

- **surface / surface-raised**: the full-screen state and the banner/chip base (surface), and the
  chip background (raised).
- **surface-inverse**: the snackbar. It inverts against the host theme so it always separates from
  the content it floats over (dark on light apps, light on dark apps), as system toasts do.
  `text-inverse`, `text-muted-inverse` and `action-inverse` are its foreground colours.
- **status-offline-subtle**: the banner background. The banner text is `text`, not red.
- **status-\***: dots, icons and glyphs only. Never body text, never the sole signal (see
  `accessibility.md`).
- **action**: Retry, Continue offline and focus. Snackbar actions use `action-inverse`.
- **border**: the 3:1 UI border (chip outline, secondary button outline). **border-subtle** is
  decorative (dividers) and is exempt from contrast.
- **scrim**: reserved for a host-supplied modal presentation of the full-screen state; the default
  full-screen state is opaque `surface`.

### Contrast (WCAG 2.2, computed from sRGB relative luminance)

Minimum: 4.5:1 text, 3:1 UI components and graphical objects. Every pairing the default pieces
use is listed; all pass.

| Pairing (foreground on background)          | Use                     | Light | Dark  | Needs |
| ------------------------------------------- | ----------------------- | ----- | ----- | ----- |
| `text` on `surface`                         | full-screen title, body | 16.58 | 15.32 | 4.5   |
| `text` on `surface-raised`                  | chip label              | 15.20 | 12.55 | 4.5   |
| `text-muted` on `surface`                   | full-screen body        | 6.87  | 7.62  | 4.5   |
| `text-muted` on `surface-raised`            | chip secondary text     | 6.30  | 6.24  | 4.5   |
| `text` on `status-offline-subtle`           | banner text             | 14.49 | 12.58 | 4.5   |
| `text-muted` on `status-offline-subtle`     | banner detail           | 6.01  | 6.25  | 4.5   |
| `text-inverse` on `surface-inverse`         | snackbar message        | 15.80 | 14.93 | 4.5   |
| `text-muted-inverse` on `surface-inverse`   | snackbar secondary      | 9.49  | 7.33  | 4.5   |
| `action-inverse` on `surface-inverse`       | snackbar Retry          | 7.56  | 5.30  | 4.5   |
| `on-action` on `action`                     | solid button label      | 5.88  | 8.25  | 4.5   |
| `action` on `surface`                       | text button label       | 5.88  | 8.15  | 4.5   |
| `status-offline` on `surface`               | dot / icon              | 6.54  | 7.45  | 3     |
| `status-offline` on `status-offline-subtle` | banner icon             | 5.72  | 6.12  | 3     |
| `status-offline` on `surface-raised`        | chip dot                | 5.99  | 6.10  | 3     |
| `status-online` on `surface`                | dot / icon              | 5.08  | 7.68  | 3     |
| `status-online` on `surface-raised`         | chip dot                | 4.66  | 6.29  | 3     |
| `status-checking` on `surface`              | dot / icon              | 5.93  | 9.13  | 3     |
| `status-checking` on `surface-raised`       | chip dot                | 5.43  | 7.48  | 3     |
| `border` on `surface`                       | outline                 | 3.63  | 5.29  | 3     |
| `border` on `surface-raised`                | chip outline            | 3.33  | 4.33  | 3     |
| `focus-ring` on `surface`                   | focus indicator         | 5.88  | 8.15  | 3     |
| `focus-ring` on `status-offline-subtle`     | focus on banner         | 5.14  | 6.68  | 3     |

Not allowed (fails), so never composed: `status-offline` on `surface-inverse` (2.42 light, 2.06
dark). Status colour on the snackbar is therefore expressed by a glyph in `text-inverse`, not by a
coloured dot.

Inside the snackbar the focus ring is `action-inverse` (7.56 light, 5.30 dark), not `focus-ring`.

### Theme switching

- **Web**: the tokens are defined on `:root` for light, redefined under
  `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-od-theme="light"])`, and again
  under `:root[data-od-theme="dark"]`. Hosts with their own toggle set `data-od-theme` on `<html>`
  or on the provider root element. Scoped use: tokens are also resolved on `[data-od-root]` so a
  host can override them on a subtree.
- **Native**: `theme.light` and `theme.dark` objects; the provider reads `useColorScheme()` unless
  a `colorScheme` prop forces one.

## 2. Spacing (4 px base)

| CSS              | Native     | Value |
| ---------------- | ---------- | ----- |
| `--od-space-xs`  | `spaceXs`  | 4     |
| `--od-space-sm`  | `spaceSm`  | 8     |
| `--od-space-md`  | `spaceMd`  | 12    |
| `--od-space-lg`  | `spaceLg`  | 16    |
| `--od-space-xl`  | `spaceXl`  | 24    |
| `--od-space-2xl` | `space2xl` | 32    |

CSS values are in px; native values are numbers (dp). Edge gutter for floating pieces is
`space-lg`.

## 3. Radius

| CSS                | Native       | Value | Used by                          |
| ------------------ | ------------ | ----- | -------------------------------- |
| `--od-radius-sm`   | `radiusSm`   | 4     | focus ring rounding, small tags  |
| `--od-radius-md`   | `radiusMd`   | 8     | snackbar, buttons                |
| `--od-radius-lg`   | `radiusLg`   | 12    | full-screen card (tablet and up) |
| `--od-radius-full` | `radiusFull` | 999   | indicator chip and dot           |

The banner is square (0) so it reads as part of the page edge.

## 4. Elevation

Flat by default; shadow only where a piece floats over content.

| CSS                    | Native key       | Value                                                          |
| ---------------------- | ---------------- | -------------------------------------------------------------- |
| `--od-shadow-none`     | `shadowNone`     | `none`                                                         |
| `--od-shadow-chip`     | `shadowChip`     | `0 1px 3px rgba(0, 0, 0, 0.2)`                                 |
| `--od-shadow-snackbar` | `shadowSnackbar` | `0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)` |

Native values (`shadowChip`, `shadowSnackbar`) are style objects:

```ts
const shadowChip = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 2,
};
const shadowSnackbar = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.24,
  shadowRadius: 8,
  elevation: 6,
};
```

Banner: no shadow; a 1 px `border-subtle` bottom edge separates it. Full-screen: none.

## 5. Typography

System font stacks only; no web-font download, ever, in any package.

| CSS                         | Native               | Value                                                                               |
| --------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `--od-font-family`          | `fontFamily`         | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--od-font-size-label`      | `fontSizeLabel`      | 12                                                                                  |
| `--od-font-size-body`       | `fontSizeBody`       | 14                                                                                  |
| `--od-font-size-title`      | `fontSizeTitle`      | 16                                                                                  |
| `--od-font-size-headline`   | `fontSizeHeadline`   | 22                                                                                  |
| `--od-line-height-label`    | `lineHeightLabel`    | 16                                                                                  |
| `--od-line-height-body`     | `lineHeightBody`     | 20                                                                                  |
| `--od-line-height-title`    | `lineHeightTitle`    | 24                                                                                  |
| `--od-line-height-headline` | `lineHeightHeadline` | 28                                                                                  |
| `--od-font-weight-regular`  | `fontWeightRegular`  | 400                                                                                 |
| `--od-font-weight-medium`   | `fontWeightMedium`   | 500 (native `'500'`)                                                                |
| `--od-font-weight-semibold` | `fontWeightSemibold` | 600 (native `'600'`)                                                                |

Native: `fontFamily` is `undefined` by default so React Native uses the platform face (San
Francisco, Roboto). Text uses `allowFontScaling` (default true) with `maxFontSizeMultiplier` 2 on
the snackbar, banner and chip, and no cap on full-screen text.

Roles: snackbar message and banner text `body` regular; actions and chip label `label` semibold
(12/16, letter-spacing 0.02 em); full-screen title `headline` semibold; full-screen body `title`
regular. Line length in the full-screen state is capped at 36 ch via `--od-size-fullscreen-measure`.

## 6. Sizes

| CSS                             | Native                  | Value                     | Notes                                             |
| ------------------------------- | ----------------------- | ------------------------- | ------------------------------------------------- |
| `--od-size-touch-target`        | `sizeTouchTarget`       | 44                        | minimum hit area for every interactive element    |
| `--od-size-indicator-dot`       | `sizeIndicatorDot`      | 14                        | dot diameter, glyph inside                        |
| `--od-size-icon`                | `sizeIcon`              | 20                        | glyphs inside pieces                              |
| `--od-size-snackbar-min-height` | `sizeSnackbarMinHeight` | 48                        |                                                   |
| `--od-size-snackbar-max-width`  | `sizeSnackbarMaxWidth`  | 560                       | wider viewports centre the snackbar               |
| `--od-size-fullscreen-measure`  | `sizeFullscreenMeasure` | 36ch (web) / 320 (native) | text column width                                 |
| `--od-border-width`             | `borderWidth`           | 1                         | native `StyleSheet.hairlineWidth` for banner edge |
| `--od-focus-ring-width`         | `focusRingWidth`        | 2                         | plus 2 offset                                     |

Visible size may be smaller than the touch target (the dot is 14 px) as long as the hit area
reaches 44x44 (web: padding or `::after`; native: `hitSlop`).

## 7. Motion

| CSS                   | Native          | Value                           | Used for                          |
| --------------------- | --------------- | ------------------------------- | --------------------------------- |
| `--od-duration-fast`  | `durationFast`  | 120 ms                          | fades, press feedback             |
| `--od-duration-base`  | `durationBase`  | 200 ms                          | snackbar and banner enter         |
| `--od-duration-slow`  | `durationSlow`  | 320 ms                          | full-screen enter                 |
| `--od-duration-exit`  | `durationExit`  | 150 ms                          | all exits (faster than entrances) |
| `--od-duration-pulse` | `durationPulse` | 1200 ms                         | checking dot pulse                |
| `--od-ease-out`       | `easeOut`       | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances                         |
| `--od-ease-in`        | `easeIn`        | `cubic-bezier(0.7, 0, 0.84, 0)` | exits                             |
| `--od-ease-standard`  | `easeStandard`  | `cubic-bezier(0.4, 0, 0.2, 1)`  | colour and state changes          |

Native: `Easing.bezier(0.16, 1, 0.3, 1)` and so on, with `useNativeDriver: true` (transform and
opacity only). Non-token constants (not CSS): recovery message duration 4000 ms, minimum
"checking" display 400 ms, snackbar translate distance 16 px (`space-lg`).

Reduced motion: see `accessibility.md`. In short, translations, scale and the pulse are removed;
opacity changes remain at `--od-duration-fast`.

## 8. Layering (z-index)

| CSS                 | Native (`zIndex`) | Value |
| ------------------- | ----------------- | ----- |
| `--od-z-banner`     | `zBanner`         | 1000  |
| `--od-z-indicator`  | `zIndicator`      | 1010  |
| `--od-z-snackbar`   | `zSnackbar`       | 1020  |
| `--od-z-fullscreen` | `zFullscreen`     | 1100  |

The values are far above typical app UI but below host modals that deliberately use 9999; hosts can
override any of them. On native, rendering order also matters; the provider renders the pieces in
this order inside one overlay container.

## 9. Offsets set by the host

| CSS                  | Native (provider prop) | Default | Purpose                                     |
| -------------------- | ---------------------- | ------- | ------------------------------------------- |
| `--od-offset-top`    | `offsetTop`            | 0       | extra space above the banner (host app bar) |
| `--od-offset-bottom` | `offsetBottom`         | 0       | extra space under the snackbar (tab bar)    |

Safe areas are added on top: web `env(safe-area-inset-*)` (the host needs
`viewport-fit=cover` for non-zero values), native `useSafeAreaInsets` when
`react-native-safe-area-context` is installed (optional peer) and otherwise the
`SafeAreaView`-equivalent constants from the platform (status bar height and a 0 bottom inset
fallback). See `components.md`.

## 10. Reference implementation

### Web

```css
:root {
  --od-color-surface: #ffffff;
  --od-color-surface-raised: #f4f5f7;
  --od-color-surface-inverse: #1f2328;
  --od-color-text: #1b1f23;
  --od-color-text-muted: #545b64;
  --od-color-text-inverse: #ffffff;
  --od-color-text-muted-inverse: #c4c9d0;
  --od-color-border: #80878f;
  --od-color-border-subtle: #d9dce1;
  --od-color-status-offline: #b3261e;
  --od-color-status-offline-subtle: #fdecea;
  --od-color-status-online: #1a7f37;
  --od-color-status-checking: #8a5a00;
  --od-color-action: #0b5fd1;
  --od-color-on-action: #ffffff;
  --od-color-action-inverse: #8ab4ff;
  --od-color-focus-ring: #0b5fd1;
  --od-color-scrim: rgba(0, 0, 0, 0.4);

  --od-space-xs: 4px;
  --od-space-sm: 8px;
  --od-space-md: 12px;
  --od-space-lg: 16px;
  --od-space-xl: 24px;
  --od-space-2xl: 32px;

  --od-radius-sm: 4px;
  --od-radius-md: 8px;
  --od-radius-lg: 12px;
  --od-radius-full: 999px;

  --od-shadow-none: none;
  --od-shadow-chip: 0 1px 3px rgba(0, 0, 0, 0.2);
  --od-shadow-snackbar: 0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16);

  --od-font-family:
    system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --od-font-size-label: 12px;
  --od-font-size-body: 14px;
  --od-font-size-title: 16px;
  --od-font-size-headline: 22px;
  --od-line-height-label: 16px;
  --od-line-height-body: 20px;
  --od-line-height-title: 24px;
  --od-line-height-headline: 28px;
  --od-font-weight-regular: 400;
  --od-font-weight-medium: 500;
  --od-font-weight-semibold: 600;

  --od-size-touch-target: 44px;
  --od-size-indicator-dot: 14px;
  --od-size-icon: 20px;
  --od-size-snackbar-min-height: 48px;
  --od-size-snackbar-max-width: 560px;
  --od-size-fullscreen-measure: 36ch;
  --od-border-width: 1px;
  --od-focus-ring-width: 2px;

  --od-duration-fast: 120ms;
  --od-duration-base: 200ms;
  --od-duration-slow: 320ms;
  --od-duration-exit: 150ms;
  --od-duration-pulse: 1200ms;
  --od-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --od-ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --od-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);

  --od-z-banner: 1000;
  --od-z-indicator: 1010;
  --od-z-snackbar: 1020;
  --od-z-fullscreen: 1100;

  --od-offset-top: 0px;
  --od-offset-bottom: 0px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-od-theme='light']) {
    --od-color-surface: #1c1c1e;
    --od-color-surface-raised: #2c2c2e;
    --od-color-surface-inverse: #f2f3f5;
    --od-color-text: #f2f3f5;
    --od-color-text-muted: #a8aeb7;
    --od-color-text-inverse: #1b1f23;
    --od-color-text-muted-inverse: #4a5058;
    --od-color-border: #8a9099;
    --od-color-border-subtle: #3a3a3c;
    --od-color-status-offline: #ff8a80;
    --od-color-status-offline-subtle: #4a1f1c;
    --od-color-status-online: #4cc38a;
    --od-color-status-checking: #f0b429;
    --od-color-action: #8ab4ff;
    --od-color-on-action: #0b1b33;
    --od-color-action-inverse: #0b5fd1;
    --od-color-focus-ring: #8ab4ff;
    --od-color-scrim: rgba(0, 0, 0, 0.6);
  }
}

:root[data-od-theme='dark'] {
  /* same dark values as above */
}
```

### Native

```ts
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
  spaceXs: number; // 4
  spaceSm: number; // 8
  spaceMd: number; // 12
  spaceLg: number; // 16
  spaceXl: number; // 24
  space2xl: number; // 32
  radiusSm: number; // 4
  radiusMd: number; // 8
  radiusLg: number; // 12
  radiusFull: number; // 999
  fontFamily: string | undefined; // undefined = platform face
  fontSizeLabel: number; // 12
  fontSizeBody: number; // 14
  fontSizeTitle: number; // 16
  fontSizeHeadline: number; // 22
  lineHeightLabel: number; // 16
  lineHeightBody: number; // 20
  lineHeightTitle: number; // 24
  lineHeightHeadline: number; // 28
  fontWeightRegular: '400';
  fontWeightMedium: '500';
  fontWeightSemibold: '600';
  sizeTouchTarget: number; // 44
  sizeIndicatorDot: number; // 14
  sizeIcon: number; // 20
  sizeSnackbarMinHeight: number; // 48
  sizeSnackbarMaxWidth: number; // 560
  sizeFullscreenMeasure: number; // 320
  focusRingWidth: number; // 2
  durationFast: number; // 120
  durationBase: number; // 200
  durationSlow: number; // 320
  durationExit: number; // 150
  durationPulse: number; // 1200
  easeOut: [number, number, number, number]; // 0.16, 1, 0.3, 1
  easeIn: [number, number, number, number]; // 0.7, 0, 0.84, 0
  easeStandard: [number, number, number, number]; // 0.4, 0, 0.2, 1
  zBanner: number; // 1000
  zIndicator: number; // 1010
  zSnackbar: number; // 1020
  zFullscreen: number; // 1100
  shadowChip: ShadowStyle;
  shadowSnackbar: ShadowStyle;
};
```

`createTheme(overrides?: Partial<OfflineTheme>, scheme?: 'light' | 'dark')` returns the full
object; the provider accepts `theme` as `Partial<OfflineTheme>` or `{ light?, dark? }`.
`useOfflineTheme()` gives slot authors the resolved theme.
