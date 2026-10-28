# offline-detector

[![status: early development (0.x)](<https://img.shields.io/badge/status-early%20development%20(0.x)-orange>)](https://github.com/RogerioDoCarmo/offline-detector#readme)

Detect and show when a React or React Native app has no internet: a headless hook, callbacks, and
ready-made snackbar, banner, indicator and full-screen UI. Web and mobile, no native code.

> Status: **early development (0.x)**. Published on npm and usable, but the API may still change
> before 1.0; while the version starts with 0, breaking changes ship in a minor release. The current
> version is on the
> [releases page](https://github.com/RogerioDoCarmo/offline-detector/releases). The design is in
> [`docs/superpowers/specs/2026-10-07-offline-detector-design.md`](docs/superpowers/specs/2026-10-07-offline-detector-design.md).

- [Documentation](https://rogeriodocarmo.github.io/offline-detector/) in English, Portuguese and Spanish
- [Live demo](https://rogeriodocarmo.github.io/offline-detector/demo/)
- [Privacy policy](https://rogeriodocarmo.github.io/offline-detector/privacy-policy.html)

## Packages

| Package                                                                                                            | Purpose                                |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| [`@rogeriodocarmo/offline-detector-core`](https://www.npmjs.com/package/@rogeriodocarmo/offline-detector-core)     | Framework-free state machine and probe |
| [`@rogeriodocarmo/offline-detector-react`](https://www.npmjs.com/package/@rogeriodocarmo/offline-detector-react)   | Provider, hooks, callbacks             |
| [`@rogeriodocarmo/offline-detector-web`](https://www.npmjs.com/package/@rogeriodocarmo/offline-detector-web)       | DOM UI                                 |
| [`@rogeriodocarmo/offline-detector-native`](https://www.npmjs.com/package/@rogeriodocarmo/offline-detector-native) | React Native UI                        |

Install the one for your platform: `web` or `native` already include the React layer and the core.

## Privacy

The libraries collect no data. They make one small connectivity request that you can change or
switch off; see the [privacy policy](PRIVACY.md).

## License

MIT
