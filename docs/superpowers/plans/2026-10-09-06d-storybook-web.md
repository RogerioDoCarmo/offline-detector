# Plan 6d: Web Storybook

Source: `docs/superpowers/specs/2026-10-09-plan-6-apps-contract.md` (section "Per-worker scope",
storybook-web). Branch `feature/storybook-web`, cut from `feature/plan-6-base`.

## Goal

`apps/storybook-web` (`@offline-detector/storybook-web`, private): Storybook 10 with the
`react-vite` framework, showing `@rogeriodocarmo/offline-detector-web` as published (through its
`dist`, via `workspace:*`). Nothing in a story touches the network.

## Decisions

- **Consume as published.** Stories import the package names only. Never `src/` or `dist/` paths.
- **No network.** `OfflineDetector` stories get a fake `PlatformAdapter` and a fake `ProbeFetch`
  (`.storybook/fakes.ts`), so the real probe never runs. No remote fonts: the preview uses the
  system font stack.
- **Controls through a toolbar and args.** Global toolbar: locale (en, pt-BR, es), colour scheme
  (light, dark; sets `data-od-theme` on the story root), direction (ltr, rtl), motion
  (auto, reduced). `dismissible` is an arg on the detector stories.
- **a11y gate.** `@storybook/addon-a11y` with `parameters.a11y.test = 'error'`, so a violation fails
  the story in the Vitest run.
- **Interaction tests.** Play functions in the stories, run by `@storybook/addon-vitest` in a
  browser (Playwright provider). Swipe uses synthetic pointer events, keyboard dismissal presses
  Escape and Delete, Retry and the checking state use the held fake fetch.
- **Build in the root job.** Measured below; a full `storybook build` is kept as the app's `build`
  only if it stays well within the budget, else root `build` becomes a TypeScript check.
- **Workflows.** `storybook.yml`: build and run the story tests on every PR and push to
  main/develop. `chromatic.yml`: `workflow_dispatch` only, input `confirm_paid_snapshot` must equal
  `yes`, the first step fails fast otherwise, and `CHROMATIC_PROJECT_TOKEN` is used only by the
  snapshot step. Chromatic is never run by the worker.

## Stories

Snackbar, Banner, Indicator, FullScreen: one story per phase (`offline`, `checking`, `recovered`;
FullScreen has `offline`, `checking`, `continueOffline`). `OfflineDetector`: `Online`, `Offline`,
`Recovering`, `Checking`, `FullScreen`, `Dismissed`.

## Tests

### Unit / repo-config (Jest, root)

New `tests/storybook-web.test.ts`, literal expectations:

- package name, private, scripts (`build`, `typecheck`, `dev`, `test:stories`), `workspace:*`
  dependencies on the three packages, Storybook 10 range on all `storybook`/`@storybook/*`;
- `.storybook/main.ts` names `@storybook/react-vite`, the a11y and vitest addons, a stories glob;
- `preview.tsx` sets a11y `test: 'error'` and defines the four toolbar globals;
- `storybook.yml` triggers (pull_request, push main/develop), builds and runs the story tests;
- `chromatic.yml` triggers (only `workflow_dispatch`), the `confirm_paid_snapshot` input, the
  guard `== 'yes'`, token only in the snapshot step, no pull_request/push;
- no story or `.storybook` file imports from a package's `src/` or `dist/` path.

Existing tests disturbed: none edited. `tests/workspace.test.ts` etc. only read the root manifests;
checked by running the whole suite.

### Property

None: the app has no logic of its own beyond configuration.

### Component / interaction (Storybook + Vitest browser)

Play functions: swipe dismisses Snackbar (synthetic pointer events), Escape dismisses Banner,
Delete dismisses Indicator, Retry calls the fetch and shows the checking state, the checking state
is `aria-busy`, a full detector recovers when the fake goes online. Needs a browser; locally
through system Chrome (`channel: 'chrome'`), in CI through `playwright install chromium`.

### E2E (Playwright)

The repo's Playwright config belongs to demo-web. Storybook's own browser run covers this app, so
no new Playwright project is added (contract: `playwright.config.ts` is demo-web's).

### Mutation

Stryker mutates `packages/core` and `packages/react` only; this app has no mutated source.
