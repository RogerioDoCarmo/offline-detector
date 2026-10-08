# Quality assurance

How the repository checks itself. Every config below is covered by a meta-test in
`tests/qa-config.test.ts` (or `tests/ci-config.test.ts`); change the config and its test together.

## What runs where

| Check               | Command                      | Where it runs                                       |
| ------------------- | ---------------------------- | --------------------------------------------------- |
| Unit and property   | `pnpm test` / `pnpm test:ci` | `verify` job, every push and PR                     |
| Type-check packages | `pnpm typecheck`             | `verify` job                                        |
| Type-check tests    | `pnpm typecheck:tests`       | `verify` job; covers `tests/`, `e2e/`, Playwright   |
| SonarCloud          | `sonarqube-scan-action@v8`   | `verify` job; non-blocking, see below               |
| Mutation            | `pnpm mutation`              | `mutation` job, pull requests only, changed files   |
| E2E (web)           | `pnpm test:e2e`              | `e2e.yml`: chromium on PRs, five projects elsewhere |

## SonarCloud

`sonar-project.properties` analyses `packages/*/src` and `apps/**` and reads
`coverage/lcov.info` from `pnpm test:ci`. The CI step is `continue-on-error`, so a SonarCloud outage
never turns `verify` red, and it is skipped for Dependabot, for forks and while `SONAR_TOKEN` is
empty. The owner has to create the project and the secret once: see `docs/OWNER-ACTIONS.md`.

## Mutation testing (Stryker)

Scope: `packages/core/src` and `packages/react/src`, minus tests, stories and `index.ts` barrels.
Thresholds are 80 high, 60 low, 60 break. Demo apps are outside the scope.

- Whole scope: `pnpm mutation`. One file: `pnpm mutation --mutate "packages/core/src/foo.ts"`. Do
  not put `--` before the flag; pnpm 10 forwards it to Stryker, which rejects it.
- On pull requests the `mutation` job mutates only the source files the PR touches. A changed test
  maps back to its source, so weakening assertions alone is still caught.
- Write mutation-resistant tests: literal expected values, not values computed by the code under
  test.

### Windows

Stryker copies the project into `.stryker-tmp`, and Jest 30 on Windows mangles its `testMatch` globs
when the root directory path contains a dot-prefixed folder, so the initial run reports "No tests
were found". Linux and macOS (and therefore CI) are unaffected. Locally on Windows, run from a
checkout whose path has no dot-folder and pass a plain temp name:

```bash
pnpm mutation --tempDirName stryker-tmp
```

Delete the `stryker-tmp` folder afterwards. The same cause makes a bare `pnpm test` find no tests
inside a worktree under `.claude/worktrees`; there pass
`--testMatch "**/tests/**/*.test.ts" --testPathIgnorePatterns=node_modules`.

## End-to-end tests (Playwright)

`playwright.config.ts` defines five projects: `chromium`, `firefox`, `webkit`, `mobile-chrome`
(Pixel 5) and `mobile-safari` (iPhone 12). CI retries once and uses four workers; traces, screenshots
and videos are kept for failures only. `PLAYWRIGHT_BASE_URL` points the suite at a running app and
skips the built-in server.

- `e2e/fixtures/test.ts` extends Playwright's `test` with
  - `goOffline()`: `context.setOffline(true)` and a window `offline` event,
  - `goOnline()`: the reverse,
  - `checkA11y()`: an axe run for WCAG 2.0/2.1 A and AA that fails on any violation.
- `e2e/fixtures/stability.ts` has `waitForHydrated` and `reloadWithRetry`, from the website repo.
- `e2e/fixtures/site/index.html` is a tiny static page that shows `Online` or `Offline` from the
  window events. `e2e/fixtures/serve.mjs` serves it with plain `node:http`, so nothing is
  downloaded when the tests start. Library UI specs replace it later.
- Run: `pnpm test:e2e` (all projects) or `pnpm test:e2e:chromium`. Browsers are installed with
  `pnpm exec playwright install --with-deps <browser>`; the workflow installs only the browser each
  project needs and caches it.
- `.github/workflows/e2e.yml` runs on PRs (chromium), on pushes to `main` and `develop` and nightly
  at 02:00 UTC (all five), and can be started by hand.
