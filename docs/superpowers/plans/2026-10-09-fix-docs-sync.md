# Docs sync after the final-review API changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this
> plan task-by-task.

**Goal:** Make the Docusaurus site (en, pt-BR, es), the root README and the react README describe
the API as it is after the four fix branches.

**Architecture:** The export index of each reference page is compared with the real `index.ts` by
`tests/docs.test.ts`. Tests change first (new counts, stale-name guards, literal kind checks), fail,
then the pages are fixed in English and mirrored into the two translations with identical heading
and fence counts.

**Tech Stack:** Docusaurus 3.10, Markdown, Jest, TypeScript (samples compiled with `tsc` from a
scratch folder against the built packages).

**Spec:** `docs/superpowers/specs/2026-10-09-final-review-fixes.md` ("The API after the fixes").

## Global Constraints

- Own only `apps/docs/**`, root `README.md`, the one link in `packages/react/README.md`,
  `tests/docs.test.ts` and this plan.
- Never rebase; small commits with the Co-Authored-By trailer; no push.
- Document from the code (`packages/*/src/index.ts`, `piece-types.ts`, READMEs), never from memory.
- Translations keep the same `##`, `###` and fence counts as English.

## Review Focus

- A quick start that imports hooks from `-react` while installing only `-web`/`-native` (breaks for
  the reader).
- Kind labels in the export index (constant vs function vs hook vs component vs type).
- Stale names surviving in only one locale.
- A sample that no longer type-checks (old `onRetry`, `ok`, `ProbeResponse`).

## Tests

New, in `tests/docs.test.ts` (unit level; the repo has no E2E or mutation scope over docs):

- Guard test: updated literal counts (core 16, react 24, web 35, native 42) and `arrayContaining`
  names that exist now (`useNetworkStatus` in web and native, no `SWIPE_RULES`).
- Export-kind test: literal expectations such as `offlineCss (constant)`, `createTheme (function)`,
  `useOfflineTheme (hook)`, `OfflineDetectorInstance (type)`, in all three locales.
- Stale-name test: no page in any locale mentions `ProbeResponse`, `useSwipeDismiss`,
  `useSettledChecking`, `hostContentAccessibilityProps`, `defaultInsets`, `onRetry`, or
  `opaque`-based reachability rules.
- Quick-start test: web and native quick starts import hooks from the platform package, never from
  `-react`; the install page names one UI package per platform.
- Content tests: theming mentions `:where(`, ssr/theming mention `nonce`, core reference says any
  completed response counts and names `OfflineDetectorInstance`.
- README tests: root README has no "Work in progress"; `packages/react/README.md` has no relative
  `../core/README.md` link.

Existing files disturbed: `tests/docs.test.ts` only (its hard-coded counts and
`SWIPE_RULES`/`FullScreen` guard names). `tests/privacy.test.ts` and `tests/release.test.ts` are not
touched.

## Tasks

### Task 1: Tests first

- [ ] Edit `tests/docs.test.ts` as above; run `pnpm jest tests/docs.test.ts` and watch it fail.
- [ ] Commit.

### Task 2: Reference pages (en, then es and pt-BR)

- [ ] Rewrite the export index of core, web, native (kinds from source) and the prose around it
      (probe rule, `OfflineDetectorInstance`, pieces props, pruned hooks section, re-exports); fix
      `react.md` type name.
- [ ] Commit.

### Task 3: Guide pages (en, then es and pt-BR)

- [ ] install, web and native quick start, recheck-on-return, dismissal, slots, theming, ssr,
      accessibility, faq.
- [ ] Commit.

### Task 4: READMEs and samples

- [ ] Root README status line; react README absolute link.
- [ ] Compile every touched sample with `tsc` from a scratch folder against the built packages.
- [ ] Run build, typecheck, typecheck:tests, lint, format:check, lint:md, `CI=1 pnpm test:ci`.
