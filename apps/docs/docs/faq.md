---
id: faq
title: FAQ
sidebar_position: 11
---

# FAQ

## Does it show anything when the app starts online?

No. The status is `unknown` until the first check completes, and `isOnline` treats `unknown` as
online. "Back online" is only shown after a real loss: it never appears at launch.

## Why does it say offline when my Wi-Fi is connected?

Because "connected" is not "has internet". If the interface is up but the probe fails on every URL,
the state is `offline` with reason `no-internet`. A captive portal, a dead router or a firewall that
blocks the probe hosts all look like this. Use your own probe URL if the defaults are blocked. See
[Privacy](./privacy.md).

## How long does it take to notice?

When the interface goes down it is immediate: no probe is needed. When the interface stays up but
the internet is gone, the next probe decides: every 30 seconds by default while online. While
offline it retries after 1 second, doubling up to a 30 second cap, and going online resets that.

## Can I run it without any network request?

Yes. Use `probe={{ mode: 'interface-only' }}`. It never calls `fetch` and schedules no timers, and
relies on the platform interface signal alone. See [Privacy](./privacy.md).

## Can I make it look like my app?

Yes. Override the `--od-*` tokens in CSS on the web, or pass a `theme` on native. See
[Theming](./theming.md). To replace a piece entirely, use [slots](./slots.md).

## Can I turn off the swipe?

Yes: `dismissible={false}` for all pieces, or `snackbar`, `banner` and `indicator` options for one.
Every piece also has a button or key alternative. See [Dismissal](./dismissal.md).

## Does the banner push my content down?

By default, yes: the banner is in flow. Use `banner={{ overlay: true }}` to float it over the
content. On the web, `--od-banner-height` reports its height while it shows.

## Does it work with Next.js, Expo or React Native Web?

Next.js: yes, from a client component ([notes](./ssr.md)). Expo and bare React Native: yes, passing
NetInfo ([native quick start](./native-quick-start.md)). The web package renders DOM elements and
does not depend on `react-native-web`; the native package targets React Native only.

## Why do I have to pass NetInfo myself?

So Metro never treats `@react-native-community/netinfo` as a hard dependency you did not install.
Without it, only the probe decides.

## Does it work in a web worker, Node or tests?

The core has no DOM or React Native imports and takes injectable `fetch`, `now` and timers, which
is how its own tests run. The UI packages need a React renderer.

## Is the Portuguese and Spanish text reviewed by native speakers?

The bundled strings follow the design notes for Brazilian and neutral international Spanish. The
documentation translations still need a native-speaker review. Corrections are welcome.

## Where is the source?

On [GitHub](https://github.com/RogerioDoCarmo/offline-detector). The packages are MIT licensed.
