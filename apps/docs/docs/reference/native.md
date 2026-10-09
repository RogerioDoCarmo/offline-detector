---
id: native
title: Native reference
sidebar_label: native
sidebar_position: 4
---

# `@rogeriodocarmo/offline-detector-native`

Shows when a React Native app has no internet: a snackbar with Retry, a banner and an indicator by
default, plus an opt-in full-screen state. No native code, no Reanimated, no gesture-handler.
Requires React 18 or newer and React Native 0.73 or newer. See the
[native quick start](../native-quick-start.md).

## `OfflineDetector` props

| Prop                | Notes                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| `netInfo`           | The NetInfo module, passed in by the host. Ignored when `adapter` is given.            |
| `adapter`           | A `PlatformAdapter`. Default: `createNativeAdapter({ netInfo })`, built once.          |
| `probe`             | Reachability probe settings (see the [react reference](./react.md)).                   |
| `fetch`             | The probe transport.                                                                   |
| `onOffline`         | Fires when the status becomes offline.                                                 |
| `onOnline`          | Fires when the status returns from offline to online.                                  |
| `onChange`          | Fires on every status change.                                                          |
| `onError`           | Receives exceptions thrown by listeners and callbacks.                                 |
| `initialStatus`     | As in the react package.                                                               |
| `detector`          | As in the react package.                                                               |
| `locale`            | `en`, `pt-BR`, `es`; default follows the device locale.                                |
| `strings`           | Copy overrides.                                                                        |
| `distinguishReason` | `true` says "No network connection" or "Connected, but no internet".                   |
| `fullScreen`        | `true`, or `{ continueOffline: true }` for the escape hatch. Off by default.           |
| `onContinueOffline` | Fires when "Continue offline" is pressed.                                              |
| `snackbar`          | Per-piece options: `dismissible`.                                                      |
| `banner`            | Per-piece options: `dismissible`, `position`, `overlay`.                               |
| `indicator`         | Per-piece options: `dismissible`, `position`, `variant`.                               |
| `dismissible`       | Pieces can be swiped away (default); a dismissed piece returns on the next transition. |
| `onDismiss`         | `(piece) => void`.                                                                     |
| `motion`            | `'auto'`, `'reduced'`, `'full'`.                                                       |
| `colorScheme`       | `'auto'`, `'light'`, `'dark'`.                                                         |
| `theme`             | `Partial<OfflineTheme>` token overrides. See [Theming](../theming.md).                 |
| `insets`            | `Partial<Insets>` safe-area insets.                                                    |
| `recoveryMs`        | How long "Back online" shows. Default 4000.                                            |
| `slots`             | Replace a piece entirely. See [Slots](../slots.md).                                    |

The host content is hidden from assistive technology while the full-screen state shows.

## Adapter

`createNativeAdapter({ netInfo?, appState? })` returns a `PlatformAdapter`:

- `netInfo` is the NetInfo module (`NetInfoLike`: `fetch()` and `addEventListener()`), passed in by
  the host. The package never imports it. Without it the interface is assumed up and only the probe
  decides; development builds warn once.
- `appState` defaults to React Native's `AppState` (`AppStateLike`). A foreground return is a change
  from `background` or `inactive` to `active`.
- The interface is up when `isConnected !== false`.

## Theme

`OfflineTheme` is the typed token object; `lightTheme` and `darkTheme` are the two defaults;
`createTheme(overrides?, scheme?)` merges overrides over one of them; `useOfflineTheme(...)` returns
the resolved theme inside a component. Every key is listed in [Theming](../theming.md).

## Safe-area insets

`Insets` is `{ top, right, bottom, left }` in dp. `defaultInsets()` returns the Android status bar
height on top and zero elsewhere. Pass the real insets (for example from `useSafeAreaInsets()`),
especially on notched iPhones.

## Pieces

`Snackbar`, `Banner`, `Indicator` and `FullScreen` are exported with `SnackbarProps`, `BannerProps`,
`IndicatorProps` and `FullScreenProps`. `FullScreen` takes `phase`, `title`, `strings`, `onRetry`,
and optionally `onContinueOffline`, `onRestoreFocus`, `visible`, `theme`, `reduceMotion`, `insets`,
`icons`, `style` and `testID`. `PieceIcons` types the replaceable glyphs. A slot receives the
`PieceRenderProps` contract, with `theme` set.

`hostContentAccessibilityProps(fullScreenVisible)` returns the props that hide your host content
from assistive technology while the full-screen state is visible (`no-hide-descendants` on Android,
`accessibilityElementsHidden` on iOS). Spread them on your root view when you assemble the pieces
yourself.

## Hooks

- `useReducedMotion(motion?)` is `true` when motion should be reduced; `'auto'` reads the OS setting.
- `useSwipeDismiss({ enabled, onDismiss, reducedMotion, theme? })` returns `panHandlers`,
  `onLayout` and an animated `style`. It uses `PanResponder` and the built-in `Animated` API.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `AppStateLike` (type)
- `Banner` (component)
- `BannerProps` (type)
- `Bezier` (type)
- `createNativeAdapter` (function)
- `createTheme` (constant)
- `darkTheme` (constant)
- `defaultInsets` (function)
- `FullScreen` (component)
- `FullScreenProps` (type)
- `hostContentAccessibilityProps` (function)
- `Indicator` (component)
- `IndicatorProps` (type)
- `Insets` (type)
- `lightTheme` (constant)
- `NativeAdapterOptions` (type)
- `NetInfoLike` (type)
- `OfflineDetector` (component)
- `OfflineDetectorProps` (type)
- `OfflineDetectorSlot` (type)
- `OfflineDetectorSlots` (type)
- `OfflineTheme` (type)
- `packageName` (constant)
- `PieceIcons` (type)
- `ShadowStyle` (type)
- `Snackbar` (component)
- `SnackbarProps` (type)
- `useOfflineTheme` (constant)
- `useReducedMotion` (hook)
- `useSwipeDismiss` (hook)
- `UseSwipeDismissOptions` (type)

<!--/EXPORTS-->
