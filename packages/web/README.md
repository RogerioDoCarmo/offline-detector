# @rogeriodocarmo/offline-detector-web

Part of [offline-detector](https://github.com/RogerioDoCarmo/offline-detector). Shows when a React
web app has no internet: a snackbar with Retry, a banner and a status indicator, with an opt-in
full-screen state. Accessible, themable, translated (English, Portuguese, Spanish) and safe to
render on the server.

## Quick start

```bash
pnpm add @rogeriodocarmo/offline-detector-web
```

The web package depends on `@rogeriodocarmo/offline-detector-react` and the core, and re-exports
the hooks you need, so this is the only package to install. React and react-dom 18 or newer are
peer dependencies.

Render `<OfflineDetector>` once, near the root. It needs no provider and no adapter:

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Root() {
  return (
    <OfflineDetector>
      <App />
    </OfflineDetector>
  );
}
```

That is the whole setup. The app launches online and shows nothing. When the connection drops, a
snackbar ("No internet", with Retry), a banner and an indicator appear; when it returns, a "Back
online" snackbar shows for four seconds. The hooks (`useNetworkStatus`, `useRecheckOnReturn`,
`useOfflineDetector`, `useCheckingFeedback`) are exported from this package and work anywhere
inside it.

## Props

Everything is optional.

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
| `snackbar`          | `{ dismissible? }`                                |                         |                                                                                                 |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` floats over the content. `position` is accepted but not yet applied.                  |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, auto         | `variant` is `dot` while the banner shows, else `chip`.                                         |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` follows `prefers-reduced-motion`.                                                        |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Anything but `auto` wraps the tree in a `data-od-theme` element (`display: contents`).          |
| `recoveryMs`        | `number`                                          | `4000`                  | How long "Back online" shows. The timer pauses while the snackbar is hovered, focused, touched. |
| `nonce`             | `string`                                          |                         | CSP nonce for the inline `<style>` element that carries the tokens and styles.                  |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Replace a piece with your own component.                                                        |
| `children`          | `ReactNode`                                       |                         | Your app.                                                                                       |

A dismissed piece stays hidden until the next status change, then every piece comes back.
Dismissal is in memory only. When the piece that was dismissed held keyboard focus, focus goes back
to the element that had it before the piece appeared (the page body if that element is gone).

The full-screen title is `strings.fullScreenTitle`; with `distinguishReason` it is the reason-aware
message instead.

### Re-checking on return

Re-probing when the user returns to the tab is opt-in per screen. With
`checkingFeedback: 'brief'` the pieces show a short "Checking" state while that background probe
runs; a pressed Retry always shows it at once.

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-web';

function Checkout() {
  useRecheckOnReturn({ checkingFeedback: 'brief' });
  return <Form />;
}
```

## Slots

A slot replaces a piece entirely. It receives `PieceRenderProps`: `state`, `phase`
(`'offline' | 'checking' | 'recovered'`), `message` (already localised), `strings`, `actions`
(`retry`, `dismiss` when allowed, `continueOffline` for the full-screen state), `visible`, `theme`
(native only, `undefined` on the web) and `rootProps` (role and label to spread on your root).
The tokens are still rendered, so `var(--od-color-surface-inverse)` and friends work. For the
full-screen slot, `message` is the title. A slot that spreads `rootProps` gets the live region role
the bundled piece would have; unlike the bundled pieces, a slot's text is present from its first
render, so if it must be announced, mount its live element first and set the text a frame later.

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-web';

function Toast({ message, phase, actions, rootProps }: PieceRenderProps) {
  return (
    <div {...rootProps} className="my-toast">
      {message}
      {phase !== 'recovered' && <button onClick={actions.retry}>Try again</button>}
      {actions.dismiss && <button onClick={actions.dismiss}>Close</button>}
    </div>
  );
}

<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>;
```

## Theming

`<OfflineDetector>` renders one inline `<style>` with the `--od-*` custom properties (light, and
dark through `prefers-color-scheme`). The package's own rules are written under `:where()`, so they
have no specificity: any rule of yours that sets a token wins, wherever it sits in the cascade.

```css
:root {
  --od-color-surface-inverse: #0b3d2e;
}
```

Force a scheme with `colorScheme`. Under a Content Security Policy, pass the same `nonce` your
other inline styles use: `<OfflineDetector nonce={nonce}>` (or `<OfflineTokens nonce={nonce} />`).

## Building your own layout

The pieces (`Snackbar`, `Banner`, `Indicator`, `FullScreen`), `OfflineTokens`, `createWebAdapter`
and `createWebProbeFetch` are exported for custom layouts. Every piece takes the same props as a
slot: `phase`, `message`, `strings`, `actions` (`retry`, `dismiss`, `continueOffline`), `visible`,
`rootProps`, plus web extras such as `announce`, `motion`, `className`, `style` and `icons`. A piece
is dismissible exactly when `actions.dismiss` is present. The swipe hook and the timing helpers are
internal and not exported.

## Accessibility

- The piece that owns the announcement renders a polite `role="status"` region. It is mounted
  empty and receives its text one animation frame later, because screen readers skip a live region
  that appears together with its text. The other pieces are silent; the banner becomes a labelled
  region while the snackbar speaks.
- Dismissing is never announced. Every swipe has a keyboard (Escape, Delete) and a button
  alternative.
- The full-screen state moves focus to its title, makes the rest of the page inert (including
  elements added later) and gives focus back when it goes away.
- Focus moving into an embedded iframe (a card field) does not count as leaving the page.

## Next.js and other frameworks

The component uses state and effects, so in the Next.js App Router put it in a client component:

```tsx
'use client';

import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Offline({ children }: { children: React.ReactNode }) {
  return <OfflineDetector>{children}</OfflineDetector>;
}
```

## Server rendering

Importing the package, creating the adapter and rendering on the server never touch `window`,
`document` or `navigator`. The server renders the tokens and your children, and no piece (unless
you pass `initialStatus="offline"`). The first connectivity check runs in an effect after mount,
so hydration produces the same markup as the server and nothing flashes. An `initialStatus` of
`"offline"` is only a hint for the first paint: if the first real check finds the app online, the
pieces simply go away, with no "Back online".

## Privacy

The only network traffic is the configurable reachability probe. It is sent with
`credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, so it carries no cookies and no
`Referer`, even to a same-origin endpoint, and a response of any kind counts as reachable. See the
repository's `PRIVACY.md`.
