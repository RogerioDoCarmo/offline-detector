# offline-detector

Detect and show when a React or React Native app has no internet: a headless hook, callbacks, and
ready-made snackbar, banner, indicator and full-screen UI. Web and mobile, no native code.

> Status: pre-release. The four packages are built and tested, but their version is still 0.0.0 and
> nothing has been published to npm yet; the first release is pending. The design is in
> [`docs/superpowers/specs/2026-10-07-offline-detector-design.md`](docs/superpowers/specs/2026-10-07-offline-detector-design.md).

## Packages

| Package                                   | Purpose                                |
| ----------------------------------------- | -------------------------------------- |
| `@rogeriodocarmo/offline-detector-core`   | Framework-free state machine and probe |
| `@rogeriodocarmo/offline-detector-react`  | Provider, hooks, callbacks             |
| `@rogeriodocarmo/offline-detector-web`    | DOM UI                                 |
| `@rogeriodocarmo/offline-detector-native` | React Native UI                        |

## Privacy

The libraries collect no data. They make one small connectivity request that you can change or
switch off; see the [privacy policy](PRIVACY.md).

## License

MIT
