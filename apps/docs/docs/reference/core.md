---
id: core
title: Core reference
sidebar_label: core
sidebar_position: 1
---

# `@rogeriodocarmo/offline-detector-core`

The framework-free detection engine: a small state machine that tells you whether the app has
**real internet**. It has no runtime dependencies and never touches the DOM, `window`, `navigator`
or React Native. Platforms plug in through a `PlatformAdapter`; the React, web and native packages
build on it.

"Offline" means no real internet. Wi-Fi, Ethernet or cellular that is connected but carries no data
counts as offline.

## How detection works

- The **interface signal** from the adapter is the fast one. Interface down means `offline` with
  reason `no-interface`, with no probe needed.
- With the interface up, a **probe** confirms real reachability. The URLs are tried in order and the
  first success wins (`online`). If all fail or time out, the state is `offline` with reason
  `no-internet`.
- While **online**, the probe repeats every `intervalMs` (default 30000 ms).
- While **offline**, it retries after 1000 ms, doubling up to a 30000 ms cap. Going online resets
  the backoff.
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

## `createOfflineDetector(options)`

| Option                                       | Default              | Notes                                                                                       |
| -------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `adapter`                                    | required             | A `PlatformAdapter`.                                                                        |
| `probe.urls`                                 | `DEFAULT_PROBE_URLS` | A `readonly string[]`, tried in order. Not empty unless `mode` is `interface-only`.         |
| `probe.timeoutMs`                            | `5000`               | Per URL. The request is aborted at the timeout.                                             |
| `probe.intervalMs`                           | `30000`              | Re-probe period while online.                                                               |
| `probe.method`                               | `'HEAD'`             | `'HEAD'` or `'GET'`.                                                                        |
| `probe.mode`                                 | `'probe'`            | `'interface-only'` never calls `fetch` and schedules no timers.                             |
| `onOffline(state)`                           | none                 | See callbacks below.                                                                        |
| `onOnline(state)`                            | none                 | See callbacks below.                                                                        |
| `onChange(state, previous)`                  | none                 | See callbacks below.                                                                        |
| `onError(error)`                             | none                 | Receives exceptions thrown by listeners and callbacks. If it throws too, that is swallowed. |
| `fetch`, `now`, `setTimeout`, `clearTimeout` | the globals          | Injectable for tests. On web, wrap `fetch` to add `mode: 'no-cors'`.                        |

`DEFAULT_PROBE_URLS` is `['https://cp.cloudflare.com/generate_204',
'https://www.gstatic.com/generate_204']`. Creating a detector in probe mode with no `fetch`
available, or with an empty `urls` list, throws.

A probe succeeds when `fetch` resolves with **anything**: the resolved value is ignored, so any
completed HTTP response (a 404, a 500, a `no-cors` opaque response) means the network is
reachable. Only a rejection (network error, TLS failure, abort) or a timeout counts as a failure.
The request is made as `fetch(url, { method, signal, credentials: 'omit' })`, so it sends no
cookies. `ProbeFetch` is `(url, init) => Promise<unknown>`.

## `OfflineDetectorInstance`

What `createOfflineDetector` returns.

| Member                              | Behaviour                                                                                                                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getState(): OfflineState`          | The current state. A new object on every change.                                                                                                                                                                  |
| `subscribe(listener)`               | `listener(state, previous)` runs on every change. Returns an unsubscribe function.                                                                                                                                |
| `start()`                           | Subscribes to the adapter, runs a check now and schedules the rest. Idempotent.                                                                                                                                   |
| `stop()`                            | Clears the timer, unsubscribes, aborts the in-flight request and clears its timeout timer, and discards its result. Safe to repeat.                                                                               |
| `checkNow(): Promise<OfflineState>` | Forces a check. Concurrent calls share one probe. If an interface-up event overtakes the check, the promise resolves with the overtaking check's result, never a still-`checking` state. Works without `start()`. |

## `OfflineState`

```ts
type OfflineState = {
  status: 'online' | 'offline' | 'unknown'; // unknown only until the first check completes
  reason: 'no-interface' | 'no-internet' | null; // non-null exactly when offline
  checking: boolean;
  lastChecked: number | null; // now() when the last check completed
  lastOnlineAt: number | null; // now() when last seen online
};
```

`isOnline(state)` is `true` while the status is `unknown`: an app is assumed online until proven
otherwise.

## Callbacks

They fire only on real **status** transitions, never on every probe:

- `onChange(state, previous)` fires on every status change, including the first result.
- `onOffline(state)` fires when the status becomes `offline`, including a first offline result.
- `onOnline(state)` fires when the status goes from `offline` back to `online`. It does **not**
  fire when the first result is `online`: nothing was lost.
- A change of reason alone (`no-interface` to `no-internet`) is not a status transition.
  Subscribers hear about it; the callbacks do not.

Exceptions thrown by a listener or callback are caught and passed to `onError`, so one faulty
consumer cannot break detection. An `onError` that throws is swallowed too.

## `PlatformAdapter`

```ts
interface PlatformAdapter {
  isInterfaceUp(): boolean | Promise<boolean>;
  subscribeInterface(listener: (up: boolean) => void): () => void;
  subscribeForeground(listener: () => void): () => void;
}
```

- An interface-down event is applied immediately and overrides any probe in flight. An interface-up
  event triggers an immediate check.
- A foreground return triggers `checkNow()` only when `recheckOnForeground: true` is passed (default
  `false`). The React layer wires this per screen through `useRecheckOnReturn`.
- If `isInterfaceUp()` throws or rejects it is treated as "up" and the probe decides.

## Export index {#export-index}

Everything the package exports, values and types.

<!--EXPORTS-->

- `ClearTimeoutFn` (type)
- `DEFAULT_PROBE_URLS` (constant)
- `OfflineDetectorInstance` (type)
- `OfflineDetectorOptions` (type)
- `OfflineReason` (type)
- `OfflineState` (type)
- `OfflineStatus` (type)
- `PlatformAdapter` (type)
- `ProbeFetch` (type)
- `ProbeOptions` (type)
- `SetTimeoutFn` (type)
- `StateListener` (type)
- `TimerHandle` (type)
- `createOfflineDetector` (function)
- `isOnline` (function)
- `packageName` (constant)

<!--/EXPORTS-->
