# W3: native final-review fixes

Contract: `docs/superpowers/specs/2026-10-09-final-review-fixes.md` (section W3 and "The API after
the fixes"). Scope: `packages/native/**`, `apps/demo-native/**`, `tests/demo-native*.test.ts`.

## Approach

Every item starts with a test that runs the whole sequence through `<OfflineDetector>` and is
watched failing before the fix.

1. **A-C1** `useSwipeDismiss` takes `visible`; when it turns true again it stops the animations and
   resets `translateX` to 0 and `opacity` to 1. Each piece passes its `visible`.
2. **A-I2** Announcement ownership no longer depends on dismissal. The snackbar owns the
   announcement whenever anything shows; the banner and indicator are always silent next to it.
   After "Continue offline" the snackbar renders silent for that episode (the full-screen state
   already spoke by moving focus).
3. **A-I5** `useRecovery` is fed `lastChecked === null ? 'unknown' : status`, like web.
4. **A-M1** The adapter swallows NetInfo's first (baseline) emission and drops repeats.
5. **A-M9** "Continue offline" is stored with the episode it was pressed in; the episode counter is
   derived during render, so no frame shows the snackbar before the full-screen state returns.
6. **A-M12** `<OfflineDetector onRestoreFocus>` is forwarded to the bundled `FullScreen` (and
   called when a `fullScreen` slot goes away).
7. **API** Pieces take `PieceProps` (`phase, message, strings, state?, actions?, visible?,
rootProps?, theme?` plus native extras). `onRetry/onDismiss/dismissible/title/action` go.
   `Banner.showRetry` replaces `action`. Internals are unexported; the react API is re-exported.

## Tests

- **Unit**: `adapter.test.ts` (baseline swallow, repeats), `use-swipe-dismiss.test.tsx` (reset on
  visible), `use-timers.test.tsx` (`useRecovery` unaffected), piece tests migrated to `actions`.
- **Composition (the sequences)**: `offline-detector-sequences.test.tsx`: swipe, recover, assert
  visible for snackbar, banner and indicator, with and without reduced motion; iOS and Android
  announcement counts through dismissal and "Continue offline"; `initialStatus="offline"` then
  online first result; new-episode full-screen with no snackbar frame; `onRestoreFocus`.
- **Export surface**: `index.test.ts` lists the exact export names (value exports) and asserts the
  removed internals are absent.
- **Existing files disturbed**: `banner/snackbar/indicator/full-screen.test.tsx` (props renamed),
  `offline-detector*.test.tsx` (banner no longer announces after a snackbar dismissal),
  `insets.test.ts`, `use-swipe-dismiss.test.tsx` (import by path, new option),
  `tests/demo-native-storybook.test.ts` (stories use `actions`), `tests/dist-exports.test.ts` is
  W4's.
- **Property / E2E / mutation**: the repo has no property tests for native; E2E for native is the
  Maestro flows in `apps/demo-native/.maestro` (device only, not runnable here); mutation: Stryker
  scoped run on the changed native files if it works in this environment.
- **Metro**: `npx expo export --platform android` with the Storybook flag off and on.
