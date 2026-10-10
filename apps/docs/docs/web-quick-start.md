---
id: web-quick-start
title: Web quick start
sidebar_position: 3
---

# Web quick start

Render `<OfflineDetector>` once, near the root. It needs no provider and no adapter.

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
snackbar ("No internet", with Retry), a banner and an indicator appear. When it returns, a "Back
online" snackbar shows for four seconds.

Try it in the [live demo](https://rogeriodocarmo.github.io/offline-detector/demo/), or open your
browser's DevTools, Network tab, and choose Offline.

## Read the status anywhere

The hooks work anywhere inside `<OfflineDetector>`, and the web package exports them:

```tsx
import { useNetworkStatus } from '@rogeriodocarmo/offline-detector-web';

function SaveButton() {
  const { isOnline, reason, checkNow } = useNetworkStatus();
  return (
    <button disabled={!isOnline} onClick={() => void checkNow()}>
      {isOnline ? 'Save' : `Offline (${reason})`}
    </button>
  );
}
```

The web package re-exports the hooks of the React layer, so it is the only package to install and
import from. See the [react reference](./reference/react.md) for every hook.

## Common options

```tsx
<OfflineDetector
  locale="pt-BR"
  distinguishReason
  fullScreen={{ continueOffline: true }}
  probe={{ urls: ['https://example.com/health'], intervalMs: 60000 }}
  onOffline={(state) => console.log('offline', state.reason)}
>
  <App />
</OfflineDetector>
```

| Option              | What it does                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| `locale`            | `en`, `pt-BR` or `es`. Variants such as `pt` and `es-MX` resolve.                     |
| `distinguishReason` | Say why: "No network connection" or "Connected, but no internet".                     |
| `fullScreen`        | An opt-in full-screen state with Try again and, optionally, an escape.                |
| `probe`             | Probe URLs, timeout, interval, method and mode. See [Privacy](./privacy.md).          |
| `onContinueOffline` | Called when the user presses "Continue offline" (or Escape) on the full-screen state. |
| `nonce`             | CSP nonce for the inline `<style>` element. See [Server rendering](./ssr.md).         |
| `dismissible`       | Turn swipe and Dismiss off for every piece. See [Dismissal](./dismissal.md).          |

The full list is in the [web reference](./reference/web.md). On Next.js, read the notes on
[server rendering](./ssr.md): the component must live in a client component.
