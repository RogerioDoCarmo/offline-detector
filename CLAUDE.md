# offline-detector — agent instructions

Source of truth: `docs/superpowers/specs/2026-10-07-offline-detector-design.md`. Plans live in
`docs/superpowers/plans/`.

## Git

- Git Flow, strictly. `main` receives merges from `develop` only. Work happens on `feature/*`,
  `fix/*` or `chore/*` branches cut from `develop`; PRs target `develop`.
- Never rebase. Bring a branch up to date with `git merge origin/develop`. To fix something
  committed, make another commit.

## Quality

- Every change ships tests at every level the repo supports (unit, property, E2E, mutation) once
  that level exists. Assert literal values, not values computed by the code under test.
- Repo configuration (CI, Dependabot, Changesets, package manifests) is covered by meta-tests in
  `tests/`. Change the config and its test together.

## Boundaries

- No custom native code. No Reanimated or `react-native-web` dependency.
- Anything outward-facing (creating the GitHub repo, pushing, enabling CodeQL or Pages,
  publishing to npm) needs the owner's explicit go-ahead first.
- Privacy: the only network traffic is the configurable reachability probe. Keep `PRIVACY.md` in
  sync with any change to it.
