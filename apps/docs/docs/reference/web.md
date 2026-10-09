---
id: web
title: Web reference
sidebar_label: web
sidebar_position: 3
---

# `@rogeriodocarmo/offline-detector-web`

Shows when a React web app has no internet: a snackbar with Retry, a banner and a status indicator,
with an opt-in full-screen state. Accessible, themable, translated and safe to render on the
server. React and react-dom 18 or newer are peer dependencies.

## `OfflineDetector` props

Everything is optional. See the [web quick start](../web-quick-start.md).

| Prop                | Type                                              | Default                 | What it does                                                                                    |
| ------------------- | ------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `adapter`           | `PlatformAdapter`                                 | `createWebAdapter()`    | The platform seam. Created once per mount; read once.                                           |
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Probe transport: `no-cors`, `no-store`, no cookies, no `Referer`.                               |
| `probe`             | `ProbeOptions`                                    | core defaults           | Probe URLs, timeout, interval, method, mode.                                                    |
| `onOffline`         | `(state) => void`                                 |                         | Status became offline (also when the first result is offline).                                  |
| `onOnline`          | `(state) => void`                                 |                         | Status went from offline back to online.                                                        |
| `onChange`          | `(state, previous) => void`                       |                         | Every status change, including the first result.                                                |
| `onError`           | `(error) => void`                                 |                         | Exceptions thrown by listeners and callbacks.                                                   |
| `initialStatus`     | `'online' \| 'offline'`                           | unknown                 | SSR hint for the first render. Never triggers "Back online".                                    |
| `locale`            | `string`                                          | `'en'`                  | `'en'`, `'pt-BR'`, `'es'` (variants such as `pt`, `es-MX` resolve).                             |
| `strings`           | `Partial<OfflineStrings>`                         |                         | Copy overrides merged over the locale.                                                          |
| `distinguishReason` | `boolean`                                         | `false`                 | Say "No network connection" or "Connected, but no internet" instead of "No internet".           |
| `fullScreen`        | `boolean \| { continueOffline?: boolean }`        | off                     | Opt-in full-screen state while offline. `continueOffline: true` adds an escape hatch.           |
| `onContinueOffline` | `() => void`                                      |                         | The user pressed "Continue offline" (or Escape) on the full-screen state.                       |
| `dismissible`       | `boolean`                                         | `true`                  | Global switch for swipe and Dismiss. Per piece: `snackbar`, `banner`, `indicator` options.      |
| `onDismiss`         | `(piece) => void`                                 |                         | A piece was dismissed (`'snackbar' \| 'banner' \| 'indicator'`).                                |
| `snackbar`          | `{ dismissible? }`                                |                         | Per-piece options.                                                                              |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` floats over the content. `banner.position` is accepted and not yet applied.           |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, auto         | `variant` is `dot` while the banner shows, else `chip`.                                         |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` follows `prefers-reduced-motion`.                                                        |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Anything but `auto` wraps the tree in a `data-od-theme` element (`display: contents`).          |
| `recoveryMs`        | `number`                                          | `4000`                  | How long "Back online" shows. The timer pauses while the snackbar is hovered, focused, touched. |
| `nonce`             | `string`                                          |                         | CSP nonce for the inline `<style>` element that carries the tokens and styles.                  |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Replace a piece with your own component. See [Slots](../slots.md).                              |
| `children`          | `ReactNode`                                       |                         | Your app.                                                                                       |

A dismissed piece stays hidden until the next status change, then every piece comes back. Dismissal
is in memory only. When the piece that was dismissed held keyboard focus, focus goes back to the
element that had it before the piece appeared (the page body if that element is gone).

The full-screen title is `strings.fullScreenTitle`; with `distinguishReason` it is the reason-aware
message instead.

`<OfflineDetector>` needs no provider and no adapter. The hooks (see below) work anywhere inside it.

## The pieces

`Snackbar`, `Banner`, `Indicator` and `FullScreen` are exported so a [slot](../slots.md) can reuse
them or you can assemble your own tree. They all accept `PieceProps`, the same shape the native pieces take:

| Prop                               | What it does                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `phase`, `message`, `strings`      | What to show: `'offline' \| 'checking' \| 'recovered'`, the text and copy.     |
| `actions`                          | `retry`, `dismiss` (its presence means dismissible), `continueOffline`.        |
| `state`, `theme`                   | Accepted for parity with `PieceRenderProps`; the pieces are driven by `phase`. |
| `visible`                          | False during the exit window: the piece plays its exit and ignores input.      |
| `rootProps`                        | Role, live-region and direction props from the provider.                       |
| `announce`                         | Whether this piece owns the screen reader announcement. Default true.          |
| `motion`                           | `'auto'`, `'reduced'` or `'full'`.                                             |
| `className`, `style`, `icons`      | Styling hooks; `icons` replaces the offline, online or checking glyph.         |
| `checkingDelayMs`, `checkingMinMs` | Checking visibility timing. Defaults 150 and 400.                              |

`BannerProps` and `IndicatorProps` add their own options (banner overlay; indicator position and
variant); `SnackbarProps` extends `PieceProps` as well.

## Adapter and probe fetch

- `createWebAdapter(env?)` returns a `PlatformAdapter` from `navigator.onLine`, the `online` and
  `offline` events and `visibilitychange` or focus. It reads browser globals only when called, never
  at import time. `WebAdapterEnv` lets you inject `window`, `document` and `navigator` for tests.
- `createWebProbeFetch(fetchImpl?)` wraps `fetch` for the probe with `mode: 'no-cors'`,
  `cache: 'no-store'`, `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, and returns the
  result unchanged. Any completed response counts as reachable, no CORS headers are needed, and the
  probe sends no cookies and no `Referer`, even to a same-origin endpoint.

## Dismissal internals

The swipe hook, its thresholds and the timing helpers are internal and not exported. A custom layout
dismisses a piece by passing `actions.dismiss`: a piece is dismissible exactly when that function
is present. Every swipe has a keyboard (Escape, Delete) and a button alternative.

## Tokens

`OfflineTokens` renders the tokens and styles in a `<style>` element (accepts a `nonce`).
`offlineTokensCss` and `offlineCss` are constants: the tokens as a string, and the tokens plus the
styles of the four pieces. The tokens are declared under `:where(:root)`, so a `:root { --od-... }`
rule of yours wins. See
[Theming](../theming.md).

## Hooks and types from the react package

The web package re-exports the react API, so a web app installs one package: the hooks
`useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` and `useCheckingFeedback`, and the
types `OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`, `DismissiblePiece`,
`Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` and `UseNetworkStatusResult`. See the
[react reference](./react.md) for what they do. The native package re-exports the same list.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `Banner` (component)
- `BannerProps` (type)
- `DismissiblePiece` (type)
- `FullScreen` (component)
- `Indicator` (component)
- `IndicatorPosition` (type)
- `IndicatorProps` (type)
- `Locale` (type)
- `Motion` (type)
- `OfflineDetector` (component)
- `OfflineDetectorProps` (type)
- `OfflineDetectorSlots` (type)
- `OfflineState` (type)
- `OfflineStrings` (type)
- `OfflineTokens` (component)
- `OfflineTokensProps` (type)
- `OfflineUiOptions` (type)
- `Phase` (type)
- `PieceIcons` (type)
- `PieceProps` (type)
- `PieceRenderProps` (type)
- `RecheckOnReturnOptions` (type)
- `Snackbar` (component)
- `SnackbarProps` (type)
- `UseNetworkStatusResult` (type)
- `WebAdapterEnv` (type)
- `createWebAdapter` (function)
- `createWebProbeFetch` (function)
- `offlineCss` (constant)
- `offlineTokensCss` (constant)
- `packageName` (constant)
- `useCheckingFeedback` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
