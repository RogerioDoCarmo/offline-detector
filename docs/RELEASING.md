# Releasing

How a release of the four packages is made, and what stops a wrong one. The workflow is
`.github/workflows/release.yml`. Git Flow applies throughout: releases are cut from `main`, and
we never rebase.

```text
PR with a changeset ──> develop ──> release/x.y.z (pnpm changeset version) ──> PR to main
                                                                                  │
   merge main back into develop <── GitHub Release <── npm publish <── approval <─┤
                                                                                  │
                        owner tags the merge commit on main:  git tag -a vX.Y.Z  ─┘
```

## Every release

1. **In each PR that changes a package**, add a changeset with `pnpm changeset`. The four packages
   are one fixed group: they always share a version, so any bump moves all four.
2. **Cut the release branch** from `develop`: `git switch -c release/0.2.0 develop`. Run
   `pnpm changeset version`; it consumes the changesets, bumps the four packages and writes each
   package's `CHANGELOG.md`. Review the diff, commit it, and open a PR into `main`.
3. **Merge that PR into `main`** once it is green.
4. **Tag the merge commit** on `main`, annotated. The tag message is the release notes, so write
   them there:

   ```bash
   git switch main && git pull
   git tag -a v0.2.0
   git push origin v0.2.0
   ```

5. **Approve the publish.** In GitHub, Actions, the Release run: `verify` runs by itself, then
   `publish` waits for you. Open it and approve the `npm-publish` environment. Nothing reaches npm
   before that.
6. **Merge `main` back into `develop`**: `git switch develop && git merge origin/main`. Merge it;
   never rebase.
7. **Check the result**: `npm view @rogeriodocarmo/offline-detector-core version`, the Provenance
   badge on each package's npm page, and an install in a scratch project.

## What the workflow refuses

| Check               | Fails when                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Annotated tag       | the tag is lightweight (its message is the release notes)                                           |
| On `main`           | the tagged commit is not reachable from `origin/main`                                               |
| Tag equals versions | any package version differs from the tag (build metadata `+x` is ignored; pre-releases are refused) |
| All gates           | `typecheck`, `lint`, `format:check`, `lint:md` or `test:ci` fail                                    |
| Pack check          | a tarball has source or tests, a leftover `workspace:` range, a missing file, or is over 300 KB     |
| Approval            | you do not approve the `npm-publish` environment                                                    |
| npm version         | the runner's npm is older than 11.5.1 (trusted publishing needs it)                                 |

## The first release (manual, once)

npm configures Trusted publishing on a package's settings page, so the package has to exist first.
That makes the first publish of each package a manual step. After it, every release is automatic.

1. Make sure `main` holds the release commit, with a clean working tree, and the version has been
   bumped to `0.1.0` as in step 2 above.
2. Build and check the tarballs: `pnpm install --frozen-lockfile && pnpm build &&
node scripts/verify-pack.cjs`.
3. Log in with two-factor authentication (`npm login`), then publish, dependencies first:

   ```bash
   for p in core react web native; do (cd packages/$p && pnpm publish --access public); done
   ```

   Use `pnpm publish`, never plain `npm publish`. pnpm rewrites the `workspace:` dependency ranges
   to the real version before uploading; npm would upload the placeholder and the package would be
   uninstallable. No provenance flag is needed or possible here: provenance is generated
   automatically when a public repository publishes through trusted publishing.

4. Configure Trusted publishing for each of the four packages (npmjs.com, the package, Settings,
   Trusted publishing, GitHub Actions):

   | Field                | Value                                                                                                                         |
   | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
   | Organization or user | `RogerioDoCarmo`                                                                                                              |
   | Repository           | `offline-detector`                                                                                                            |
   | Workflow filename    | `release.yml`                                                                                                                 |
   | Environment name     | `npm-publish`                                                                                                                 |
   | Allowed actions      | tick `npm publish` (configs made after 3 Sep 2026 allow only staged publish by default, and this workflow publishes directly) |

5. Tag `v0.1.0` as in step 4 above. The pipeline runs: the publish job finds all four versions
   already on npm and skips them, then the GitHub Release is created.

The OIDC publish path is first exercised by the **next** version, because `0.1.0` is already on npm.
Make that release a small patch so any problem is easy to see.

## When something fails

- **`verify` fails:** nothing was published. Fix it with a new commit, and if the tag points at the
  wrong commit, delete it (`git push --delete origin vX.Y.Z`) and tag again. Only do this while
  nothing has been published.
- **`publish` fails part-way:** some packages may be on npm already. rerun the failed job from the
  Actions page; packages already published at that version are skipped.
- **A published version is wrong:** npm versions are immutable. Fix forward with a new patch and
  `npm deprecate` the bad one. Never try to reuse a version number.

## Rules

- never rebase: merge `main` back into `develop` with `git merge origin/main`.
- No npm token anywhere: not in secrets, not in a file, not in chat. Publishing uses OIDC.
- Do not publish from a laptop once trusted publishing is set up, except to recover.
- The release workflow pins every action by commit SHA; Dependabot proposes the updates.
