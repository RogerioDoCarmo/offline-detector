# @rogeriodocarmo/offline-detector-react

Part of [offline-detector](https://github.com/RogerioDoCarmo/offline-detector). The React layer
over the [core engine](https://github.com/RogerioDoCarmo/offline-detector/blob/main/packages/core/README.md): a provider, hooks, dismissal state, bundled strings
and the shared types that the web and native UI packages build on.

It has no DOM and no React Native imports, so one copy works on both. A **platform adapter**
(from `@rogeriodocarmo/offline-detector-web` or `-native`) supplies the platform signals.
Requires React 18 or newer.

"Offline" means no real internet. Wi-Fi that is connected but carries no data counts as offline.

## Setup

```tsx
import {
  OfflineDetectorProvider,
  useNetworkStatus,
} from '@rogeriodocarmo/offline-detector-react';
import {
  createWebAdapter,
  createWebProbeFetch,
} from '@rogeriodocarmo/offline-detector-web';

const adapter = createWebAdapter();
const fetch = createWebProbeFetch();

export function App() {
  return (
    <OfflineDetectorProvider adapter={adapter} fetch={fetch}>
      <Screen />
    </OfflineDetectorProvider>
  );
}

function Screen() {
  const { status, reason, isOnline, checkNow } = useNetworkStatus();
  return isOnline ? (
    <Content />
  ) : (
    <button onClick={checkNow}>Offline ({reason}). Retry</button>
  );
}
```

The provider creates **one** detector per mount, starts it in an effect and stops it when it
unmounts. React StrictMode's extra mount does not start a second check or leak a timer or a
listener. Nothing runs during render, so server rendering and hydration are safe: no `window`,
no `navigator`, and the first check happens in an effect.

### Provider props

| Prop            | Notes                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| `adapter`       | Required. A `PlatformAdapter`. Read once per mount.                                           |
| `probe`         | `ProbeOptions` from core (`urls`, `timeoutMs`, `intervalMs`, `method`, `mode`). Read once.    |
| `fetch`         | The probe transport. Read once. On web use `createWebProbeFetch()`.                           |
| `onOffline`     | `(state) => void`. Fires when the status becomes `offline`, including a first offline result. |
| `onOnline`      | `(state) => void`. Fires when the status goes from `offline` back to `online`.                |
| `onChange`      | `(state, previous) => void`. Fires on every **status** change, including the first result.    |
| `onError`       | `(error) => void`. Receives exceptions thrown by callbacks and by `onResult`.                 |
| `initialStatus` | `'online'` or `'offline'`. SSR hint: what the first render assumes (see below).               |
| `detector`      | Test seam: use this detector instead of creating one. The callback props are not wired to it. |

### Callbacks

```tsx
<OfflineDetectorProvider
  adapter={adapter}
  fetch={fetch}
  onOffline={(state) => analytics.track('offline', { reason: state.reason })}
  onOnline={() => toast('Back online')}
  onChange={(state, previous) => console.log(previous.status, '->', state.status)}
>
```

- They fire on real status transitions only, never on every probe, and never for a change of
  reason alone (`no-interface` to `no-internet`).
- `onOnline` does not fire when the very first result is online: nothing was lost.
- They are read through a ref. Passing a new function on every render is fine and never restarts
  the detector.

### Server rendering

Without `initialStatus` the first render, on the server and on the client, shows the state
`unknown` (which `isOnline` treats as online). Pass `initialStatus="offline"` when you know better
(for example from a cookie or a request header): the server markup and the first client render
agree, and the hint holds until the first real check completes.

## Hooks

| Hook                       | Returns                                                  |
| -------------------------- | -------------------------------------------------------- |
| `useNetworkStatus()`       | `OfflineState` plus `isOnline: boolean` and `checkNow()` |
| `useOfflineDetector()`     | The core `OfflineDetectorInstance`, for advanced use     |
| `useRecheckOnReturn(opts)` | `boolean`, the latest known online state                 |
| `useCheckingFeedback()`    | `'brief'` or `'none'`, for UI packages                   |
| `useDismissals(options)`   | `{ isDismissed(piece), dismiss(piece) }`                 |

Every hook throws a clear error when used outside `<OfflineDetectorProvider>`.

### `useNetworkStatus()`

```ts
type UseNetworkStatusResult = OfflineState & {
  isOnline: boolean; // true while status is 'unknown'
  checkNow(): Promise<OfflineState>; // concurrent calls share one probe
};
```

### `useRecheckOnReturn(options?)`

Opt-in, per screen. While the component is mounted, returning to the app (tab visible again,
window focus, `AppState` becoming active; whatever the adapter reports) re-probes at once instead
of waiting for the next scheduled check.

```tsx
function Checkout() {
  const online = useRecheckOnReturn({
    checkingFeedback: 'brief',
    onResult: (isOnline) => console.log('back in the app, online:', isOnline),
  });
  return <Pay disabled={!online} />;
}
```

| Option             | Default  | Notes                                                                              |
| ------------------ | -------- | ---------------------------------------------------------------------------------- |
| `checkingFeedback` | `'none'` | `'brief'` asks the UI to show a "Checking" state while the return check is pending |
| `onResult`         | none     | `(isOnline: boolean) => void`, called after each return-triggered check            |

- It subscribes with the adapter only while mounted, and unsubscribes on unmount. `onResult` is
  not called after unmount.
- Several mounted hooks share **one** probe: core de-duplicates concurrent checks.
- The return value is the latest known boolean, `false` only when the app is offline. It updates
  whenever that answer changes, not only after a return, and it subscribes to nothing else: a
  `checking` flip or a new timestamp that leaves the answer unchanged does not re-render the
  screen. Use `useNetworkStatus()` when you need the whole state.
- `onResult` receives the outcome of the check that the return started. If an interface-up
  event overtakes that check, it receives the overtaking check's result.
- Core's own `recheckOnForeground` option stays off. This hook is the only place that re-checks on
  return.
- `useCheckingFeedback()` is for the UI packages. It reports `'brief'` while a return-triggered
  check started by a `'brief'` hook is pending, and `'none'` otherwise. A scheduled back-off
  probe never counts, and with `'none'` a background check stays invisible.

### Dismissal

Snackbar, banner and indicator are dismissible by default. A dismissed piece stays hidden until
the **next status transition**, then every piece is shown again. It is kept in memory only and
never persisted.

```ts
interface DismissOptions {
  dismissible?: boolean; // global, default true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: 'snackbar' | 'banner' | 'indicator'): void;
}

resolveDismissible('banner', { dismissible: false, banner: { dismissible: true } }); // true

const { isDismissed, dismiss } = useDismissals({ onDismiss: (piece) => log(piece) });
dismiss('snackbar'); // no-op when that piece is not dismissible
```

`resolveDismissible(piece, options)` is pure: a per-piece value wins over the global one, and the
default is `true`. The full-screen state is never dismissible this way.

## Strings and locales

```ts
import {
  STRINGS,
  resolveLocale,
  resolveStrings,
  offlineMessage,
  indicatorName,
} from '@rogeriodocarmo/offline-detector-react';

resolveLocale('pt-PT'); // 'pt-BR'
resolveLocale('es-MX'); // 'es'
resolveLocale('fr'); // 'en'

const strings = resolveStrings('pt-BR', { retry: 'Outra vez' }); // overrides win, per key
offlineMessage(state, strings); // 'Sem internet' (always, by default)
offlineMessage(state, strings, true); // reason-aware: 'Sem conexão com a rede' or 'Conectado, mas sem internet'
indicatorName(strings, strings.indicatorLabelOffline); // 'Status da conexão: Sem internet'
```

- `STRINGS` holds the bundled `en`, `pt-BR` and `es` tables, equal to `docs/design/strings.md`.
- `resolveLocale` never throws. Any `pt` variant gives `pt-BR`, any `es-*` gives `es`, anything
  else (or nothing) gives `en`.
- `resolveStrings(locale, overrides)` merges a `Partial<OfflineStrings>` over the locale. An
  override set to `undefined` is ignored; an empty string is kept.
- `indicatorName` fills the literal `{status}` token and treats the label as plain text.

## Types for the UI packages

`OfflineUiOptions` (dismissal, locale, strings, indicator, banner, snackbar, motion, color scheme),
`PieceRenderProps<Theme = unknown>` (the render-props contract of
`docs/design/components.md`), `OfflineStrings`, `Locale`, `PieceName`, `DismissiblePiece`,
`IndicatorPosition`, `DismissOptions`, `RecheckOnReturnOptions`, `UseNetworkStatusResult` and
`OfflineDetectorProviderProps` are exported as types only.

## Privacy

This package sends nothing anywhere. The only network traffic is core's configurable
reachability probe.
