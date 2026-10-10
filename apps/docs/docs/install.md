---
id: install
title: Install
sidebar_position: 2
---

# Install

Pick the UI package for your platform and install only that one. It brings the React layer and the
core engine with it, and re-exports the hooks and types you need, so you import everything from it.

## Web

```bash
pnpm add @rogeriodocarmo/offline-detector-web
# or: npm install @rogeriodocarmo/offline-detector-web
# or: yarn add @rogeriodocarmo/offline-detector-web
```

Requires React and react-dom 18 or newer (peer dependencies). The package depends on
`@rogeriodocarmo/offline-detector-react` and `@rogeriodocarmo/offline-detector-core`, which pnpm,
npm and yarn install for you.

## React Native and Expo

```bash
npm install @rogeriodocarmo/offline-detector-native
# optional, for instant detection when the interface drops:
npm install @react-native-community/netinfo
# optional, for safe-area insets:
npm install react-native-safe-area-context
```

On Expo, use `npx expo install @react-native-community/netinfo react-native-safe-area-context` so
Expo picks the versions that match your SDK. On bare React Native, install the same packages and
run `pod install` on iOS.

The native package depends on the React layer and the core, so there is nothing else to add. It
requires React 18 or newer and React Native 0.73 or newer. There is no custom native code, no
Reanimated and no gesture-handler dependency, so nothing needs a development build beyond what
NetInfo itself needs.

## Only the engine

If you want your own UI, install the React layer and a platform adapter source, or just the core:

```bash
pnpm add @rogeriodocarmo/offline-detector-core
pnpm add @rogeriodocarmo/offline-detector-react
```

The core never touches `window`, `navigator` or React Native. See the
[core reference](./reference/core.md) and the [react reference](./reference/react.md).

## Check it works

Render the component once near the root (see the quick starts), then switch off your network or
use the browser's DevTools Network tab set to Offline. The pieces appear within a second. The
[live demo](https://rogeriodocarmo.github.io/offline-detector/demo/) has a **simulate offline**
control that works without touching the network.
