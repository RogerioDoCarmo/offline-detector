# Plan 6 contract: demos, docs and Storybook

Status: binding for the parallel Plan 6 workers. It refines sections 7 and 9 of
`2026-10-07-offline-detector-design.md`. Packages are finished and merged into `develop`
(`@rogeriodocarmo/offline-detector-{core,react,web,native}`); this plan builds the apps around them.

## Apps and owners

| App           | Path                 | Stack                                             | Worker        |
| ------------- | -------------------- | ------------------------------------------------- | ------------- |
| Web demo      | `apps/demo-web`      | Next.js on Turbopack, static export               | demo-web      |
| Native demo   | `apps/demo-native`   | Expo (Metro), no custom native code               | demo-native   |
| Docs          | `apps/docs`          | Docusaurus, locales `en` (default), `pt-BR`, `es` | docs          |
| Web Storybook | `apps/storybook-web` | Storybook 10 with `react-vite`, a11y addon        | storybook-web |

Phase 2 (after the workers merge): the on-device Storybook inside `apps/demo-native`.

## File ownership (no worker edits another's files)

- Each worker owns `apps/<its app>/**`, its plan file
  (`docs/superpowers/plans/2026-10-09-06<letter>-<app>.md`), and the files listed for it below.
- **demo-web** also owns `playwright.config.ts`, `e2e/demo-web*` and the Playwright web server for
  the exported demo.
- **docs** also owns `.github/workflows/pages.yml` and the Pages section of
  `docs/OWNER-ACTIONS.md` (no other worker edits that file; put owner steps in your app's README).
- **demo-native** also owns `.github/workflows/maestro.yml` and `apps/demo-native/.maestro/**`.
- **storybook-web** also owns `.github/workflows/storybook.yml` and
  `.github/workflows/chromatic.yml`.
- Every worker puts its repo-config meta-tests in its **own** new file `tests/<app>.test.ts`. Do not
  edit `tests/ci-config.test.ts`, `tests/qa-config.test.ts`, `tests/packages.test.ts` or other
  existing tests, `package.json` at the root, `turbo.json`, `jest*.js`, or other workflows.
- Add dependencies only to your own app with `pnpm --filter <name> add ...`. If the lockfile
  conflicts at merge time, the integrator regenerates it.

## Rules for every app

- **Consume the packages as published.** Depend on them with `workspace:*` and import the public
  names (`@rogeriodocarmo/offline-detector-web`, ...). They resolve through `exports` to `dist`,
  which Turborepo builds first (`dependsOn: ["^build"]`). Do not alias to source.
- **Scripts.** Each app defines `build`, `typecheck` and `dev`. Root `pnpm build` and
  `pnpm typecheck` run them in CI, so they must pass from a clean checkout, offline after
  `pnpm install`, in a few minutes at most. No fonts or assets fetched at build time (no
  `next/font/google`, no CDN links).
- **Gates.** Root `pnpm lint`, `format:check`, `lint:md` and `typecheck:tests` must keep passing
  (generated folders `.next`, `out`, `build`, `.docusaurus`, `storybook-static`, `.expo` are
  already ignored). `CI=1 pnpm test:ci` must keep passing; apps are excluded from coverage.
- **Tests at every level the repo supports** (CLAUDE.md): meta-tests for your config in
  `tests/<app>.test.ts` with literal expectations; E2E for user-facing behavior where the repo has
  the tooling (Playwright for web); say plainly what could not run and why.
- **Honesty.** Report exactly what you ran and what you did not (no emulator, no iOS, no device,
  browsers not installed, etc.). Do not download Playwright browsers; system Chrome via a temporary
  config is acceptable for local runs, and CI exercises the real projects.
- **Privacy.** The only network traffic is the configurable reachability probe. Say so wherever the
  probe is documented. `PRIVACY.md` and the policy page are Plan 7; link to them, do not write them.
- **Babel/Jest note.** Jest here transforms with Babel 8, which rejects explicit type arguments on
  any call (`useState<T>(x)`): use casts or typed variables. Build tools (Next, Rspack, Vite,
  Metro) are not affected.
- Superpowers flow: `superpowers:writing-plans` (plan file with a Tests section per level), then
  `superpowers:test-driven-development`. Use context7 for current framework docs before writing
  config. Never rebase; commit on your own branch with the `Co-Authored-By: Claude Sonnet 5.5
<noreply@anthropic.com>` trailer; do not push, open PRs or run `gh`.

## One Pages site

Docs build to the site root and the web demo exports under `/demo/`, published together by Actions
(not the `/docs` folder, because the site is built). Pages is not enabled by any worker; the owner
does it (see `docs/OWNER-ACTIONS.md`). The assembled site must also serve
`docs/privacy-policy.html` at `/privacy-policy.html` once Plan 7 adds that file (copy it if it
exists; do not fail if it does not yet).

| Setting         | Value                                                |
| --------------- | ---------------------------------------------------- |
| Site URL        | `https://rogeriodocarmo.github.io/offline-detector/` |
| Docs `baseUrl`  | `/offline-detector/`                                 |
| Demo `basePath` | `/offline-detector/demo` (Next `output: 'export'`)   |

## Per-worker scope

- **demo-web**: a Next.js (App Router) page that mounts `<OfflineDetector>` and a control panel for
  every public option (locale en/pt-BR/es, `distinguishReason`, `dismissible`, `fullScreen`,
  `colorScheme`, `motion`, `recoveryMs`, probe URL list and interval, slots example, a
  `useRecheckOnReturn` screen with `checkingFeedback` 'brief' | 'none'). Include a **simulate
  offline** control that drives a stub probe so the demo works without touching the network, and
  say that real offline (DevTools) works too. `'use client'` boundaries and SSR-safe. Playwright E2E
  against the static export using the shared `goOffline()`/`goOnline()` and axe fixtures.
- **demo-native**: an Expo app (current SDK that supports React Native 0.87, otherwise the closest
  supported SDK and say so) with the same controls, passing `NetInfo` from the host. Configure Metro
  for the pnpm monorepo (watch folders, node module paths, package exports). **Prove Metro
  bundles it** with `npx expo export` for Android, once with NetInfo passed and once without, and
  report both results. Write Maestro flows in `.maestro/` (offline banner, dismiss by swipe, retry,
  recovery) and `maestro.yml` (push to main/develop and manual only, Android emulator). You cannot
  run an emulator here: say so.
- **docs**: Docusaurus site with the three locales: intro, install, web quick start, native quick
  start, hooks and props reference (written against the packages' real exports and READMEs), slots
  and theming tokens, accessibility, i18n, FAQ, privacy (what the probe contacts, default URLs, how
  to self-host the endpoint, interface-only mode), links to the demo. Identity: the brand layer in
  `DESIGN.md`; compute contrast for any new colour and keep it AA. `pages.yml`: build docs and
  demo, assemble one site, deploy only on push to `main` and manual dispatch (a build-only job on
  PRs). Translations need a native-speaker review: say so in the README.
- **storybook-web**: Storybook 10 (`react-vite`) for `@rogeriodocarmo/offline-detector-web`:
  stories for Snackbar, Banner, Indicator, FullScreen and the `OfflineDetector` states with a fake
  adapter and fake fetch, light/dark, RTL, en/pt-BR/es, reduced motion, dismissible on/off;
  a11y addon; interaction tests with play functions for swipe and keyboard dismissal.
  `storybook.yml` builds it on every PR (cheap). `chromatic.yml` is `workflow_dispatch` only and
  must refuse to run without an explicit confirmation input (it spends a paid snapshot allowance).
