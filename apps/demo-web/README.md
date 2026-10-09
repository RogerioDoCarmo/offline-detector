# @offline-detector/demo-web

The web demo of [offline-detector](../../README.md): a Next.js (App Router) page, exported as static
files, that mounts `<OfflineDetector>` from `@rogeriodocarmo/offline-detector-web` with a control
for every public option. Private, never published to npm.

Live at `https://rogeriodocarmo.github.io/offline-detector/demo/` once the owner enables Pages
(see `docs/OWNER-ACTIONS.md`).

## What it shows

- **Simulate offline** drives a stub probe (and, for "No network connection", a wrapped web
  adapter), so the demo works without touching the network. Real offline works too: switch the
  network off in your browser's DevTools.
- Every option of the component: `locale`, `strings`, `distinguishReason`, `dismissible` (global
  and per piece), `fullScreen` (off, on, with Continue offline), `colorScheme`, `motion`,
  `recoveryMs`, `banner.overlay`, `indicator.position` and `variant`, the `probe` settings (URLs,
  interval, timeout, method, mode), `initialStatus` and `slots` (a custom snackbar).
- A screen that opts in to `useRecheckOnReturn`, with `checkingFeedback` `brief` or `none`.
- A callback log for `onOffline`, `onOnline`, `onChange`, `onDismiss` and `onError`.

Privacy: the only network traffic is the configurable reachability probe. The stub is on by
default, so the demo contacts nothing; "Use the real network probe" makes the library contact the
probe URLs shown in the panel.

## Scripts

| Script               | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | Next dev server (Turbopack) at `/offline-detector/demo`.     |
| `pnpm build`         | Static export to `out/`, base path `/offline-detector/demo`. |
| `pnpm run typecheck` | `tsc --noEmit`.                                              |

The packages are consumed through `workspace:*` and their `dist`, so build them first (the root
`pnpm build` does, in order).

## Tests

`e2e/demo-web.spec.ts` (Playwright) runs against the export. `playwright.config.ts` starts
`e2e/fixtures/serve-demo.mjs`, which serves `out/` under the base path and builds it first when it
is missing. Repo-config checks live in `tests/demo-web.test.ts`.
