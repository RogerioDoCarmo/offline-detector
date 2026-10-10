# @rogeriodocarmo/offline-detector-core

Part of [offline-detector](https://github.com/RogerioDoCarmo/offline-detector). The
framework-free detection engine: a small state machine that tells you whether the app has
**real internet**. It has no runtime dependencies and never touches the DOM, `window`,
`navigator` or React Native. Platforms plug in through a `PlatformAdapter`; the React,
web and native packages build on this.

"Offline" means no real internet. Wi-Fi, Ethernet or cellular that is connected but carries
no data counts as offline.

## How detection works

- The **interface signal** (from the adapter) is the fast signal. Interface down means
  `offline` with reason `no-interface`, with no probe needed.
- With the interface up, a **probe** confirms real reachability. The URLs are tried in order
  and the first success wins (`online`). If all fail or time out, the state is `offline` with
  reason `no-internet`.
- While **online**, the probe repeats every `intervalMs` (default 30000 ms).
- While **offline**, it retries after 1000 ms, doubling up to a 30000 ms cap
  (1 s, 2 s, 4 s, 8 s, 16 s, 30 s, 30 s, ...). Going online resets the backoff.
- `interface-only` mode never calls `fetch`.

## Usage

```ts
import { createOfflineDetector, isOnline } from '@rogeriodocarmo/offline-detector-core';

const detector = createOfflineDetector({
  adapter, // a PlatformAdapter, see below
  probe: { urls: ['https://cp.cloudflare.com/generate_204'], timeoutMs: 5000 },
  onOffline: (state) => console.log('offline', state.reason),
  onOnline: (state) => console.log('back online', state.lastOnlineAt),
  onChange: (state, previous) => console.log(previous.status, '->', state.status),
});

const unsubscribe = detector.subscribe((state) => render(isOnline(state)));
detector.start();
// later
detector.stop();
unsubscribe();
```

## API

### `createOfflineDetector(options): OfflineDetectorInstance`

| Option                                       | Default                                                                              | Notes                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `adapter`                                    | required                                                                             | A `PlatformAdapter`.                                                                        |
| `probe.urls`                                 | `['https://cp.cloudflare.com/generate_204', 'https://www.gstatic.com/generate_204']` | A `readonly string[]`, tried in order. Must not be empty unless `mode` is `interface-only`. |
| `probe.timeoutMs`                            | `5000`                                                                               | Per URL. The request is aborted at the timeout.                                             |
| `probe.intervalMs`                           | `30000`                                                                              | Re-probe period while online.                                                               |
| `probe.method`                               | `'HEAD'`                                                                             | `'HEAD'` or `'GET'`.                                                                        |
| `probe.mode`                                 | `'probe'`                                                                            | `'interface-only'` never calls `fetch` and schedules no timers.                             |
| `onOffline(state)`                           | none                                                                                 | See "Callbacks".                                                                            |
| `onOnline(state)`                            | none                                                                                 | See "Callbacks".                                                                            |
| `onChange(state, previous)`                  | none                                                                                 | See "Callbacks".                                                                            |
| `onError(error)`                             | none                                                                                 | Receives exceptions thrown by listeners and callbacks. If it throws too, that is swallowed. |
| `fetch`, `now`, `setTimeout`, `clearTimeout` | the globals (`fetch`, `Date.now`, timers)                                            | Injectable for tests. On web, wrap `fetch` to add `mode: 'no-cors'`.                        |

Creating a detector in probe mode with no `fetch` available, or with an empty `urls`
list, throws.

A probe succeeds when `fetch` resolves with **anything**: the resolved value is ignored, so any
completed HTTP response (a 404, a 500, a `no-cors` opaque response) means the network is
reachable. Only a rejection (network error, TLS failure, abort) or a timeout counts as a failure.
The request is made as `fetch(url, { method, signal, credentials: 'omit' })`, so it sends no
cookies. `ProbeFetch` is `(url, init) => Promise<unknown>`.

### `OfflineDetectorInstance`

| Member                              | Behavior                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getState(): OfflineState`          | The current state. A new object on every change.                                                                                                                                                                                                                                                                                    |
| `subscribe(listener)`               | `listener(state, previous)` runs on **every** state change (including `checking` flips and new timestamps). Returns an unsubscribe function.                                                                                                                                                                                        |
| `start()`                           | Subscribes to the adapter, runs a check now and schedules the rest. Calling it twice is a no-op.                                                                                                                                                                                                                                    |
| `stop()`                            | Clears the timer, unsubscribes from the adapter, aborts the in-flight request and clears its timeout timer, discards its result and clears `checking`. Safe to call repeatedly, and to `start()` again afterwards.                                                                                                                  |
| `checkNow(): Promise<OfflineState>` | Forces a check now and resolves with the new state. While a check is in flight, concurrent calls share it (exactly one probe). If an interface-up event overtakes the check, the promise resolves with the overtaking check's result, never a still-`checking` state. Works without `start()`. The react layer calls this directly. |

### `OfflineState`

```ts
type OfflineState = {
  status: 'online' | 'offline' | 'unknown'; // unknown only until the first check completes
  reason: 'no-interface' | 'no-internet' | null; // non-null exactly when offline
  checking: boolean;
  lastChecked: number | null; // now() when the last check completed
  lastOnlineAt: number | null; // now() when last seen online
};
```

`isOnline(state): boolean` is `true` while `unknown` (an app is assumed online until proven
otherwise).

### Callbacks

They fire only on real **status** transitions, never on every probe:

- `onChange(state, previous)` fires on every status change, including the very first result
  (`unknown` to `online` or `offline`).
- `onOffline(state)` fires when the status becomes `offline`, including when the first
  result is offline.
- `onOnline(state)` fires when the status goes from `offline` back to `online`. It does
  **not** fire when the very first result is `online`: nothing was lost, so there is nothing
  to recover from.
- A change of reason alone (`no-interface` to `no-internet`) is not a status transition.
  Subscribers hear about it; the callbacks do not.

Exceptions thrown by a listener or callback are caught and passed to `onError` (swallowed if
there is none), so one faulty consumer cannot break detection or the other listeners.

### `PlatformAdapter`

The seam web and native implement:

```ts
interface PlatformAdapter {
  isInterfaceUp(): boolean | Promise<boolean>;
  subscribeInterface(listener: (up: boolean) => void): () => void;
  subscribeForeground(listener: () => void): () => void;
}
```

- An interface-down event is applied immediately (no probe) and overrides any probe in
  flight. An interface-up event triggers an immediate check.
- A foreground return triggers an immediate `checkNow()` only when `recheckOnForeground: true` is
  passed (default `false`). Re-checking on return is opt-in; the react layer wires it through
  `useRecheckOnReturn` per screen, so by default the detector does not even subscribe to
  `subscribeForeground`.
- If `isInterfaceUp()` throws or rejects it is treated as "up" and the probe decides.

## Privacy

The only network traffic is the configurable probe request. Nothing is collected or sent
anywhere else.
