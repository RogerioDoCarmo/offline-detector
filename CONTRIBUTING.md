# Contributing

Thanks for wanting to help. Bug reports, questions, documentation fixes, translations and code are
all welcome. The library is at 0.x, so the API may still change; if you plan a larger change, open
an issue first so we can agree on the shape before you spend time on it.

By contributing you agree that your work is released under the [MIT license](LICENSE).

## Ways to help

- **Report a bug or ask for a feature:** open an issue. For a bug, say which package
  (`core`, `react`, `web` or `native`), its version, the platform, and the smallest steps that
  reproduce it.
- **Improve the docs:** the site lives in `apps/docs` (English, Portuguese and Spanish).
- **Send code:** follow the workflow below.

## Set up

You need Node and **pnpm** (the version is pinned in `package.json`, `packageManager`).

```bash
pnpm install
pnpm build
```

[COMMANDS.md](COMMANDS.md) lists every command and which demo, docs or Storybook app to run.

## Workflow

The repository uses Git Flow.

1. Cut a `feature/*`, `fix/*` or `chore/*` branch from `develop`.
2. Open your pull request **into `develop`**. `main` only receives merges from `develop`,
   `release/*` and `hotfix/*` branches.
3. **Never rebase.** To bring your branch up to date, merge: `git merge origin/develop`. To fix
   something already committed, add another commit.
4. If your change touches a published package, add a changeset with `pnpm changeset`. The four
   packages share one version.

Releases are made by the maintainer; see [docs/RELEASING.md](docs/RELEASING.md).

## Quality bar

A change ships with tests at every level the repository supports, and the assertions use literal
values rather than values computed by the code under test.

```bash
pnpm lint
pnpm typecheck
pnpm test              # unit and property tests (Jest, fast-check)
pnpm test:e2e:chromium # E2E and accessibility (Playwright, axe)
pnpm mutation          # mutation tests (Stryker, core and react)
pnpm format:check
pnpm lint:md
```

- Repository configuration (CI, Dependabot, Changesets, package manifests) is covered by tests in
  `tests/`. Change the configuration and its test together.
- Accessibility is a test, not a review: new UI is checked with axe, in light and dark.
- Git hooks (Husky) run lint-staged on commit and typecheck plus the unit tests on push.

## Boundaries

These keep the library small and trustworthy, so a pull request that crosses one will be asked to
change.

- **No custom native code.** React Native support goes through NetInfo.
- **No Reanimated and no `react-native-web` dependency.**
- **Privacy:** the only network traffic the library makes is the configurable reachability probe.
  If you change it, update [PRIVACY.md](PRIVACY.md) in the same pull request.

## Pull requests

Keep a pull request to one change, say what it does and why, and describe how you tested it. CI
must pass before it is merged.
