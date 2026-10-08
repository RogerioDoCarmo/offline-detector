# Native Wiring Implementation Plan (Plan 5e, phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Steps use
> checkbox (`- [x]`) syntax for tracking.

**Goal:** Add the public `OfflineDetector` component to `@rogeriodocarmo/offline-detector-native`,
driven by the real `@rogeriodocarmo/offline-detector-react` hooks, replace the local contract type
copies with imports from that package, and stop the package requiring NetInfo itself.

**Architecture:** `OfflineDetector` renders `OfflineDetectorProvider`, an inner `Shell` and the
pieces. The shell reads `useNetworkStatus`, `useDismissals`, `useCheckingFeedback`,
`resolveStrings`, `offlineMessage`, `useOfflineTheme` and `useReducedMotion`, derives a phase and a
visibility per piece, and renders either the built-in piece or its slot. Timing (recovery window,
checking hold, exit window for slots) lives in small hooks in `src/use-timers.ts`.

**Spec:** `docs/superpowers/specs/2026-10-08-ui-layer-contract.md`, `docs/design/components.md`,
`docs/design/accessibility.md`.

## File map

| File                              | Responsibility                                            |
| --------------------------------- | --------------------------------------------------------- |
| `src/phase.ts`                    | `PiecePhase`, taken from react's `PieceRenderProps`       |
| `src/contract-types.ts` (deleted) | Replaced by imports from the react package                |
| `src/adapter.ts`                  | `netInfo` is host-supplied; the lazy `require` is removed |
| `src/use-timers.ts`               | `useRecovery`, `useCheckingDisplay`, `useExitWindow`      |
| `src/offline-detector.tsx`        | The `OfflineDetector` component and its shell             |
| `src/index.ts`                    | Exports `OfflineDetector` and its prop types              |
| `src/offline-detector.test.tsx`   | Integration tests with the real react package             |

## Behaviour decisions

- Recovery ("Back online") only after a real `offline` to `online` transition, for `recoveryMs`
  (default 4000). A second offline transition cancels it. Never at launch.
- Checking: a user-pressed Retry shows at once; a `useCheckingFeedback() === 'brief'` check shows
  only after 150 ms pending. Once shown it stays 400 ms (components.md, "Rules for brief").
  Checking is displayed only while offline.
- Announcer: snackbar first, then banner, indicator never (`announce` flags).
- The indicator collapses to its dot while the banner shows, unless `indicator.variant` is set.
- Stacking: a top indicator sits below the measured banner; a bottom indicator sits above the
  snackbar's minimum height plus `space-sm`.
- `onContinueOffline` is added as a prop (the design says Continue offline fires it).

## Tests

Policy: literal expected values; coverage of `packages/native` at 95 percent lines and branches.
No device E2E is possible here; Maestro flows belong to the Plan 6 Expo demo. Mutation testing is
not configured for UI packages.

### New integration tests (`offline-detector.test.tsx`, real react package, fake adapter and fetch)

Launch online shows nothing and never "Back online"; offline shows snackbar, banner and indicator
with the literal text "No internet"; reason variants with `distinguishReason`; dismiss one piece,
others stay, all return after the next transition; recovery snackbar for exactly `recoveryMs`;
a second offline cancels recovery; fullScreen opt-in, Continue offline, host a11y hiding, back
online closes it; slots receive `PieceRenderProps` and replace the piece; pt-BR and es literal
strings; callbacks once per transition; Retry shows checking immediately and calls `checkNow`;
brief feedback from `useRecheckOnReturn` after 150 ms, none without it; insets override;
`netInfo` forwarded to the adapter; adapter created once per mount.

### New unit tests

- `adapter.test.ts`: `netInfo` module as default export or namespace; omitted degrades with one
  dev warning; `null` degrades; a source-level test that `adapter.ts` has no `require`.
- `use-timers.test.tsx`: the three hooks against fake timers.

### Existing tests disturbed

- `index.test.ts`: the exact export list gains `OfflineDetector`.
- `adapter.test.ts`: the "default lazy loading through jest.doMock" cases are replaced.
- Every piece test and `test-utils/fixtures.ts`: import `OfflineStrings` from the react package.

### Build proof

`grep` of `packages/native/dist` finds no `require("@react-native-community/netinfo")`.
