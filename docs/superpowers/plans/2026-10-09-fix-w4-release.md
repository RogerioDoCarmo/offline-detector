# Fix pass W4: release, workflows, docs

Contract: `docs/superpowers/specs/2026-10-09-final-review-fixes.md`, section W4. Branch
`fix/release`. Every item is test first: the test changes, fails for the stated reason, then the
file is fixed.

## Order

1. B-I1 and B-M4: `tests/release.test.ts` changeset and tag tests, `check-release-tag.cjs`.
2. B-I4, B-I2, B-M11: `release.yml` (pack in `verify`, publish from the tarballs, environment check,
   `typecheck:tests`, timeout), `verify-pack.cjs` taking a directory.
3. B-M1, B-M2, B-M13: `ci.yml` and the other workflows (env indirection, scoped token, SHA pins,
   telemetry off).
4. B-I2, B-I3, B-M5, B-M6, B-M10, B-M14, B-M15: RELEASING, OWNER-ACTIONS, NPM-SETUP, CLAUDE.md,
   peer ranges.
5. B-I6, B-I7, B-M8: docs pages in three locales, PRIVACY.md, the policy page.

## Tests

- **Unit / meta (`tests/*.test.ts`)**
  - New: `release.test.ts` changeset rules (frontmatter names only the four packages; the initial
    changeset is required only at `0.0.0`), tag tests without build metadata, `verify-pack.cjs`
    directory mode, `release.yml` structure (artifact flow, no `pnpm build` or `id-token` in the
    same job, environment check), SHA pins in every workflow for the named third-party actions,
    `ci.yml` env indirection, telemetry variables, docs wording tests per locale.
  - Changed: `privacy.test.ts` (scan every non-test source file; `fetch(` and `navigator.language`
    allow-lists; the RELEASING echo phrases replaced by step order and commands),
    `packages.test.ts` (react peer range), `ci-config.test.ts` (OWNER-ACTIONS headings),
    `release.test.ts` action count.
- **Property**: none apply (no new pure logic beyond `checkTag`).
- **E2E**: none; no user-facing behaviour changes in this worker.
- **Mutation**: Stryker's scope is `core` and `react` only; nothing here is in scope.
- **Not asserted**: W1 to W3 behaviour (`credentials: 'omit'`, `referrerPolicy`); the integrator
  adds those after the merge.
