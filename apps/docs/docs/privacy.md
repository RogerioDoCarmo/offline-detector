---
id: privacy
title: Privacy
sidebar_position: 12
---

# Privacy

**The only network traffic offline-detector creates is the configurable reachability probe.**
Nothing else is collected, stored or sent anywhere. There is no analytics, no crash reporting, no
account, and the packages set no cookie and write nothing to storage: even dismissal is kept in
memory only.

## What the probe contacts

To tell "connected" from "has internet", the detector requests a tiny URL that answers with an empty
`204 No Content`. By default it tries these, in order, and the first success wins:

1. `https://cp.cloudflare.com/generate_204`
2. `https://www.gstatic.com/generate_204`

These are the connectivity-check endpoints that operating systems and browsers use. The request
carries no body and no custom headers from this library, and no identifier. Like any web request, it
reveals the device's IP address and the usual request metadata to the host that answers, which is
the operator of that URL, not to the authors of this project.

| Setting            | Default            | Meaning                                                                |
| ------------------ | ------------------ | ---------------------------------------------------------------------- |
| `probe.urls`       | the two URLs above | Tried in order. Must not be empty unless the mode is `interface-only`. |
| `probe.method`     | `'HEAD'`           | `'HEAD'` or `'GET'`.                                                   |
| `probe.timeoutMs`  | `5000`             | Per URL. The request is aborted at the timeout.                        |
| `probe.intervalMs` | `30000`            | How often it re-probes while online.                                   |
| `probe.mode`       | `'probe'`          | `'interface-only'` makes no request at all.                            |

While offline, it retries after 1 second, doubling up to a cap of 30 seconds. A probe counts as a
success when the response is `ok` or opaque (what a `no-cors` request produces).

## Use your own endpoint

You can point the probe at a server you control, so no third party sees the request.

```tsx
<OfflineDetector probe={{ urls: ['https://status.example.com/generate_204'] }}>
  <App />
</OfflineDetector>
```

What your endpoint must do:

- Answer `HEAD` and `GET` quickly with a success status, ideally `204 No Content` and an empty
  body.
- Be served over HTTPS (a page served over HTTPS cannot call an HTTP URL).
- Not be cached by a service worker or CDN: the web probe fetch already sends `cache: 'no-store'`.
- Be reachable from where your users are. If you serve a different origin from your page, a content
  security policy with `connect-src` must allow it.

CORS: the default web probe fetch uses `mode: 'no-cors'`, so your endpoint does not need to send
`Access-Control-Allow-Origin`. You only need that header if you provide your own `fetch` that does
not use `no-cors` and reads the response.

A minimal endpoint, for example on Node:

```js
import { createServer } from 'node:http';

createServer((req, res) => {
  res.writeHead(204, { 'Cache-Control': 'no-store' });
  res.end();
}).listen(8080);
```

## Interface-only mode: no request at all

If you do not want any request, use the platform interface signal alone:

```tsx
<OfflineDetector probe={{ mode: 'interface-only' }}>
  <App />
</OfflineDetector>
```

In this mode `fetch` is never called and no timers are scheduled. The cost is accuracy: a connected
network without internet (a captive portal, a dead router) looks online, so the `no-internet`
reason never occurs.

## React Native: what NetInfo does

On React Native you pass a NetInfo module (`@react-native-community/netinfo`) to the component. It is
not part of offline-detector, and offline-detector neither controls nor sees what it requests.
According to its documentation, on platforms without native internet reachability, or when
`useNativeReachability` is turned off, NetInfo makes its own periodic request: by default a `HEAD`
request to `https://clients3.google.com/generate_204`, every 5 seconds when the internet was not
reachable and every 60 seconds when it was. Change or disable it with NetInfo's `configure()`.
Mobile operating systems also run their own connectivity checks, independent of any app.

## Where the documentation site stands

This documentation site is static. It sets no cookies, loads no analytics and fetches no fonts or
scripts from other hosts. It may keep interface preferences, such as the light or dark theme you
pick, in your browser's local storage; they stay on your device and are never sent. The live demo
has a simulate-offline control that drives a stub probe, so it can be tried without any network
request.

The project's privacy policy page is published beside this site at `/privacy-policy.html`, and
`PRIVACY.md` in the repository holds the same policy.
