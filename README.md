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
- [Compared with the alternatives](https://rogeriodocarmo.github.io/offline-detector/compare)
- [30 second promo video](docs/media/offline-detector-promo-30s-16x9.mp4)
- [Launch post on LinkedIn](https://lnkd.in/p/dFQrxwYq) (in Portuguese)
- [Privacy policy](https://rogeriodocarmo.github.io/offline-detector/privacy-policy.html)

## Quick start

Render the component once, near the root. It needs no provider and no adapter.

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web'; // or '-native'

export function Root() {
  return (
    <OfflineDetector>
      <App />
    </OfflineDetector>
  );
}
```

The app launches online and shows nothing. When the connection really drops, a snackbar, a banner and
an indicator appear; when it returns, a "Back online" snackbar shows briefly. On React Native, also
pass NetInfo; see the [native quick start](https://rogeriodocarmo.github.io/offline-detector/native-quick-start).

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

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the quality
bar.

## License

MIT
