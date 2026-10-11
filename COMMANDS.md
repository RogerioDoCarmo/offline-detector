# Development Commands Reference

Quick reference for the CLI commands used in this project.

> Package manager: **pnpm** (not npm/yarn). CI and every command below assume pnpm. The version
> is pinned in `package.json` → `packageManager`; CI reads it from there.

**Shells.** Commands are written for **Git Bash**. Windows PowerShell 5.1 has no `&&`
(`ParserError: the token '&&' is not a valid statement separator`): run the commands one per
line, or chain them with `;` (`git switch main; git pull`). Here-documents (`<<'EOF'`) only work
in Git Bash.

## Common Commands

```bash
pnpm install                 # Install the workspace (add --frozen-lockfile in CI)
pnpm build                   # Build every package and app (Turborepo, cached)
pnpm typecheck               # tsc --noEmit in every workspace
pnpm typecheck:tests         # tsc over the tests/ folder

pnpm test                    # Jest, all projects
pnpm test:ci                 # Jest with coverage and CI flags (what the workflow runs)
pnpm mutation                # Stryker mutation tests (core + react)
pnpm test:e2e                # Playwright (all browsers)
pnpm test:e2e:chromium       # Playwright, Chromium only (fast local loop)

pnpm lint                    # ESLint
pnpm lint:md                 # markdownlint (100 columns)
pnpm format:check            # Prettier, check only
pnpm format                  # Prettier, write
```

## Local development — which app to run

```bash
pnpm --filter @offline-detector/demo-web dev        # Next demo         http://localhost:3000
pnpm --filter @offline-detector/docs dev            # Docusaurus docs   http://localhost:3000
pnpm --filter @offline-detector/storybook-web dev   # Storybook (web)   http://localhost:6006
pnpm --filter @offline-detector/demo-native dev     # Expo (Metro) for the native demo
pnpm --filter @offline-detector/demo-native storybook   # Expo with on-device Storybook
```

The packages (`core`, `react`, `web`, `native`) are built by `pnpm build`. Jest and Metro map
them to **source**, so tests and the native demo do not need a build first; the Next demo and
the docs do.

### Opening the built sites (not as `file://`)

Double-clicking `apps/docs/build/index.html` or `apps/demo-web/out/index.html` shows a broken
page. Both are built for GitHub Pages: every asset URL starts with `/offline-detector/` (docs)
or `/offline-detector/demo/` (demo), which a `file://` page resolves to the drive root. Serve
them instead:

```bash
pnpm build

# Docs, with the same base path as Pages (run from the docs folder)
cd apps/docs
pnpm exec docusaurus serve --no-open
#   http://localhost:3000/offline-detector/
cd ../..

# Demo, from the dependency-free server the E2E suite uses
PORT=4173 node e2e/fixtures/serve.mjs
#   http://localhost:4173/offline-detector/demo/
```

In PowerShell set the port first: `$env:PORT = 4173; node e2e/fixtures/serve.mjs`.

## Testing — four tiers

| Tier               | Command                   | Proves                                    |
| ------------------ | ------------------------- | ----------------------------------------- |
| Unit / integration | `pnpm test`               | each unit behaves                         |
| Property-based     | (inside Jest, fast-check) | invariants hold for **any** input         |
| Mutation           | `pnpm mutation`           | the tests actually catch injected bugs    |
| End-to-end         | `pnpm test:e2e`, Maestro  | the real UI works in a browser / a device |

```bash
pnpm test                                        # all tests once
pnpm test -- --watch                             # watch mode
pnpm test -- --testPathPatterns tests/release    # one path (Jest 30 flag name)
pnpm test:ci                                     # coverage + CI flags
```

Assert **literal values**, never values computed by the code under test.

### Mutation tests

Config `stryker.config.json`; scoped to `packages/core/src` and `packages/react/src`, excluding
tests, stories and `index.ts`. Stryker runs through its own flat Jest config
(`jest.stryker.config.cjs`), not the `projects` split.

```bash
pnpm mutation                                                # full run
pnpm exec stryker run --mutate "packages/core/src/probe.ts"  # one file, far faster
```

CI runs it on the diff, so a PR gets an answer in about 30 s.

### End-to-end, web (Playwright)

```bash
pnpm test:e2e:chromium                                   # quick loop
pnpm exec playwright test e2e/smoke.spec.ts              # one spec
pnpm exec playwright test --project=webkit               # one engine
pnpm exec playwright show-report                         # open the last HTML report
```

`playwright.config.ts` starts `e2e/fixtures/serve.mjs` itself (it builds the demo first if
`apps/demo-web/out` is missing). Fixtures: `goOffline()`, `goOnline()` and `checkA11y()`
(axe, WCAG 2.0/2.1 A and AA; it waits for finite animations so a half-way colour is never
judged). Set `PLAYWRIGHT_BASE_URL` to test an already running site instead.

### End-to-end, native (Maestro)

Flows live in `apps/demo-native/.maestro/` (`offline-banner`, `retry`, `recovery`,
`dismiss-swipe`, `pt-br`). CI runs them with Maestro **2.11.0**, pinned by SHA-256 in
`.github/workflows/maestro.yml`.

```bash
maestro test apps/demo-native/.maestro               # all flows (needs a booted device)
maestro test apps/demo-native/.maestro/retry.yaml    # one flow
maestro studio                                       # interactive selector inspector
```

Selectors are stable `testID` / accessibility labels, never localised text: the demo ships in
English, Portuguese and Spanish.

## Code quality

```bash
pnpm lint          # ESLint (flat config, eslint.config.js)
pnpm lint:md       # markdownlint, 100 columns; CHANGELOG.md files are excluded
pnpm format        # Prettier write (width 90)
pnpm format:check  # Prettier check
pnpm typecheck     # every workspace, through Turborepo
```

Husky runs lint-staged on commit (ESLint + Prettier on staged files). Repo configuration
(CI, Dependabot, Changesets, manifests) is covered by meta-tests in `tests/`: change the config
and its test together.

## Packages, apps and the build

```text
packages/core     headless state machine, probe, adapter interface
packages/react    provider, hooks, callbacks
packages/web      DOM UI (snackbar, banner, indicator, full screen)
packages/native   React Native UI, same pieces
apps/demo-web     Next 16 static export        apps/demo-native   Expo SDK 57
apps/docs         Docusaurus (en, pt-BR, es)   apps/storybook-web Storybook 10
```

```bash
pnpm build                                              # everything, cached
pnpm exec turbo run build --filter=@offline-detector/demo-web   # one app and its dependencies
pnpm exec turbo run build --force                       # ignore the cache
pnpm --filter @offline-detector/docs build              # one workspace, no dependency build
```

## Package management

```bash
pnpm add <pkg> --filter @offline-detector/demo-web      # add to one workspace
pnpm add -D <pkg> -w                                    # add a dev tool to the root
pnpm remove <pkg> --filter <workspace>
pnpm outdated -r
pnpm why <pkg>
```

**Expo-managed packages in `apps/demo-native`** (`expo`, `expo-*`, `react-native`) are added with
`npx expo install <pkg>`, never `pnpm add`, so the SDK-compatible version is chosen.

Dependabot cannot fix a transitive dependency in a pnpm lockfile: use a `pnpm.overrides` entry
by hand (caret ranges only), and first check whether the advisory reaches what ships.

## Git workflow

### Branch strategy (Git Flow — strict)

```text
main (production) <- PR <- release/* or hotfix/*   (also develop)
develop (integration) <- PR <- feature/*, fix/*, chore/*
```

1. Work branches are cut **from `develop`**; their PRs target `develop`.
2. `main` takes merges only from `release/*`, `hotfix/*` and `develop`. The `protect main`
   ruleset requires a PR and the `Build, lint, typecheck and test` check.
3. **Never `git rebase`.** Bring a branch up to date with `git merge origin/develop`; fix a
   commit with another commit.
4. After anything lands on `main`, merge `main` back into `develop` (on a `chore/` branch, so
   conflicts are resolved off both long-lived branches). Use merge commits, not squash.

### Feature workflow

```bash
git switch develop
git pull
git switch -c feature/task-name

pnpm lint
pnpm typecheck
pnpm test
pnpm format:check

git add <files>
git commit -m "type: message"
git push -u origin feature/task-name
# open a PR into develop, then:
git switch develop
git pull
git branch -d feature/task-name
git fetch --prune
```

Use `-d` (lowercase) to delete branches: it refuses unmerged work.

### Commit types

`feat:` · `fix:` · `build:` · `ci:` · `test:` · `docs:` · `style:` · `refactor:` · `chore:`

### Pull requests and checks

```bash
gh pr create --base develop --title "type: message" --body-file pr.md
gh pr checks <number>
gh pr merge <number> --merge                      # merge commit, never --squash / --rebase
gh run list --branch main --limit 8
gh run view <run-id> --log
```

## Releasing

The full procedure, with the reasoning, is in `docs/RELEASING.md`; the owner-only steps are in
`docs/OWNER-ACTIONS.md`. In outline:

```bash
# 1. Describe the change for the version bump
pnpm changeset

# 2. On a release/x.y.z branch from develop: bump versions and changelogs
pnpm changeset version

# 3. Check exactly what will be published (run after pnpm build)
node scripts/verify-pack.cjs

# 4. Release PR into main, merge it, then tag the merge commit on main.
#    -a is required: the annotated tag's message becomes the GitHub Release notes.
git switch main
git pull
git tag -a v0.1.0 -m "offline-detector 0.1.0"
git push origin v0.1.0
```

Pushing the tag fires `release.yml`: `verify`, then `publish` waits for you to approve the
`npm-publish` environment, then a GitHub Release is created. All four packages share one
version (a Changesets _fixed_ group), and `scripts/check-release-tag.cjs` refuses a tag that
disagrees with the manifests.

### The first publish (by hand, once)

npm only allows trusted publishing on a package that already exists, so 0.1.0 is published
manually, from `main`, logged in to npm with 2FA:

```bash
npm whoami                                             # rogerio-do-carmo
npm org ls rogeriodocarmo                              # the @rogeriodocarmo scope is an org
pnpm install --frozen-lockfile
pnpm build
node scripts/verify-pack.cjs
pnpm changeset publish --no-git-tag --otp <code>
```

Never loop over the package folders by hand: `changeset publish` publishes in dependency order
and stops after a failed batch, so nothing is pinned to a version that does not exist.

## Repository settings (owner, via `gh api`)

```bash
gh api repos/RogerioDoCarmo/offline-detector/environments/npm-publish --jq '.protection_rules'
gh api repos/RogerioDoCarmo/offline-detector/rulesets --jq '.[] | {id, name, enforcement}'
gh api repos/RogerioDoCarmo/offline-detector/pages --jq '{html_url, build_type}'
gh api "repos/RogerioDoCarmo/offline-detector/code-scanning/alerts?state=open" --jq length
```

Pages is built by `.github/workflows/pages.yml` (docs at `/`, demo at `/demo/`, privacy policy
at `/privacy-policy.html`). Verify a deployment by **bytes**, not by a 200: compare
`curl -s <url> | wc -c` with `wc -c < <local file>`.

## Project-specific notes

- **Privacy:** the only network traffic is the configurable reachability probe
  (`https://cp.cloudflare.com/generate_204`, then `https://www.gstatic.com/generate_204`).
  Keep `PRIVACY.md` and `docs/privacy-policy.html` in sync with any change to it.
- **No custom native code**, and no Reanimated or `react-native-web` dependency.
- **Locales:** English, `pt-BR`, `es`. Add every new string to all three.
- **Source of truth:** `docs/superpowers/specs/2026-10-07-offline-detector-design.md`.

### Not wired up yet

- **SonarCloud** — the CI step skips itself until `SONAR_TOKEN` exists. To enable: import the
  project (key `RogerioDoCarmo_offline-detector`), add the secret, and turn Automatic Analysis
  off in SonarCloud, since it conflicts with CI-based analysis.
- **Chromatic** — the workflow exists; it needs its project token.
- **Promo video** — not started.
