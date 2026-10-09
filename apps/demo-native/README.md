# @offline-detector/demo-native

Expo demo of [`@rogeriodocarmo/offline-detector-native`](../../packages/native/README.md). A
control panel drives every public option of `<OfflineDetector>`; the packages are consumed through
their published `exports` (`dist`), not from source. Private, never published.

- **Expo SDK 57, React Native 0.86.3, React 19.2.3.** No Expo SDK supports React Native 0.87
  yet (SDK 57 pairs with 0.86, SDK 58 is a pre-release on 0.88). The packages accept React Native
  0.73 and newer, so SDK 57 is the closest stable match. Metro resolves `react` and `react-native`
  to this app's copy so the bundle never holds two Reacts.
- No custom native code, no Reanimated, no `react-native-web`.

## Run it

```sh
pnpm install
pnpm build                       # builds the packages (the app imports their dist)
pnpm --filter @offline-detector/demo-native dev     # expo start
```

Open it in Expo Go, a development build or an emulator. (Expo Go includes NetInfo and safe-area
context.)

## What the panel controls

`locale` (en, pt-BR, es), `distinguishReason`, `dismissible`, `fullScreen` (off, on, with
"Continue offline"), `colorScheme`, `motion`, `recoveryMs`, `probe.urls`, `probe.intervalMs`, a
`slots` example (custom snackbar), `useRecheckOnReturn` with `checkingFeedback` `brief` or `none`
(the "recheck" screen), a switch to pass NetInfo or leave it out, and a switch between the stub
probe and the real network.

**Simulate offline** drives a stub probe, so the demo works without touching the network. Real
airplane mode works as well, because NetInfo is passed in from the host. The only network traffic
the package can make is the configurable reachability probe; the demo's default probe is the stub.
Probe settings are read once per mount, so changing them remounts the detector.

Safe-area insets come from `react-native-safe-area-context` and are passed as `insets`.

## Scripts

| Script               | What it does                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| `build`, `typecheck` | `tsc --noEmit`. Offline-safe; this is what root `pnpm build` runs in CI. |
| `dev`                | `expo start`                                                             |
| `bundle`             | `expo export --platform android` (a Hermes bundle; no emulator needed)   |
| `bundle:ios`         | `expo export --platform ios`                                             |

## Metro bundling results

`expo export` on Windows, Expo SDK 57, no warnings printed:

| Variant                                            | Platform | Modules | Hermes bundle |
| -------------------------------------------------- | -------- | ------- | ------------- |
| NetInfo imported and passed as `netInfo`           | android  | 605     | 1.5 MB        |
| NetInfo not imported, not passed (still installed) | android  | 596     | 1.5 MB        |
| NetInfo not passed and absent from `node_modules`  | android  | 596     | 1.5 MB        |
| NetInfo not passed and absent from `node_modules`  | ios      | 598     | 1.5 MB        |
| NetInfo imported and passed as `netInfo`           | ios      | n/a     | 1.5 MB        |

The last two android rows produced the identical bundle file, so the native package never
requires NetInfo itself. The JS bundle holds one copy of React (19.2.3) even though the packages
were built against 19.3.

## Maestro (device flows)

Flows live in [`.maestro/`](./.maestro): offline shows "No internet", swipe dismisses, Retry,
recovery shows "Back online", and the pt-BR strings. They are driven by `testID`s and stable text
and target the app id `dev.rogeriodocarmo.offlinedetector.demo`.

To run them locally you need Maestro, Java 17 and an Android emulator or device:

```sh
pnpm install && pnpm build
cd apps/demo-native
npx expo prebuild --platform android      # generates android/, which is gitignored
npx expo run:android --variant release    # installs the app with its JS bundled in
maestro test .maestro                     # all flows
maestro test .maestro/recovery.yaml       # one flow
```

`.github/workflows/maestro.yml` does the same on an emulator in CI. It runs on pushes to `main`
and `develop` and on manual dispatch, never on pull requests. `expo prebuild` happens in CI only
and the generated `android/` and `ios/` folders are never committed.

**Not verified.** The flows have not been run: they were written without an emulator, a device or
Maestro available. Expect to adjust timeouts or the swipe direction on the first real run.
