# @rogeriodocarmo/offline-detector-native

Part of [offline-detector](https://github.com/RogerioDoCarmo/offline-detector). Shows when a React
Native app has no internet: a snackbar with Retry, a banner and an indicator by default, plus an
opt-in full-screen state. "Offline" means no real internet: Wi-Fi that is connected but carries no
data counts as offline.

No native code, no Reanimated, no gesture-handler. Requires React 18+ and React Native 0.73+.

## Install

```sh
npm install @rogeriodocarmo/offline-detector-native @rogeriodocarmo/offline-detector-react
# optional, for instant detection when the interface drops:
npm install @react-native-community/netinfo
# optional, for safe-area insets:
npm install react-native-safe-area-context
```

On Expo use `npx expo install @react-native-community/netinfo react-native-safe-area-context`.
Bare React Native: install the same packages and run `pod install` on iOS.

## Quick start

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

This works the same on Expo and on bare React Native. Launching online shows nothing. When the app
goes offline the three pieces appear with "No internet"; when it comes back, "Back online" shows
for `recoveryMs` (4 seconds) and never at launch.

### NetInfo is passed in, not required

The package never imports `@react-native-community/netinfo` itself, so Metro never treats it as a
dependency you did not install. Pass the module as `netInfo`, as above. Without it the network
interface is assumed to be up and only the reachability probe decides; development builds log one
warning. Pass your own `adapter` (see `createNativeAdapter`) to take full control.

### Safe-area insets

Pass `insets` from `useSafeAreaInsets()`. The default is `defaultInsets()`: the Android status bar
height on top and zero elsewhere, which is wrong on notched iPhones, so pass insets there.

## Props

| Prop                                           | Notes                                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `netInfo`                                      | The NetInfo module. Ignored when `adapter` is given.                                           |
| `adapter`                                      | A `PlatformAdapter`. Default: `createNativeAdapter({ netInfo })`, built once.                  |
| `probe`, `fetch`                               | Reachability probe settings and transport (see the react package).                             |
| `onOffline`, `onOnline`, `onChange`, `onError` | Fire once per real status transition.                                                          |
| `initialStatus`, `detector`                    | As in the react package.                                                                       |
| `locale`, `strings`                            | `en`, `pt-BR`, `es`; default follows the device locale. `strings` overrides copy.              |
| `distinguishReason`                            | `true` says "No network connection" or "Connected, but no internet".                           |
| `fullScreen`                                   | `true`, or `{ continueOffline: true }` for the escape hatch. Off by default.                   |
| `onContinueOffline`                            | Fires when "Continue offline" is pressed.                                                      |
| `snackbar`, `banner`, `indicator`              | Per-piece options: `dismissible`, `banner.position`/`overlay`, `indicator.position`/`variant`. |
| `dismissible`, `onDismiss`                     | Pieces can be swiped away (default); a dismissed piece returns on the next transition.         |
| `motion`, `colorScheme`                        | `auto`, `reduced`, `full`; `auto`, `light`, `dark`.                                            |
| `theme`                                        | `Partial<OfflineTheme>` token overrides.                                                       |
| `insets`                                       | `Partial<Insets>` safe-area insets.                                                            |
| `recoveryMs`                                   | How long "Back online" shows. Default 4000.                                                    |
| `slots`                                        | Replace a piece entirely (below).                                                              |

The host content is hidden from assistive technology while the full-screen state shows.

## Checking feedback

Retry always shows "Checking…" at once. A background re-check on returning to the app shows it only
when a screen opts in:

```tsx
useRecheckOnReturn({ checkingFeedback: 'brief' }); // from the react package
```

## Slots

A slot replaces its piece and receives the `PieceRenderProps` contract: `state`, `phase`,
`message`, `actions` (`retry`, `dismiss`, `continueOffline`), `strings`, `theme`, `visible` and
`rootProps`.

```tsx
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import type { OfflineTheme } from '@rogeriodocarmo/offline-detector-native';

function MyToast({ message, actions, rootProps }: PieceRenderProps<OfflineTheme>) {
  return (
    <Pressable {...rootProps} onPress={actions.retry}>
      <Text>{message}</Text>
    </Pressable>
  );
}

<OfflineDetector netInfo={NetInfo} slots={{ snackbar: MyToast }}>
  <App />
</OfflineDetector>;
```

## Not verified on a device

The behaviour is covered by Jest integration tests with the real react package. Device flows
(Maestro) belong to the Expo demo app.
