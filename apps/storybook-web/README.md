# @offline-detector/storybook-web

Storybook 10 (`react-vite`) for `@rogeriodocarmo/offline-detector-web`, consumed the way an app
would: by package name, through its built `dist`. Private, never published.

## Stories

| Title                    | Stories                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `Pieces/Snackbar`        | Offline, Checking, Recovered, NotDismissible, DismissBySwipe, ShortSwipeSpringsBack, DismissWithEscape, DismissButton       |
| `Pieces/Banner`          | Offline, Checking, Recovered, Overlay, NotDismissible, DismissBySwipe, DismissWithEscape                                    |
| `Pieces/Indicator`       | Offline, Checking, Recovered, Dot, NotDismissible, DismissBySwipe, DismissWithDelete                                        |
| `Pieces/FullScreen`      | Offline, Checking, ContinueOffline, ContinueWithEscape, WithoutEscapeHatch                                                  |
| `OfflineDetector/States` | Online, Offline, OfflineDistinguishingTheReason, Recovering, Checking, RetryRecovers, FullScreen, Dismissed, NotDismissible |

Every file also has `Dark`, `PortugueseRtl` and `SpanishReducedMotion`. The toolbar has four
globals: locale (`en`, `pt-BR`, `es`), colour scheme (`data-od-theme`), direction (LTR, RTL) and
motion (follow the system, reduced). `dismissible` is a control on each story.

## No network

The `OfflineDetector` stories get a fake adapter and a fake probe fetch
(`.storybook/fakes.ts`), so nothing is requested. Real offline in DevTools does nothing in these
stories; use the "Simulate offline" and "Simulate online" buttons. No fonts are fetched; the
preview uses the system font stack.

## Commands

```bash
pnpm --filter @offline-detector/storybook-web dev          # http://localhost:6006
pnpm --filter @offline-detector/storybook-web build        # storybook-static/
pnpm --filter @offline-detector/storybook-web test:stories # play functions + a11y, in Chromium
```

`pnpm build` at the root builds the packages first (Turborepo), then this app.

`test:stories` needs a browser: `pnpm --filter @offline-detector/storybook-web exec playwright
install chromium`, or set `OD_BROWSER_CHANNEL=chrome` to use the Chrome that is already
installed. The a11y addon is set to `error`, so an axe violation fails the story.

## Chromatic (paid, manual)

`.github/workflows/chromatic.yml` is `workflow_dispatch` only and stops unless the input
`confirm_paid_snapshot` is exactly `yes`. It needs the repository secret
`CHROMATIC_PROJECT_TOKEN` (owner action: create the project at chromatic.com and add the secret).
`.github/workflows/storybook.yml` is the free check that runs on every pull request.
