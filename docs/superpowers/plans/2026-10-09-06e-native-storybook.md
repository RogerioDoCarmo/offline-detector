# On-device Storybook (apps/demo-native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Storybook for React Native inside the existing Expo demo: stories for the native pieces
and the `OfflineDetector` states, on-device controls, and a build-time switch between the demo and
Storybook, with no custom native code.

**Architecture:** `@storybook/react-native` 10 with the lite UI (`@storybook/react-native-ui-lite`),
because the default UI needs Reanimated, gesture-handler and bottom-sheet, which this repo
forbids. Config lives in `apps/demo-native/.rnstorybook`. `metro.config.js` wraps its existing
config with `withStorybook` last, with `enabled` and `liteMode` driven by `EXPO_PUBLIC_STORYBOOK`.
`index.ts` registers either the demo `App` or the Storybook root from the same flag. When the flag
is off, `withStorybook` swaps Storybook modules for empty ones, so the demo bundle is unchanged.

**Tech Stack:** Storybook 10.6, `@storybook/react-native` 10.6.0, on-device controls and actions.

**Spec:** `docs/superpowers/specs/2026-10-09-plan-6-apps-contract.md` (phase 2).

## Global Constraints

- No Reanimated, gesture-handler, `react-native-web` or custom native code.
- Stories import the packages by name (`@rogeriodocarmo/offline-detector-native`), never from
  `src/` or `dist/`. Nothing touches the network: a fake adapter and fake fetch drive the detector.
- The existing metro settings (watchFolders, nodeModulesPaths, package exports, the single-React
  `resolveRequest`) stay. The normal demo build is unchanged with the flag off.
- `build` stays a TypeScript check. Do not edit `.github/workflows/maestro.yml`.
- Never rebase; commit on `feature/native-storybook`; do not push.

## Review Focus

- `withStorybook` replaces `config.resolver.resolveRequest` with a wrapper that calls the previous
  one; the single-React rule must survive. Proven by both bundles.
- The generated `storybook.requires.js` is committed so a clean checkout type-checks. It is JS so
  the generated `require` calls pass the lint rules, with a hand-written `.d.ts`. A meta-test
  checks that it globs the whole stories folder.

## Tests

- **Unit / meta (root Jest, `tests/demo-native-storybook.test.ts`)**: pinned Storybook
  dependency versions, scripts, the flag name, metro integration keys, the `index.ts` switch, no
  story imports from `src/` or `dist/`, the stories cover every phase and state,
  `storybook.requires.js` globs the whole stories folder.
- **Property**: not applicable (config and stories only).
- **E2E**: no emulator here. A Storybook-mode Maestro flow needs its own APK build and the
  workflow is owned by another PR, so none is added; the manual command is documented.
- **Mutation**: Stryker scope is `packages/*`; unchanged.
- **Existing tests disturbed**: none edited. `tests/demo-native.test.ts` asserts the demo
  scripts and metro keys; adding scripts and a wrapper must not break its literal expectations
  (verified by the full run).

### Task 1: Dependencies and meta-tests (red)

- [ ] `pnpm --filter @offline-detector/demo-native add -E -D` the Storybook packages.
- [ ] Write `tests/demo-native-storybook.test.ts`; watch it fail.

### Task 2: Config, metro, switch

- [ ] `.rnstorybook/{main.ts,preview.tsx,index.tsx}`, metro wrap, `index.ts` switch, scripts.

### Task 3: Stories

- [ ] Helpers and fakes, then Snackbar, Banner, Indicator, FullScreen and OfflineDetector stories.
- [ ] `pnpm storybook:generate`, typecheck.

### Task 4: Proof and docs

- [ ] `expo export` with the flag off and on; README section; full gates.
