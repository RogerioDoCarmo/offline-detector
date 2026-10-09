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
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Probe transport (`no-cors`, `no-store`).                                                        |
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
| `dismissible`       | `boolean`                                         | `true`                  | Global switch for swipe and Dismiss. Per piece: `snackbar`, `banner`, `indicator` options.      |
| `onDismiss`         | `(piece) => void`                                 |                         | A piece was dismissed (`'snackbar' \| 'banner' \| 'indicator'`).                                |
| `snackbar`          | `{ dismissible? }`                                |                         | Per-piece options.                                                                              |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` floats over the content.                                                              |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, auto         | `variant` is `dot` while the banner shows, else `chip`.                                         |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` follows `prefers-reduced-motion`.                                                        |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Anything but `auto` wraps the tree in a `data-od-theme` element (`display: contents`).          |
| `recoveryMs`        | `number`                                          | `4000`                  | How long "Back online" shows. The timer pauses while the snackbar is hovered, focused, touched. |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Replace a piece with your own component. See [Slots](../slots.md).                              |
| `children`          | `ReactNode`                                       |                         | Your app.                                                                                       |

`<OfflineDetector>` needs no provider and no adapter. Hooks from the
[React package](./react.md) work anywhere inside it.

## The pieces

`Snackbar`, `Banner`, `Indicator` and `FullScreen` are exported so a [slot](../slots.md) can reuse
them or you can assemble your own tree. They all accept `PieceProps`:

| Prop                               | What it does                                                               |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `phase`, `message`, `strings`      | What to show: `'offline' \| 'checking' \| 'recovered'`, the text and copy. |
| `actions`                          | `retry`, `dismiss` (its presence means dismissible), `continueOffline`.    |
| `visible`                          | False during the exit window: the piece plays its exit and ignores input.  |
| `rootProps`                        | Role, live-region and direction props from the provider.                   |
| `announce`                         | Whether this piece owns the screen reader announcement. Default true.      |
| `motion`                           | `'auto'`, `'reduced'` or `'full'`.                                         |
| `className`, `style`, `icons`      | Styling hooks; `icons` replaces the offline, online or checking glyph.     |
| `checkingDelayMs`, `checkingMinMs` | Checking visibility timing. Defaults 150 and 400.                          |

`BannerProps` and `IndicatorProps` add their own options (banner overlay; indicator position and
variant); `SnackbarProps` extends `PieceProps` as well.

## Adapter and probe fetch

- `createWebAdapter(env?)` returns a `PlatformAdapter` from `navigator.onLine`, the `online` and
  `offline` events and `visibilitychange` or focus. It reads browser globals only when called, never
  at import time. `WebAdapterEnv` lets you inject `window`, `document` and `navigator` for tests.
- `createWebProbeFetch(fetchImpl?)` wraps `fetch` for the probe with `mode: 'no-cors'` and
  `cache: 'no-store'`, so an opaque success counts as reachable and no CORS headers are needed.

## Swipe

`useSwipeDismiss({ enabled, onDismiss, reducedMotion, keys? })` returns `{ props, dragging,
dismissed, dismiss, reset }`; spread `props` on the piece root. `SWIPE_RULES` holds the thresholds
(30 percent of the width, 0.5 px/ms, an 8 px axis lock). `lockAxis(dx, dy)` and
`shouldDismiss(dx, width, elapsedMs)` are the pure decisions behind it. Keys default to `Escape`
and `Delete`.

## Tokens

`OfflineTokens` renders the tokens and styles in a `<style>` element (accepts a `nonce`).
`offlineTokensCss` is the tokens as a string; `offlineCss` adds the styles of the four pieces. See
[Theming](../theming.md).

## Hooks

- `useReducedMotion(motion?)` is `true` when motion should be reduced; `'auto'` reads
  `prefers-reduced-motion`.
- `useSettledChecking(...)` applies the 150 ms and 400 ms rules to a pending "Checking…" state so it
  neither flashes nor flickers.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `Axis` (type)
- `Banner` (component)
- `BannerProps` (type)
- `createWebAdapter` (function)
- `createWebProbeFetch` (function)
- `DismissKey` (type)
- `FullScreen` (component)
- `Indicator` (component)
- `IndicatorProps` (type)
- `lockAxis` (function)
- `Motion` (type)
- `offlineCss` (function)
- `OfflineDetector` (component)
- `OfflineDetectorProps` (type)
- `OfflineDetectorSlots` (type)
- `OfflineTokens` (component)
- `offlineTokensCss` (function)
- `OfflineTokensProps` (type)
- `packageName` (constant)
- `Phase` (type)
- `PieceIcons` (type)
- `PieceProps` (type)
- `shouldDismiss` (function)
- `Snackbar` (component)
- `SnackbarProps` (type)
- `SWIPE_RULES` (constant)
- `SwipeDismissProps` (type)
- `useReducedMotion` (hook)
- `useSettledChecking` (hook)
- `useSwipeDismiss` (hook)
- `UseSwipeDismissOptions` (type)
- `UseSwipeDismissResult` (type)
- `WebAdapterEnv` (type)

<!--/EXPORTS-->
