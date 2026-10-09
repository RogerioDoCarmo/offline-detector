# Final review fixes

Status: binding for the four parallel fix workers. Two independent reviewers read `develop` at
`016d97a` before the first publish. This file carries every finding they made (the workers cannot
see the reports), the owner's decisions, and who owns what. Reviewer A read the library code;
reviewer B read the release path, workflows, privacy policy, docs and supply chain.

Every item is fixed **test first**: write the test that reproduces it, watch it fail, then fix. The
reviewers found that the serious misses all came from tests that exercised a piece or hook in
isolation and never the whole multi-step sequence; write the sequence.

## Owner decisions

1. **API tidy-up: yes, all five.** (a) Stop exporting internals. (b) Web and native pieces take the
   same props shape. (c) Web gets `onContinueOffline`. (d) Web honours `strings.fullScreenTitle`
   like native. (e) Core's `OfflineDetector` type is renamed (see below).
2. **Hooks are re-exported** from `-web` and `-native`, so a user installs one package.
3. **"Reachable" means any completed HTTP response**, on every platform. Only a rejected request
   (network error, TLS failure, abort, timeout) means unreachable.

Defaults chosen by the maintainer, also binding: build-metadata tags (`v0.1.0+x`) are dropped;
`CLAUDE.md` is amended to say `main` receives merges from `develop` and from `release/*` and
`hotfix/*` branches (Git Flow); the `react` peer range becomes `^18.0.0 || ^19.0.0`.

## The API after the fixes

- **Core type rename:** `OfflineDetector` becomes `OfflineDetectorInstance` everywhere (core, react,
  READMEs). No alias: nothing is published yet. `createOfflineDetector` returns it. The name
  `OfflineDetector` now means only the web and native components.
- **Probe:** `ProbeFetch = (url, init) => Promise<unknown>`. The resolved value is ignored: the
  request completing is "reachable". `ProbeResponse` and the `ok`/`opaque` rule are removed. The
  init core passes is `{ method, signal, credentials: 'omit' }`. `ProbeOptions.urls` is
  `readonly string[]`.
- **Web probe fetch** adds `mode: 'no-cors'`, `cache: 'no-store'`, `credentials: 'omit'` and
  `referrerPolicy: 'no-referrer'`, and returns the fetch result unchanged. The probe therefore sends
  no cookies and no `Referer`.
- **Piece props: the web shape wins.** Native pieces adopt it. Props are
  `{ phase, message, strings, state?, actions?: { retry?, dismiss?, continueOffline? }, visible?,
theme?, ...extras }`. A piece is dismissible exactly when `actions.dismiss` is present. Native's
  `onRetry`/`onDismiss`/`dismissible`/`title` props go away. Read `packages/web/src/piece-types.ts`.
- **Exports rule.** A package exports only what a host app needs: `OfflineDetector`, the pieces
  (`Snackbar`, `Banner`, `Indicator`, `FullScreen`, for custom layouts), the adapter factory, the
  tokens or theme, the re-exported react API below, and types. **Not exported:** swipe hooks and
  rules (`useSwipeDismiss`, `UseSwipeDismissOptions`, `SWIPE_RULES`, `lockAxis`, `shouldDismiss`),
  timing helpers (`useSettledChecking`), `hostContentAccessibilityProps`, `defaultInsets`.
  Tests import internals by file path instead.
- **Re-exported from both `-web` and `-native`** (identical list): the hooks `useNetworkStatus`,
  `useRecheckOnReturn`, `useOfflineDetector`, `useCheckingFeedback`, and the types `OfflineState`,
  `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`, `DismissiblePiece`, `Locale`,
  `IndicatorPosition`, `RecheckOnReturnOptions`, `UseNetworkStatusResult`.
- **Full-screen title:** use `strings.fullScreenTitle` unless `distinguishReason` is on, then the
  reason-aware message (native's current rule), on both platforms.

## Ownership (no worker edits another's files)

| Worker            | Owns                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1 core + react   | `packages/core/**`, `packages/react/**`                                                                                                                                                                                                     |
| W2 web            | `packages/web/**`, `apps/storybook-web/**`, `apps/demo-web/**`, `e2e/**`                                                                                                                                                                    |
| W3 native         | `packages/native/**`, `apps/demo-native/**`                                                                                                                                                                                                 |
| W4 release + docs | `.github/**`, `scripts/**`, `docs/**`, `NPM-SETUP.md`, `CLAUDE.md`, root `README.md`, `.changeset/**`, `packages/*/package.json` (peer ranges only), `tests/**`, the privacy and accessibility pages under `apps/docs/` (all three locales) |

Package READMEs belong to the package's worker. Reference and install pages of the docs site that
list exports are synchronised **after** merging (not by these workers); W4 must leave them alone.
Each worker keeps its tests in its own package, or in `tests/<area>.test.ts` files it creates. Do
not edit another worker's files; if you need a change there, say so in the report.

## W1: core and react

- **A-I4.** `checkNow()` resolves with a stale, still-checking state when an interface event
  overtakes it (`core/src/detector.ts` near lines 126 and 144: after `onInterfaceEvent(true)` bumps
  the epoch, the overtaken run returns `state`, now the new run's `{ checking: true }`). Effects:
  `useRecheckOnReturn`'s `onResult` reports false when a tab returns as `online` fires; the web
  Retry spinner clears early; the README promise "resolves with the new state" is false. Fix: an
  overtaken run resolves with the overtaking run's promise. Test what the overtaken promise
  resolves to.
- **A-I6.** Implement the "any completed response" rule above, in code, tests and README.
- **B-I7.** `credentials: 'omit'` in core's init and the default fetch.
- **A-M2.** `stop()` neither aborts the in-flight fetch nor clears the probe's own timeout timer
  (`core/src/probe.ts`, `detector.ts` stop). Abort and clear both. This is the likely cause of
  Jest's "A worker process has failed to exit gracefully": confirm the warning disappears.
- **A-M3.** A host `onError` that throws escapes `guard`/`applyResult`, skips `schedule()` and
  leaves an unhandled rejection from `void checkNow()`. Detection must continue.
- **A-M5.** `ProbeOptions.urls` rejects the exported `readonly DEFAULT_PROBE_URLS` (TS4104).
- **Rename** `OfflineDetector` to `OfflineDetectorInstance` (core, react, both READMEs).
- **A-M8.** `useRecheckOnReturn` returns a boolean but subscribes to the whole state, so the screen
  re-renders on every `checking` flip. Subscribe to what it returns.
- Also run Stryker on core and react (`pnpm mutation --tempDirName stryker-tmp`) and report the
  score; it was 87.97% before.

## W2: web

- **A-I1.** The offline snackbar and banner mount their `role="status"` region together with its
  text, so screen readers skip it. `docs/design/accessibility.md` section 1 requires mounting the
  empty region first and setting the text one frame later. Applies to the recovery snackbar after a
  dismissal or the full-screen state, and to the snackbar after "Continue offline", too. Test that
  the first commit has an empty region and the text arrives after the frame.
- **A-I3.** A mouse released outside the piece leaves the swipe gesture stuck (`web/src/swipe.ts`):
  capture is only taken on a horizontal lock and nothing hears a `pointerup` elsewhere, so
  `gesture.current` is never cleared. Later swipes are dead, a later hover can lock the axis and
  swallow the user's next click, and the snackbar's touch flag keeps the "Back online" timer paused.
  End the gesture on window `pointerup`/`pointercancel`, or when a move has `event.buttons === 0`.
- **A-I7.** Dismissing a piece drops keyboard focus to `<body>`. components.md: focus returns to the
  element that had it before the piece appeared, if still in the document. Implement and test.
- **A-I8.** Host token overrides lose to the package's own `:root{--od-...}` block, against the
  README. Use `:where(:root)`. Also let `<OfflineDetector>` pass a CSP `nonce` to `OfflineTokens`.
- **A-M4.** If the status changes during the 150 ms exit animation, the dismissal is recorded under
  the new status and hides the "Back online" snackbar (`swipe.ts` with `react/src/dismissal.ts`).
- **A-M6.** The indicator name uses `String.replace` (first occurrence, `$&` special). Replace every
  occurrence literally, as `indicatorName` does.
- **A-M7.** Blur/focus from embedded iframes (card-field iframes) counts as "a return" and probes
  on every switch (`web/src/adapter.ts`). Ignore focus moves into an iframe.
- **A-M10.** FullScreen loses its focus-return target under StrictMode (the second setup records
  `<body>`), and inerts only siblings present at mount.
- **API:** everything under "The API after the fixes" for web: unexport internals, add
  `onContinueOffline`, honour `fullScreenTitle`, re-export the react API, the new web probe fetch.
- Update `apps/storybook-web`, `apps/demo-web` and `e2e/web-ui*` for any API change, keep their
  tests passing, and add E2E coverage for the dismissal focus return if it is feasible.

## W3: native

- **A-C1 (Critical).** A swiped-away piece stays invisible for the whole session
  (`native/src/use-swipe-dismiss.ts`, `slideOut`, with `offline-detector.tsx` keeping the pieces
  mounted). `translateX` and `opacity` are never reset, so after offline, swipe, online, the "Back
  online" snackbar is invisible; the banner leaves an empty strip; the indicator is gone; reduced
  motion is the same because `opacity.setValue(0)` is never undone; iOS still announces the
  invisible text. Reset the values when the piece becomes visible again (or remount per episode).
  The dismiss button path was not affected, which is why the composition tests passed: write the
  composition test that swipes, crosses the next transition, and asserts the piece is visible.
- **A-I2.** On iOS, dismissing the snackbar announces "No internet" again: `bannerAnnounces` flips
  true when the snackbar is dismissed, so `useIosAnnouncement` fires. User dismissal must never be
  announced and each transition is spoken once. "Continue offline" re-announces the same way.
- **A-I5.** With `initialStatus="offline"`, native shows "Back online" at launch when the first
  result is online (`native/src/use-timers.ts`, `useRecovery`). Web guards with
  `observed = lastChecked === null ? 'unknown' : status`. Do the same; test the hint then first
  result.
- **A-M1.** The native adapter does not de-duplicate interface events. NetInfo calls its listener
  right after subscribing, so every launch fires a second probe and discards the first, and any
  emission with `isConnected` unchanged restarts the probe. De-duplicate like web.
- **A-M9.** "Continue offline" is reset in an effect, so on a new offline episode one frame shows
  the snackbar (and announces on iOS) before the full-screen state returns. Derive it.
- **A-M12.** Expose `onRestoreFocus` from `OfflineDetector` (accessibility.md section 2).
- **API:** everything under "The API after the fixes" for native: pieces adopt the web props shape,
  unexport internals, re-export the react API. Update `apps/demo-native` (including the
  `.rnstorybook` stories and `tests/demo-native-storybook.test.ts`) for the new piece props.
- Re-prove Metro bundles the demo: `npx expo export --platform android`, flag off and on, and report
  module counts.

## W4: release, workflows, docs

- **B-I1 (blocks any release).** `tests/release.test.ts` asserts the pending changesets are exactly
  `['initial-release.md']`, but `pnpm changeset version` deletes that file and later PRs add others,
  so the pre-push hook, the release PR and `release.yml` itself all go red. Assert what stays true:
  every pending changeset names only the four packages; `initial-release.md` is required only while
  the package versions are `0.0.0`.
- **B-I2.** The repo has no `npm-publish` environment (`GET /environments` is empty), `main` is not
  protected and nothing restricts who can create `v*` tags. A job that names a missing environment
  makes GitHub create it with no reviewers, so a tag pushed first would publish without approval.
  RELEASING must make "create the environment with a required reviewer" step 0 of the first
  release; add owner steps for branch protection on `main` and a tag ruleset for `v*`. Also add, if
  and only if it is feasible with the workflow's `GITHUB_TOKEN`, a first step in `verify` that fails
  unless the environment has a required reviewer; verify feasibility from the GitHub docs and say
  plainly in the report if it is not.
- **B-I3.** The manual first-publish loop is bash-only and does not stop on failure: if `core`
  fails, the other three publish pinned to a `core@0.1.0` that does not exist and npm never lets
  the number be reused. Replace it with `pnpm changeset publish --no-git-tag` from the root, which
  publishes in dependency order, skips versions already on npm and stops after a failed batch.
  State the shell to use on Windows (Git Bash) and that `&&` is a PowerShell 5.1 parse error.
- **B-I4.** The `publish` job holds `id-token: write` yet runs `pnpm install` and `pnpm build`
  (which also builds Next, Docusaurus and Storybook): a compromised dev dependency could request the
  OIDC token and publish. Build and pack in `verify` (no `id-token`) with `pnpm changeset pack
--out-dir <dir>`, upload the tarballs as an artifact, and in `publish` only download them and run
  `pnpm changeset publish --from-pack-dir <dir> --no-git-tag`. Pin the artifact actions by commit
  SHA (resolve them with read-only `gh api`) and extend the workflow test.
- **B-I6.** `apps/docs/docs/slots.md` and `accessibility.md` (and the pt-BR and es copies) claim a
  slot without `rootProps` falls back to a "visually hidden announcer". No such announcer exists.
  Correct the pages: a slot must spread `rootProps`, and on iOS call
  `AccessibilityInfo.announceForAccessibility` itself.
- **B-I7 (privacy).** Update `PRIVACY.md`, `docs/privacy-policy.html` and the privacy page in all
  three docs locales: the packages send no cookies (`credentials: 'omit'`) and no `Referer`
  (`referrerPolicy: 'no-referrer'`); a response of any kind counts as reachable; a same-origin
  endpoint therefore receives no cookies. Keep the date and the section list in step and keep
  `tests/privacy.test.ts` green. The code that makes this true is being written by W1 and W2 in
  parallel; do not assert it from source in your tests (the integrator adds those after merging).
- **B-M1.** `ci.yml` puts `${{ steps.scope.outputs.mutate }}`, built from PR file names, straight
  into a `run:`: pass it through `env:`.
- **B-M2.** `SONAR_TOKEN` is a job-level env in `ci.yml`: scope it to the Sonar step. Pin
  `SonarSource/sonarqube-scan-action`, `chromaui/action` and `reactivecircus/android-emulator-runner`
  by commit SHA (verify each SHA against its tag with read-only `gh api`).
- **B-M4.** Drop build-metadata tags: `check-release-tag.cjs` accepts only `vX.Y.Z`.
- **B-M5.** Amend `CLAUDE.md` as decided above and make RELEASING consistent with it.
- **B-M6.** `NPM-SETUP.md` step 5 omits the environment name and the "Allowed actions: npm publish"
  tick: point it at `OWNER-ACTIONS.md`. `OWNER-ACTIONS.md` still has a stale "create the repo" step.
- **B-M8.** `apps/docs/docs/reference/web.md` should say `banner.position` is accepted and not yet
  applied (the page may be edited only for this sentence; the rest is synchronised later).
- **B-M9.** `tests/privacy.test.ts` scans four fixed file names per package for storage and network
  APIs: scan every non-test file under each `src`, and also look for `fetch(` outside the probe and
  for `navigator.language`. The RELEASING phrase tests are echoes that bent two sentences into
  lowercase starts: assert real facts instead (the step order, the commands).
- **B-M10.** `react` peer range `^18.0.0 || ^19.0.0` in `packages/*/package.json`, with
  `tests/packages.test.ts` updated; keep the React Native and NetInfo floors but add a "tested with"
  note to `docs/RELEASING.md`'s checklist (RN 0.86 and 0.87, NetInfo 12, React 19; React 18 and RN
  0.73 have not been run).
- **B-M11.** `release.yml`: add the `typecheck:tests` step `ci.yml` runs, drop the unused `previous`
  output, give `github-release` a timeout.
- **B-M13.** Set `NEXT_TELEMETRY_DISABLED=1` and `STORYBOOK_DISABLE_TELEMETRY=1` in CI workflows.
- **B-M14 and M15.** Add owner steps to `OWNER-ACTIONS.md`: turn on Dependabot alerts and security
  updates; wait for the first CodeQL scan to finish on `main` before tagging.

## Rules for every worker

- Superpowers flow: `superpowers:writing-plans` (a short plan file with a Tests section per level),
  then `superpowers:test-driven-development`.
- Babel 8 under Jest rejects explicit type arguments on any call; use casts or typed variables.
- Never rebase. Commit on your own branch in small commits ending with the `Co-Authored-By: Claude
Sonnet 5.5 <noreply@anthropic.com>` trailer. Do not push, open PRs or run `gh` writes.
- Finish with `pnpm build`, `typecheck`, `typecheck:tests`, `lint`, `format:check`, `lint:md` and
  `CI=1 pnpm test:ci` all passing in your worktree.
- Report factually: each finding fixed, the test that failed first, and anything you could not
  fix or verify, with the reason.
