# Native demo (apps/demo-native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Expo app with a control panel for every public option of `<OfflineDetector>`, a
simulated-offline stub probe, and proof that Metro bundles the workspace packages with and
without NetInfo.

**Architecture:** One Expo app (`@offline-detector/demo-native`, private). Pure settings and
stub-probe logic in `src/options.ts` and `src/stub-probe.ts` (no React Native imports, so the
repo's Jest can test them); UI in `App.tsx` and `src/`. Metro is configured for the pnpm
monorepo and resolves `react` and `react-native` to the app's single copy.

**Tech Stack:** Expo SDK 57 (React Native 0.86.3, React 19.2.3), Metro, NetInfo 12.0.1,
react-native-safe-area-context 5.7, Maestro.

**Spec:** `docs/superpowers/specs/2026-10-09-plan-6-apps-contract.md` (section "demo-native").

## Global Constraints

- No custom native code, no Reanimated, no `react-native-web`.
- Packages consumed through `workspace:*` and their `exports` (dist). No source aliases.
- `build` offline-safe and fast (TypeScript check); `expo export` is the separate `bundle` script.
- Only network traffic is the configurable reachability probe; the demo's default is a stub.
- Never rebase; commit on `feature/demo-native`; do not push.
- Jest here uses Babel 8: no explicit type arguments on calls in files Jest transforms.

## Review Focus

- Two copies of React (packages built against 19.3, app on 19.2): Metro must pin one. Pinned in
  the metro meta-test (`resolveRequest` singleton list) and proved by the bundle.
- NetInfo absent from node_modules must not break the bundle: proven by a bundle with it removed.
- Probe options are read once per mount: the demo remounts the detector on probe change.
- Maestro workflow must never run on pull requests: meta-test on `on:` keys.
- iOS bundle: tried; result reported.

## Tests

- **Unit / meta (root Jest, `tests/demo-native.test.ts`)**: workspace deps, scripts, metro keys,
  app config, Maestro flows' `appId`, workflow triggers; plus pure logic of `src/options.ts`
  and `src/stub-probe.ts` with literal expectations.
- **Property**: not applicable (no new algorithmic code); the packages own theirs.
- **E2E**: Maestro flows in `apps/demo-native/.maestro/` (not runnable here: no emulator).
  Playwright is web-only.
- **Mutation**: Stryker scope is `packages/*`; the app is outside it, so no change.
- **Existing tests disturbed**: none edited. `tests/workspace.test.ts` and
  `tests/packages.test.ts` already tolerate `apps/*`; verified by the full run.

### Task 1: Scaffold, Metro, TypeScript

- [ ] Write `package.json`, `app.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`.
- [ ] `pnpm install`, then `pnpm --filter @offline-detector/demo-native build` (tsc).
- [ ] Commit.

### Task 2: Pure logic (TDD)

- [ ] Write failing tests in `tests/demo-native.test.ts` for `buildProbeOptions`,
      `defaultSettings`, `createStubProbe`.
- [ ] Implement `src/options.ts`, `src/stub-probe.ts`. Commit.

### Task 3: UI

- [ ] `App.tsx`, `src/controls.tsx`, `src/screens.tsx`; typecheck. Commit.

### Task 4: Bundle proof

- [ ] `expo export --platform android` with NetInfo, without passing it, without the package in
      node_modules; iOS. Record sizes. Commit.

### Task 5: Maestro, workflow, README

- [ ] Flows, `maestro.yml`, README, meta-tests. Commit.

### Task 6: Gates

- [ ] `pnpm build`, `typecheck`, `typecheck:tests`, `lint`, `format:check`, `lint:md`,
      `CI=1 pnpm test:ci`.
