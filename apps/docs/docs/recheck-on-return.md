---
id: recheck-on-return
title: Re-check on return
sidebar_position: 5
---

# Re-check on return

When someone comes back to your app after a while (the tab is visible again, the window regains
focus, or React Native's `AppState` becomes active), the last probe may be old. `useRecheckOnReturn`
re-probes at once instead of waiting for the next scheduled check.

It is **opt-in per screen**. By default the detector does not even subscribe to the foreground
signal, so a screen that does not care pays nothing.

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-web'; // or '-native'

function Checkout() {
  const online = useRecheckOnReturn({
    checkingFeedback: 'brief',
    onResult: (isOnline) => console.log('back in the app, online:', isOnline),
  });
  return <Pay disabled={!online} />;
}
```

## Options

| Option             | Default  | Notes                                                                   |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| `checkingFeedback` | `'none'` | `'brief'` or `'none'`. Whether the return check is visible.             |
| `onResult`         | none     | `(isOnline: boolean) => void`, called after each return-triggered check |

The hook returns the latest known boolean: `false` only when the app is offline. It updates with
every state change, not only after a return.

## `'brief'` versus `'none'`

| Source of the check                      | `'none'`                     | `'brief'`                                               |
| ---------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| Re-probe on return to the app            | nothing visible              | the pieces show a short "Checking…" state               |
| The user presses Retry                   | the button shows "Checking…" | same (a pressed Retry always shows it)                  |
| A scheduled back-off probe while offline | nothing visible              | nothing visible (only return-triggered checks)          |
| Online, nothing wrong                    | nothing visible              | nothing visible: a successful brief check shows nothing |

Rules for `'brief'`:

- The "Checking…" state shows only if the check is still pending after **150 ms**, and once shown it
  stays for at least **400 ms**. That avoids a flash on a fast network and flicker on a slow one.
- It never moves layout: a spinner replaces the label inside the same box.

## Details worth knowing

- The hook subscribes with the adapter only while the component is mounted and unsubscribes on
  unmount. `onResult` is not called after unmount.
- Several mounted hooks share **one** probe, because the core de-duplicates concurrent checks.
- The core's own `recheckOnForeground` option stays off. This hook is the only place that
  re-checks on return.
- `useCheckingFeedback()` is for UI packages: it reports `'brief'` while a return check started by
  a `'brief'` hook is pending, and `'none'` otherwise.

See the [react reference](./reference/react.md) for the exact types.
