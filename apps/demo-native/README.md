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

## Storybook on the device

An on-device [Storybook for React Native](https://github.com/storybookjs/react-native) 10 lives in
this app, in [`.rnstorybook/`](./.rnstorybook). It shows the pieces and the `<OfflineDetector>`
states, imported from `@rogeriodocarmo/offline-detector-native` by name, with a fake adapter and a
fake probe, so nothing touches the network.

| Script               | What it does                                                         |
| -------------------- | -------------------------------------------------------------------- |
| `storybook`          | `expo start` with `EXPO_PUBLIC_STORYBOOK=true`: Storybook, not demo  |
| `storybook:generate` | `sb-rn-get-stories`: rewrites `.rnstorybook/storybook.requires.js`   |
| `bundle:storybook`   | `expo export --platform android` with the flag on (a bundling proof) |

**One app, two modes, no native code.** `index.ts` registers the demo or the Storybook root from
`process.env.EXPO_PUBLIC_STORYBOOK === 'true'`, which Metro inlines at build time. With the flag
off, `metro.config.js` runs `withStorybook({ enabled: false })`, which resolves every `@storybook/*`
module to an empty module, so the demo bundle carries no Storybook code. Set the flag when you
start or export; it is not a runtime toggle.

```sh
pnpm install && pnpm build
pnpm --filter @offline-detector/demo-native storybook      # Expo Go, emulator or device
```

Stories: Snackbar, Banner, Indicator and FullScreen in every phase they have (offline, checking,
recovered), and `OfflineDetector/States` (online, offline, offline distinguishing the reason,
recovering, checking, full screen, dismissed, not dismissible, dark, Portuguese, Spanish with
reduced motion). The Controls panel changes locale (en, pt-BR, es), colour scheme, reduced motion
and `dismissible` on every story; `onRetry` and `onDismiss` report to the Actions panel.

**Why the lite UI.** The default Storybook UI needs Reanimated, gesture-handler and bottom-sheet,
which this repo does not allow. `@storybook/react-native-ui-lite` and `liteMode` replace it. pnpm
still installs those peers into its store, so `metro.config.js` makes them unresolvable while
Storybook is on (the controls addon falls back to plain inputs). `metro.config.js` also repeats
liteMode's "default UI" check on a normalised path, because the check misses Windows paths.

**Generated file.** Metro rewrites `.rnstorybook/storybook.requires.js` on every start with the
flag on, unformatted. Run `pnpm format` before committing; the committed copy is formatted so a
clean checkout type-checks.

**Storybook in Maestro (manual).** Storybook mode needs its own APK, so no workflow runs it; a CI
job for it is future work. Locally:

```sh
cd apps/demo-native
EXPO_PUBLIC_STORYBOOK=true npx expo prebuild --platform android --clean
EXPO_PUBLIC_STORYBOOK=true npx expo run:android --variant release
```

**Not verified.** Nothing here ran on a device or an emulator: the Storybook UI, the on-device
controls, gestures and Expo Go compatibility are untested. Only the Android bundle was proven
(below). The controls addon adds two community native modules (slider, date-time picker); whether
Expo Go ships matching versions was not checked, so use a development build if Expo Go complains.

### Bundling results with the flag off and on

`expo export --platform android`, Windows, Expo SDK 57:

| EXPO_PUBLIC_STORYBOOK | Modules | Hermes bundle | Notes                                           |
| --------------------- | ------- | ------------- | ----------------------------------------------- |
| off                   | 606     | 1.5 MB        | demo as before (605) plus one empty stub module |
| `true`                | 1239    | 5.0 MB        | no Reanimated or bottom-sheet module            |
