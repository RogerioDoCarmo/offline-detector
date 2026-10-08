# offline-detector — design spec

Status: **confirmed by the owner on 7 Oct 2026** after a grilling session
(Q1–Q33). This file is the source of truth; plans argue from it.

## 1. Product

A public, MIT-licensed npm package family that detects when an app has no
working internet and gives visual feedback plus a programmable callback.
Works in React web and React Native (iOS/Android) from one monorepo, with
**no custom native code** (works in Expo Go). The author's own apps
(`morse_app`, `mirror_app`) are its first consumers.

"Offline" means **no real internet**: Wi-Fi, Ethernet or cellular that is
connected but carries no data counts as offline.

## 2. Packages and names

Scope decision: the owner's personal scope `@rogeriodocarmo` (personal
branding). The bare name `offline-detector` is taken on npm (v1.1.1,
checked 7 Oct 2026), so every package is scoped. **Open owner task:** confirm
the npm username is exactly `rogeriodocarmo` (see `NPM-SETUP.md`).

| Workspace | npm name | Responsibility |
| --- | --- | --- |
| `packages/core` | `@rogeriodocarmo/offline-detector-core` | Framework-free state machine, probe, platform adapter interface |
| `packages/react` | `@rogeriodocarmo/offline-detector-react` | Provider, hooks, callbacks, shared by web and native |
| `packages/web` | `@rogeriodocarmo/offline-detector-web` | DOM UI: snackbar, banner, indicator, full-screen |
| `packages/native` | `@rogeriodocarmo/offline-detector-native` | React Native UI, same four pieces |
| `apps/demo-web` | private | Next.js (Turbopack) showcase |
| `apps/demo-native` | private | Expo (Metro) showcase + on-device Storybook |
| `apps/docs` | private | Docusaurus documentation site (en, pt-BR, es) |

GitHub repo: `RogerioDoCarmo/offline-detector`. Package names live in one
config value so a scope change is a single edit.

## 3. State and detection

Public state:

```ts
type OfflineState = {
  status: 'online' | 'offline' | 'unknown'; // unknown only until first check
  reason: 'no-interface' | 'no-internet' | null;
  checking: boolean;
  lastChecked: number | null;
  lastOnlineAt: number | null;
};
```

`isOnline` (boolean) is `true` while `unknown`.

- **Signals:** interface state (web: `navigator.onLine` + `online`/`offline`
  events; native: `@react-native-community/netinfo`, optional peer) is the
  fast signal; a **probe** confirms real reachability.
- **Probe:** configurable URL list, timeout, interval, method. Default:
  `https://cp.cloudflare.com/generate_204` with a second fallback, `no-cors`
  on web. While offline it retries with exponential backoff (1 s up to a
  30 s cap). An **interface-only mode** disables probing. Nothing is
  collected; the only network traffic is the probe request, and the README and
  `PRIVACY.md` say so.
- **Default message** is always "No internet". "Connected, but no internet"
  is opt-in (`distinguishReason` prop or string override).

## 4. API

- Provider + headless hook `useNetworkStatus()` returning `OfflineState`.
- Callbacks on the provider and hook: `onOffline(state)`, `onOnline(state)`,
  `onChange(state, previous)`. They fire **on real transitions only**.
- `checkNow(): Promise<OfflineState>`.
- `useRecheckOnReturn({ checkingFeedback: 'brief' | 'none', onResult })`:
  **opt-in per screen**, returns the latest `boolean`. Re-probes immediately
  on web `visibilitychange`/`focus` and native `AppState`
  `background -> active`. `checkingFeedback` defaults to `'none'`. Provider
  detection (interface changes, `online`/`offline` events) stays always-on.
- The built-in snackbar fires only on a real transition.

## 5. UI

- Snackbar (offline: stays; recovery "Back online": about 4 s; Retry
  action; safe-area aware), persistent banner at the top while offline,
  indicator (dot/chip, positionable, labelled). All **on by default**.
- Full-screen state: **opt-in** via one prop (`fullScreen`), with a retry
  button and optional "continue offline" action.
- Customization: props, design tokens (CSS variables on web, theme object on
  native) **and slots/render props** to replace any piece.
- Accessibility: live-region announcements, reduced motion respected on both
  platforms; focus handling for the full-screen state.
- i18n: `en`, `pt-BR`, `es` bundled; every string overridable.
- Visual direction: neutral and system-like default theme built from tokens;
  docs site and promo may carry a stronger identity. Design brief goes to
  `PRODUCT.md`/`DESIGN.md` via the Impeccable skill.
- SSR: server assumes `online`; nothing runs before mount; first check in an
  effect; optional `initialStatus` prop. No `navigator.onLine` read during
  the first client render.

## 6. Platform and dependency floors

React 18+ (19 supported), React Native 0.73+, Expo SDK 50+ compatible.
`@react-native-community/netinfo` is an optional peer for native. No
Reanimated, no `react-native-web` dependency; motion uses RN `Animated` and
CSS. TypeScript strict. Node per `.nvmrc`.

## 7. Tooling and quality (ported from `morse_app`)

- pnpm workspace, **Turborepo** orchestration, **Rslib (Rspack)** builds to
  ESM + CJS + `.d.ts`, Next.js demo on **Turbopack**, Expo demo on Metro.
- Prettier (semi, single quotes, trailing commas, width 90), ESLint flat
  config + typescript-eslint, markdownlint-cli2, Husky + lint-staged,
  pre-push `typecheck && test`.
- Jest, 80% global coverage threshold on `packages/*/src`, fast-check for
  property tests, repo-config meta-tests (CI, Dependabot, changesets).
- Stryker mutation on `packages/core/src` and `packages/react/src` (PR-only,
  changed files, thresholds 80/60/60). UI packages: component tests +
  Playwright.
- SonarCloud: analyses packages **and demo apps**, non-blocking, skipped for
  Dependabot and forks, Automatic Analysis OFF. Demos are excluded from the
  coverage threshold and mutation scope.
- E2E: **Playwright** for web (chromium on PRs; the 5-project matrix on
  `main`/`develop` and nightly; `@axe-core/playwright` on every offline UI
  state; shared `goOffline()`/`goOnline()` fixture; reuse the website repo's
  config skeleton and `waitForHydrated`/`reloadWithRetry` helpers).
  **Maestro** for the Expo demo, separate workflow on `main`/`develop` only.
- Storybook: web Storybook (react-vite, a11y addon) built on every PR;
  on-device native Storybook in `apps/demo-native`. Chromatic is
  **manual-dispatch only**, gated by the `paid-builds` skill.
- CodeQL default setup and Dependabot (npm + github-actions,
  `target-branch: develop`) from the first commit. Enabling CodeQL/Pages is
  an API call that needs the owner's go-ahead.
- Git Flow, strict; **never rebase**. Merge `develop` into branches.

## 8. Release

Changesets for per-package versions and changelogs; tag-driven GitHub
Release; npm publish with **provenance** (trusted publishing/OIDC) through a
protected `npm-publish` environment that needs the owner's approval. First
publish of each package is manual (the trusted-publisher setting only exists
after a package does).

## 9. Docs, demo, privacy

Docs (Docusaurus, en/pt-BR/es) and the demo are separate apps, built in CI
and published as **one GitHub Pages site**: docs at `/`, demo at `/demo/`.
`PRIVACY.md` at the repo root and `docs/privacy-policy.html` (from the
`mirror_app` template, content written against this code) ship with v1.
Pages is enabled only after the owner says so.

## 10. Promo video

After v1, via HyperFrames, 16:9 and 9:16 cuts of about 30–40 s, **no audio**
(owner decision, 7 Oct 2026), real footage from the demo apps.

## 11. Delivery plans

| # | Plan | Depends on |
| --- | --- | --- |
| 1 | Foundation: monorepo, tooling, CI skeleton | — |
| 2 | `core` (state machine, probe, adapters) | 1 |
| 3 | Design brief (Impeccable) | 1 |
| 4 | QA port (Sonar, Stryker, CodeQL, Playwright base) | 1 |
| 5 | `react` package; `web` + `native` UI; i18n | 2, 3 |
| 6 | Demos, docs site, Storybooks, E2E | 5 |
| 7 | Review, privacy page, release setup, promo | 6 |

Plans 2, 3 and 4 run as parallel agents after Plan 1; 5 splits into
parallel `react`/`web`/`native` workers once the `react` interfaces exist.
Library facts are checked through context7 per batch.
