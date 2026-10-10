# W1 fix plan: core and react

Contract: `docs/superpowers/specs/2026-10-09-final-review-fixes.md`, section "W1: core and
react".
Every item is test first: the test is written, run, and seen to fail for the right reason.

## Steps

1. Rename `OfflineDetector` to `OfflineDetectorInstance` (core, react, READMEs). Mechanical,
   guarded by the typecheck and the export-list tests.
2. A-I4: an overtaken `checkNow` resolves with the overtaking run's promise.
3. A-I6 and B-I7: any completed response is reachable; `ProbeFetch` returns `Promise<unknown>`;
   `ProbeResponse` is removed; init is `{ method, signal, credentials: 'omit' }`.
4. A-M2: `stop()` aborts the in-flight fetch and clears the probe timeout timer.
5. A-M3: a throwing `onError` never stops detection and never leaves an unhandled rejection.
6. A-M5: `ProbeOptions.urls` is `readonly string[]`.
7. A-M8: `useRecheckOnReturn` subscribes only to the boolean it returns.
8. READMEs for every behaviour change; Stryker on core and react.

## Tests

- Unit (core): `detector.test.ts` (overtaken promise value, init credentials, any-response
  reachable, throwing onError), `detector-lifecycle.test.ts` (stop aborts the signal and clears the
  timer), `probe.test.ts` (any resolved value, even `undefined`, is reachable; a rejection is not;
  the timer is cleared on stop).
- Property (core): `detector.property.test.ts` gains: for any sequence of interface events and
  checkNow calls, no `checkNow` promise resolves with `checking: true`; any resolved value of the
  fetch yields online.
- Type test: `core/src/types.test-d.ts`-style compile check inside `index.test.ts` passing
  `DEFAULT_PROBE_URLS` to `ProbeOptions.urls`, covered by `pnpm typecheck:tests`.
- Unit (react): `recheck.test.tsx` render-count test for A-M8 and `onResult(true)` when an event
  overtakes; `index.test.ts` export list.
- Existing files disturbed: `core/tests/helpers.ts` (drops `ProbeResponse`, the `http-error` and
  `opaque` behaviours become resolved responses of any kind), `react/tests/helpers.ts`
  (`OfflineDetectorInstance`), `provider.test.tsx`, `index.test.ts` in both packages.
- E2E: none exist for these two packages (web/native E2E belong to other workers).
- Mutation: `pnpm mutation --tempDirName stryker-tmp` for core and react, score reported (was 87.97%).
