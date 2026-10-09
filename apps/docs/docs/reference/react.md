---
id: react
title: React reference
sidebar_label: react
sidebar_position: 2
---

# `@rogeriodocarmo/offline-detector-react`

The React layer over the [core engine](./core.md): a provider, hooks, dismissal state, bundled
strings and the shared types the web and native packages build on. It has no DOM and no React
Native imports, so one copy works on both. A **platform adapter** from the web or native package
supplies the platform signals. Requires React 18 or newer.

## `OfflineDetectorProvider`

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
```

The provider creates **one** detector per mount, starts it in an effect and stops it when it
unmounts. React StrictMode's extra mount does not start a second check or leak a timer or listener.
Nothing runs during render, so server rendering and hydration are safe.

| Prop            | Notes                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| `adapter`       | Required. A `PlatformAdapter`. Read once per mount.                                           |
| `probe`         | `ProbeOptions` from core (`urls`, `timeoutMs`, `intervalMs`, `method`, `mode`). Read once.    |
| `fetch`         | The probe transport. Read once. On web use `createWebProbeFetch()`.                           |
| `onOffline`     | `(state) => void`. Fires when the status becomes `offline`, including a first offline result. |
| `onOnline`      | `(state) => void`. Fires when the status goes from `offline` back to `online`.                |
| `onChange`      | `(state, previous) => void`. Fires on every status change, including the first result.        |
| `onError`       | `(error) => void`. Receives exceptions thrown by callbacks and by `onResult`.                 |
| `initialStatus` | `'online'` or `'offline'`. SSR hint: what the first render assumes.                           |
| `detector`      | Test seam: use this detector instead of creating one. The callback props are not wired to it. |

The callbacks fire on real status transitions only, are read through a ref (passing a new function
on every render never restarts the detector), and `onOnline` does not fire when the first result is
online.

## Hooks

| Hook                       | Returns                                                  |
| -------------------------- | -------------------------------------------------------- |
| `useNetworkStatus()`       | `OfflineState` plus `isOnline: boolean` and `checkNow()` |
| `useOfflineDetector()`     | The core `OfflineDetector`, for advanced use             |
| `useRecheckOnReturn(opts)` | `boolean`, the latest known online state                 |
| `useCheckingFeedback()`    | `'brief'` or `'none'`, for UI packages                   |
| `useDismissals(options)`   | `{ isDismissed(piece), dismiss(piece) }`                 |

Every hook throws a clear error when used outside `<OfflineDetectorProvider>`.

```ts
type UseNetworkStatusResult = OfflineState & {
  isOnline: boolean; // true while status is 'unknown'
  checkNow(): Promise<OfflineState>; // concurrent calls share one probe
};
```

`useRecheckOnReturn` takes `{ checkingFeedback?: 'brief' | 'none'; onResult?: (isOnline) => void }`.
See [Re-check on return](../recheck-on-return.md).

## Dismissal helpers

```ts
interface DismissOptions {
  dismissible?: boolean; // global, default true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: 'snackbar' | 'banner' | 'indicator'): void;
}
```

`resolveDismissible(piece, options)` is pure: a per-piece value wins over the global one and the
default is `true`. `useDismissals(options)` keeps dismissals in memory until the next status
transition. See [Dismissal](../dismissal.md).

## Strings and locales

| Function                                             | What it does                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `STRINGS`                                            | The bundled `en`, `pt-BR` and `es` tables.                         |
| `resolveLocale(input?)`                              | `'en'`, `'pt-BR'` or `'es'`. Never throws.                         |
| `resolveStrings(locale?, overrides?)`                | The locale's table with a `Partial<OfflineStrings>` merged on top. |
| `offlineMessage(state, strings, distinguishReason?)` | The offline text; reason-aware when the third argument is `true`.  |
| `indicatorName(strings, label)`                      | The indicator's accessible name, with `{status}` filled in.        |

See [Languages and strings](../i18n.md).

## Types

`OfflineUiOptions` (dismissal, locale, strings, indicator, banner, snackbar, motion, colour scheme),
`PieceRenderProps<Theme = unknown>` (the render-props contract, see [Slots](../slots.md)),
`OfflineStrings`, `Locale`, `PieceName`, `DismissiblePiece`, `IndicatorPosition`, `DismissOptions`,
`RecheckOnReturnOptions`, `UseNetworkStatusResult` and `OfflineDetectorProviderProps` are exported as
types only.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `DismissiblePiece` (type)
- `DismissOptions` (type)
- `indicatorName` (function)
- `IndicatorPosition` (type)
- `Locale` (type)
- `OfflineDetectorProvider` (component)
- `OfflineDetectorProviderProps` (type)
- `offlineMessage` (function)
- `OfflineStrings` (type)
- `OfflineUiOptions` (type)
- `packageName` (constant)
- `PieceName` (type)
- `PieceRenderProps` (type)
- `RecheckOnReturnOptions` (type)
- `resolveDismissible` (function)
- `resolveLocale` (function)
- `resolveStrings` (function)
- `STRINGS` (constant)
- `useCheckingFeedback` (hook)
- `useDismissals` (hook)
- `useNetworkStatus` (hook)
- `UseNetworkStatusResult` (type)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
