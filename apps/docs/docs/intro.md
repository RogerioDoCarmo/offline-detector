---
id: intro
title: Introduction
slug: /
sidebar_position: 1
---

# offline-detector

offline-detector tells a React or React Native app, and the person using it, when there is **no
internet**. It shows a calm snackbar with a Retry action, a banner and a status indicator, and an
opt-in full-screen state. It looks like the host app, can be re-themed through tokens, is
accessible by default and speaks English, Brazilian Portuguese and Spanish.

[Try the live demo](https://rogeriodocarmo.github.io/offline-detector/demo/) to see every option,
or go straight to the [web quick start](./web-quick-start.md) or the
[native quick start](./native-quick-start.md).

## Why not just read `navigator.onLine`?

Because "connected" is not "has internet". `navigator.onLine` and the operating system's network
flag only say that a network **interface** is up. A Wi-Fi network behind a captive portal, a router
whose uplink is dead and a mobile signal with no data all report "online" while every request
fails. An app that trusts that flag keeps showing spinners instead of telling the user what is
wrong.

offline-detector combines the fast signal from the platform (the interface) with a small
**reachability probe** that confirms real internet, and it reports why it thinks you are offline.

## The three states of "no internet"

| State                      | `status`  | `reason`       | What the user sees by default |
| -------------------------- | --------- | -------------- | ----------------------------- |
| No network connection      | `offline` | `no-interface` | "No internet"                 |
| Connected, but no internet | `offline` | `no-internet`  | "No internet"                 |
| Back online                | `online`  | `null`         | "Back online" for 4 seconds   |

The detector also has an `unknown` status before the first check completes. `isOnline` treats it as
online, so an app is assumed to be online until proven otherwise and nothing flashes at launch.

By default both offline reasons read "No internet". Turn on `distinguishReason` to say
"No network connection" or "Connected, but no internet" instead.

## What is in the box

| Package                                   | What it is                                                         |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `@rogeriodocarmo/offline-detector-core`   | The framework-free state machine and probe. No runtime dependency. |
| `@rogeriodocarmo/offline-detector-react`  | Provider, hooks, dismissal state and the bundled strings.          |
| `@rogeriodocarmo/offline-detector-web`    | The web UI: snackbar, banner, indicator, full-screen, `--od-*`.    |
| `@rogeriodocarmo/offline-detector-native` | The React Native UI. No native code, no Reanimated.                |

Most apps install one UI package (web or native) and never touch the others directly.

## How it behaves

- The app launches online and shows nothing. Pieces appear only when the connection is lost.
- Each transition is announced to screen readers once, politely, and never with `role="alert"`.
- Every piece can be swiped away (left or right) and also dismissed with a button or the keyboard.
  A dismissed piece returns on the next status change. See [Dismissal](./dismissal.md).
- Re-checking when the user returns to the app is opt-in per screen. See
  [Re-check on return](./recheck-on-return.md).
- The only network traffic is the configurable reachability probe. See [Privacy](./privacy.md).

## Where to go next

1. [Install](./install.md) the packages for your platform.
2. Follow the [web](./web-quick-start.md) or [native](./native-quick-start.md) quick start.
3. Look up any prop or hook in the [reference](./reference/web.md).
4. Read the [FAQ](./faq.md) if something surprises you.
