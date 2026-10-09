---
id: theming
title: Theming
sidebar_position: 7
---

# Theming

The package UI is neutral on purpose: it should look like the host app. You re-theme it through
design tokens, never by editing the components.

## Web: the `--od-*` tokens

`<OfflineDetector>` renders one inline `<style>` element with the `--od-*` custom properties
(light, and dark through `prefers-color-scheme`). Override any of them in your own CSS:

```css
:root {
  --od-color-action: #6d28d9;
  --od-radius-md: 2px;
  --od-font-family: 'Inter', system-ui, sans-serif;
}
```

Force a scheme with the `colorScheme` prop (`'auto'`, `'light'` or `'dark'`). Anything but
`'auto'` wraps the tree in an element with `data-od-theme` and `display: contents`. You can also
set `data-od-theme="light"` or `"dark"` yourself on `<html>`, on a `[data-od-root]` element or on any
subtree.

Some tokens are for layout rather than looks: `--od-offset-top` and
`--od-offset-bottom` move the pieces away from your own fixed bars, and `--od-banner-height` is
published while the banner shows so other elements can stack against it.

No font is ever downloaded. Branding the type is your job, through `--od-font-family`.

### All tokens

Values are the defaults. An equals sign means the dark value is the same as the light one.

#### Colour

| Token                              | Light                | Dark                 |
| ---------------------------------- | -------------------- | -------------------- |
| `--od-color-surface`               | `#ffffff`            | `#1c1c1e`            |
| `--od-color-surface-raised`        | `#f4f5f7`            | `#2c2c2e`            |
| `--od-color-surface-inverse`       | `#1f2328`            | `#f2f3f5`            |
| `--od-color-text`                  | `#1b1f23`            | `#f2f3f5`            |
| `--od-color-text-muted`            | `#545b64`            | `#a8aeb7`            |
| `--od-color-text-inverse`          | `#ffffff`            | `#1b1f23`            |
| `--od-color-text-muted-inverse`    | `#c4c9d0`            | `#4a5058`            |
| `--od-color-border`                | `#80878f`            | `#8a9099`            |
| `--od-color-border-subtle`         | `#d9dce1`            | `#3a3a3c`            |
| `--od-color-status-offline`        | `#b3261e`            | `#ff8a80`            |
| `--od-color-status-offline-subtle` | `#fdecea`            | `#4a1f1c`            |
| `--od-color-status-online`         | `#1a7f37`            | `#4cc38a`            |
| `--od-color-status-checking`       | `#8a5a00`            | `#f0b429`            |
| `--od-color-action`                | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-on-action`             | `#ffffff`            | `#0b1b33`            |
| `--od-color-action-inverse`        | `#8ab4ff`            | `#0b5fd1`            |
| `--od-color-focus-ring`            | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-scrim`                 | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.6)` |

#### Spacing

| Token            | Light  | Dark |
| ---------------- | ------ | ---- |
| `--od-space-xs`  | `4px`  | =    |
| `--od-space-sm`  | `8px`  | =    |
| `--od-space-md`  | `12px` | =    |
| `--od-space-lg`  | `16px` | =    |
| `--od-space-xl`  | `24px` | =    |
| `--od-space-2xl` | `32px` | =    |

#### Radius

| Token              | Light   | Dark |
| ------------------ | ------- | ---- |
| `--od-radius-sm`   | `4px`   | =    |
| `--od-radius-md`   | `8px`   | =    |
| `--od-radius-lg`   | `12px`  | =    |
| `--od-radius-full` | `999px` | =    |

#### Shadow

| Token                  | Light                                                          | Dark |
| ---------------------- | -------------------------------------------------------------- | ---- |
| `--od-shadow-none`     | `none`                                                         | =    |
| `--od-shadow-chip`     | `0 1px 3px rgba(0, 0, 0, 0.2)`                                 | =    |
| `--od-shadow-snackbar` | `0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)` | =    |

#### Type

| Token                       | Light                                                                               | Dark |
| --------------------------- | ----------------------------------------------------------------------------------- | ---- |
| `--od-font-family`          | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | =    |
| `--od-font-size-label`      | `12px`                                                                              | =    |
| `--od-font-size-body`       | `14px`                                                                              | =    |
| `--od-font-size-title`      | `16px`                                                                              | =    |
| `--od-font-size-headline`   | `22px`                                                                              | =    |
| `--od-font-weight-regular`  | `400`                                                                               | =    |
| `--od-font-weight-medium`   | `500`                                                                               | =    |
| `--od-font-weight-semibold` | `600`                                                                               | =    |

#### Line height

| Token                       | Light  | Dark |
| --------------------------- | ------ | ---- |
| `--od-line-height-label`    | `16px` | =    |
| `--od-line-height-body`     | `20px` | =    |
| `--od-line-height-title`    | `24px` | =    |
| `--od-line-height-headline` | `28px` | =    |

#### Size and border

| Token                           | Light   | Dark |
| ------------------------------- | ------- | ---- |
| `--od-size-touch-target`        | `44px`  | =    |
| `--od-size-indicator-dot`       | `14px`  | =    |
| `--od-size-icon`                | `20px`  | =    |
| `--od-size-snackbar-min-height` | `48px`  | =    |
| `--od-size-snackbar-max-width`  | `560px` | =    |
| `--od-size-fullscreen-measure`  | `36ch`  | =    |
| `--od-border-width`             | `1px`   | =    |
| `--od-focus-ring-width`         | `2px`   | =    |

#### Motion

| Token                 | Light                           | Dark |
| --------------------- | ------------------------------- | ---- |
| `--od-duration-fast`  | `120ms`                         | =    |
| `--od-duration-base`  | `200ms`                         | =    |
| `--od-duration-slow`  | `320ms`                         | =    |
| `--od-duration-exit`  | `150ms`                         | =    |
| `--od-duration-pulse` | `1200ms`                        | =    |
| `--od-ease-out`       | `cubic-bezier(0.16, 1, 0.3, 1)` | =    |
| `--od-ease-in`        | `cubic-bezier(0.7, 0, 0.84, 0)` | =    |
| `--od-ease-standard`  | `cubic-bezier(0.4, 0, 0.2, 1)`  | =    |

#### Layers

| Token               | Light  | Dark |
| ------------------- | ------ | ---- |
| `--od-z-banner`     | `1000` | =    |
| `--od-z-indicator`  | `1010` | =    |
| `--od-z-snackbar`   | `1020` | =    |
| `--od-z-fullscreen` | `1100` | =    |

#### Offsets

| Token                | Light | Dark |
| -------------------- | ----- | ---- |
| `--od-offset-top`    | `0px` | =    |
| `--od-offset-bottom` | `0px` | =    |

## Native: the `OfflineTheme` object

React Native has no CSS variables. The same tokens exist as a typed object, with the names in
camelCase and without the prefix (`--od-color-action` is `colorAction`). Pass overrides with the
`theme` prop, build a theme with `createTheme`, or start from `lightTheme` and `darkTheme`:

```tsx
import { OfflineDetector, createTheme } from '@rogeriodocarmo/offline-detector-native';

const theme = createTheme({ colorAction: '#6d28d9', radiusMd: 2 });

<OfflineDetector netInfo={NetInfo} theme={theme}>
  <App />
</OfflineDetector>;
```

`useOfflineTheme` returns the resolved theme inside your own components. Every key of
`OfflineTheme`:

| Key                        | Type                  |
| -------------------------- | --------------------- |
| `colorSurface`             | `string`              |
| `colorSurfaceRaised`       | `string`              |
| `colorSurfaceInverse`      | `string`              |
| `colorText`                | `string`              |
| `colorTextMuted`           | `string`              |
| `colorTextInverse`         | `string`              |
| `colorTextMutedInverse`    | `string`              |
| `colorBorder`              | `string`              |
| `colorBorderSubtle`        | `string`              |
| `colorStatusOffline`       | `string`              |
| `colorStatusOfflineSubtle` | `string`              |
| `colorStatusOnline`        | `string`              |
| `colorStatusChecking`      | `string`              |
| `colorAction`              | `string`              |
| `colorOnAction`            | `string`              |
| `colorActionInverse`       | `string`              |
| `colorFocusRing`           | `string`              |
| `colorScrim`               | `string`              |
| `spaceXs`                  | `number`              |
| `spaceSm`                  | `number`              |
| `spaceMd`                  | `number`              |
| `spaceLg`                  | `number`              |
| `spaceXl`                  | `number`              |
| `space2xl`                 | `number`              |
| `radiusSm`                 | `number`              |
| `radiusMd`                 | `number`              |
| `radiusLg`                 | `number`              |
| `radiusFull`               | `number`              |
| `fontFamily`               | `string \| undefined` |
| `fontSizeLabel`            | `number`              |
| `fontSizeBody`             | `number`              |
| `fontSizeTitle`            | `number`              |
| `fontSizeHeadline`         | `number`              |
| `lineHeightLabel`          | `number`              |
| `lineHeightBody`           | `number`              |
| `lineHeightTitle`          | `number`              |
| `lineHeightHeadline`       | `number`              |
| `fontWeightRegular`        | `'400'`               |
| `fontWeightMedium`         | `'500'`               |
| `fontWeightSemibold`       | `'600'`               |
| `sizeTouchTarget`          | `number`              |
| `sizeIndicatorDot`         | `number`              |
| `sizeIcon`                 | `number`              |
| `sizeSnackbarMinHeight`    | `number`              |
| `sizeSnackbarMaxWidth`     | `number`              |
| `sizeFullscreenMeasure`    | `number`              |
| `focusRingWidth`           | `number`              |
| `durationFast`             | `number`              |
| `durationBase`             | `number`              |
| `durationSlow`             | `number`              |
| `durationExit`             | `number`              |
| `durationPulse`            | `number`              |
| `easeOut`                  | `Bezier`              |
| `easeIn`                   | `Bezier`              |
| `easeStandard`             | `Bezier`              |
| `zBanner`                  | `number`              |
| `zIndicator`               | `number`              |
| `zSnackbar`                | `number`              |
| `zFullscreen`              | `number`              |
| `shadowChip`               | `ShadowStyle`         |
| `shadowSnackbar`           | `ShadowStyle`         |

## Keep the contrast

If you change colours, keep text at 4.5 to 1 and interface components at 3 to 1, in both schemes.
Status colours (offline, online, checking) mark a glyph or a dot; do not use them for sentences. See
[Accessibility](./accessibility.md).
