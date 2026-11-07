---
id: compare
title: Compared with the alternatives
sidebar_position: 1.5
---

# Compared with the alternatives

There are a few common ways to know whether an app is online. Each is the right answer for some
apps. This page says what each one tells you, so you can pick.

## What each option tells you

| Option                             | What it reports                                                               | What it leaves to you                                    |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `navigator.onLine` and its events  | A network interface is up                                                     | Whether any request works, and all of the UI             |
| NetInfo alone (React Native)       | The interface type and `isInternetReachable`, from its own reachability check | The UI, and a web version                                |
| Your own hook with a `fetch` probe | Whatever you build                                                            | Backoff, overlapping checks, hydration, accessibility    |
| offline-detector                   | Real internet, with the reason, on web and React Native                       | Nothing to build for the common case; slots for the rest |

NetInfo's check sends one request, a `HEAD` to `https://clients3.google.com/generate_204` by
default, and repeats it every 5 seconds while the internet was not reachable and every 60 seconds
while it was. All of that is configurable with `NetInfo.configure`.

## When something simpler is enough

- You only need to know that the network interface changed: use `navigator.onLine` or NetInfo
  directly. offline-detector also has an `interface-only` mode that makes no request, see
  [Privacy](./privacy.md).
- You already have a design for the offline state and only need the status: use the headless
  `useNetworkStatus` hook from the React package and render your own piece.

## What offline-detector adds

- **One state machine for web and native.** The framework-free core runs the same logic on both, so
  the two apps behave the same way.
- **A probe that is hard to fool.** It checks two hosts by default and reports offline only when
  every URL fails. A failing check retries after 1 second and backs off to a 30 second cap, and an
  interface-down event overrides a check that is still running.
- **No false alarms at launch.** The state is `unknown` until the first check completes, `unknown`
  counts as online, and "Back online" is shown only after a real loss.
- **Ready-made, accessible UI.** A snackbar with Retry, a banner, an indicator and an opt-in
  full-screen state, in English, Brazilian Portuguese and Spanish, re-themed with tokens or
  replaced with your own components through [slots](./slots.md).

On React Native it builds on NetInfo: you pass NetInfo in, and the library adds the probe and the
UI. See the [native quick start](./native-quick-start.md).
