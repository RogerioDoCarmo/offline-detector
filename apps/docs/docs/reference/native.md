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
| `onRestoreFocus`    | Fires when the full-screen state leaves, so the host can put screen reader focus back. |
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

`Insets` is `{ top, right, bottom, left }` in dp. The default is the Android status bar height on top
and zero elsewhere, which is wrong on notched iPhones: pass the real insets (for example from
`useSafeAreaInsets()`).

## Pieces

`Snackbar`, `Banner`, `Indicator` and `FullScreen` are exported with `SnackbarProps`, `BannerProps`,
`IndicatorProps` and `FullScreenProps`. They take the same props as the web pieces:
`phase`, `message`, `strings`, optionally `state`, `actions`, `visible`, `rootProps` and `theme`,
plus native extras (`announce`, `reduceMotion`, `insets`, `icons`, `style`, `testID`; banner
`position`, `overlay`, `showRetry`, `offset`; indicator `variant`, `position`, `offsetTop`,
`offsetBottom`; snackbar `offsetBottom`; full-screen `onRestoreFocus`).

`actions` is `{ retry?, dismiss?, continueOffline? }`. A piece is dismissible exactly when
`actions.dismiss` is present, and the full-screen state shows "Continue offline" exactly when
`actions.continueOffline` is. There are no separate retry, dismiss, dismissible or title props:
use `actions` and `message` (the full-screen title). A swiped-away piece is put back at rest when
`visible` turns true
again, so it comes back on the next transition. `PieceIcons` types the replaceable glyphs. A slot
receives the `PieceRenderProps` contract, with `theme` set.

The swipe hook, the swipe and timing rules and the accessibility helper that hides host content are
internal and not exported; `<OfflineDetector>` hides the host content for you while the full-screen
state shows.

## Hooks and types

- `useReducedMotion(motion?)` is `true` when motion should be reduced; `'auto'` reads the OS setting.
- `useOfflineTheme(...)` returns the resolved theme inside your own components.
- The native package re-exports the react API, so an app installs one package: the hooks
  `useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` and `useCheckingFeedback`, and the
  types `OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`,
  `DismissiblePiece`, `Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` and
  `UseNetworkStatusResult`. See the [react reference](./react.md). The web package re-exports the
  same list.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `AppStateLike` (type)
- `Banner` (component)
- `BannerProps` (type)
- `Bezier` (type)
- `DismissiblePiece` (type)
- `FullScreen` (component)
- `FullScreenProps` (type)
- `Indicator` (component)
- `IndicatorPosition` (type)
- `IndicatorProps` (type)
- `Insets` (type)
- `Locale` (type)
- `NativeAdapterOptions` (type)
- `NetInfoLike` (type)
- `OfflineDetector` (component)
- `OfflineDetectorProps` (type)
- `OfflineDetectorSlot` (type)
- `OfflineDetectorSlots` (type)
- `OfflineState` (type)
- `OfflineStrings` (type)
- `OfflineTheme` (type)
- `OfflineUiOptions` (type)
- `Phase` (type)
- `PieceIcons` (type)
- `PieceProps` (type)
- `PieceRenderProps` (type)
- `RecheckOnReturnOptions` (type)
- `ShadowStyle` (type)
- `Snackbar` (component)
- `SnackbarProps` (type)
- `UseNetworkStatusResult` (type)
- `createNativeAdapter` (function)
- `createTheme` (function)
- `darkTheme` (constant)
- `lightTheme` (constant)
- `packageName` (constant)
- `useCheckingFeedback` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useOfflineTheme` (hook)
- `useRecheckOnReturn` (hook)
- `useReducedMotion` (hook)

<!--/EXPORTS-->
