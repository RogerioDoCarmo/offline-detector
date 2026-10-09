---
id: native-quick-start
title: Native quick start
sidebar_position: 4
---

# Native quick start

Pass NetInfo from your app and the safe-area insets from your layout. This works the same on Expo
and on bare React Native.

```tsx
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-native';

function Root() {
  const insets = useSafeAreaInsets();
  return (
    <OfflineDetector netInfo={NetInfo} insets={insets}>
      <App />
    </OfflineDetector>
  );
}

export default function Main() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
```

Launching online shows nothing. When the app goes offline the three pieces appear with "No
internet". When it comes back, "Back online" shows for `recoveryMs` (4 seconds) and never at
launch. The [live demo](https://rogeriodocarmo.github.io/offline-detector/demo/) shows the web
version of the same behaviour.

## NetInfo is passed in, not required

The package never imports `@react-native-community/netinfo` itself, so Metro never treats it as a
dependency you did not install. Pass the module as the `netInfo` prop, as above.

Without it the network interface is assumed to be up and only the reachability probe decides, which
is slower to notice that you went offline. Development builds log one warning. To take full control,
pass your own `adapter` (see `createNativeAdapter` in the [native reference](./reference/native.md)).

## Safe-area insets

Pass `insets` from `useSafeAreaInsets()`. The default is `defaultInsets()`: the Android status bar
height on top and zero elsewhere. That is wrong on notched iPhones, so pass insets there.

## Re-checking on return

Retry always shows "Checking…" at once. A background re-check when the user returns to the app
shows it only when a screen opts in:

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-react';

function Checkout() {
  useRecheckOnReturn({ checkingFeedback: 'brief' });
  return <Pay />;
}
```

See [Re-check on return](./recheck-on-return.md).

## Not verified on a device

The behaviour is covered by Jest integration tests with the real React package. Flows on a real
device or emulator (Maestro) belong to the Expo demo app, and have not been run for this release of
the documentation.
