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

`main` receives merges from `develop` and, as Git Flow prescribes, from `release/*` and `hotfix/*`
branches. Feature work never goes straight to `main`.

## Step 0: before the first tag is ever pushed

Do this once, **before** `v0.1.0` exists. It cannot wait until the first release fails.

A job that names an environment which does not exist makes GitHub create that environment on the
spot, with no required reviewer. A tag pushed before the owner set things up would therefore publish
to npm **without anyone approving it**. So, in this order (the commands are in
`docs/OWNER-ACTIONS.md`):

1. **Create the `npm-publish` environment with you as required reviewer**, limited to `v*.*.*`
   tags. This is the approval gate; nothing else in this document replaces it.
2. **Protect `main`**: pull request required, the CI check required, no force-push, no deletion.
3. **Add a tag ruleset for `v*`**, so only you can create, move or delete a release tag.
4. **Wait for the first CodeQL scan** to finish on `main` and read what it found.

The workflow backs step 1 up: its first step reads the environment with the job's own token
(`actions: read`) and fails the run unless a required reviewer is configured. That check fails
closed, and it is a second line, not the first: it only helps once the tag is pushed.

## Every release

1. **In each PR that changes a package**, add a changeset with `pnpm changeset`. The four packages
   are one fixed group: they always share a version, so any bump moves all four.
2. **Cut the release branch** from `develop`: `git switch -c release/0.2.0 develop`. Run
   `pnpm changeset version`; it consumes the changesets, bumps the four packages and writes each
   package's `CHANGELOG.md`. Review the diff, commit it, and open a PR into `main`.
3. **Merge that PR into `main`** once it is green.
4. **Tag the merge commit** on `main`, annotated. The tag message is the release notes, so write
   them there. The tag is plain `vX.Y.Z`: pre-release (`-rc.1`) and build-metadata (`+x`) tags are
   refused.

   ```bash
   git switch main && git pull
   git tag -a v0.2.0
   git push origin v0.2.0
   ```

5. **Approve the publish.** In GitHub, Actions, the Release run: `verify` runs by itself, building
   and checking the tarballs, then `publish` waits for you. Open it and approve the `npm-publish`
   environment. Nothing reaches npm before that.
6. **Merge `main` back into `develop`**: `git switch develop && git merge origin/main`. Merge it;
   never rebase.
7. **Check the result**: `npm view @rogeriodocarmo/offline-detector-core version`, the Provenance
   badge on each package's npm page, and an install in a scratch project.

## What the workflow refuses

| Check               | Fails when                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Environment         | `npm-publish` is missing or has no required reviewer (the first step of `verify`)               |
| Annotated tag       | the tag is lightweight (its message is the release notes)                                       |
| On `main`           | the tagged commit is not reachable from `origin/main`                                           |
| Tag equals versions | any package version differs from the tag; only plain `vX.Y.Z` is accepted                       |
| All gates           | `typecheck`, `typecheck:tests`, `lint`, `format:check`, `lint:md` or `test:ci` fail             |
| Pack check          | a tarball has source or tests, a leftover `workspace:` range, a missing file, or is over 300 KB |
| Approval            | you do not approve the `npm-publish` environment                                                |
| npm version         | the runner's npm is older than 11.5.1 (trusted publishing needs it)                             |

The tarballs are built **once**, in `verify` (which has no `id-token` permission), checked there,
and uploaded as the `release-packages` artifact. The `publish` job, the only one that can mint the
OIDC token, installs just the changeset CLI (no install scripts), downloads that artifact and
publishes those exact files with `pnpm changeset publish --from-pack-dir`. It builds nothing.

## The first release (manual, once)

npm configures Trusted publishing on a package's settings page, so the package has to exist first.
That makes the first publish of each package a manual step. After it, every release is automatic.
Do step 0 above first.

**Which shell.** Use **Git Bash** on Windows, or any POSIX shell. PowerShell 5.1 (the default
Windows PowerShell) does not know `&&`: it is a parse error there, and the line does nothing.
Run the commands one per line, or use `;` in PowerShell, and check each one succeeded before the
next.

1. Make sure `main` holds the release commit, with a clean working tree, and the version has been
   bumped to `0.1.0` as in step 2 above.
2. Build and check the tarballs, one command per line:

   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   node scripts/verify-pack.cjs
   ```

3. Log in with two-factor authentication (`npm login`), then publish **from the repository root**:

   ```bash
   pnpm changeset publish --no-git-tag
   ```

   This publishes in dependency order (core, then react, then web and native), skips a version that
   is already on npm, and **stops after a batch with a failure**, so a package is never published
   pinned to a dependency version that does not exist. A hand-written loop over the four folders
   does none of that: if `core` failed it would carry on, publish the other three pinned to a
   `core@0.1.0` that is not on npm, and npm never lets a version number be used again.

   The command packs through pnpm, which rewrites the `workspace:` dependency ranges to the real
   version before uploading; plain `npm publish` would upload the placeholder and the package would
   be uninstallable. No provenance flag is needed or possible here: provenance is generated
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

5. Tag `v0.1.0` as in step 4 above. The pipeline runs: the packed plan finds all four versions
   already on npm and leaves them out, then the GitHub Release is created.

The OIDC publish path is first exercised by the **next** version, because `0.1.0` is already on npm.
Make that release a small patch so any problem is easy to see.

## Tested with

The peer ranges are floors, not promises: `react` `^18.0.0 || ^19.0.0`, `react-native`
`>=0.73.0`, `@react-native-community/netinfo` `>=11.0.0`. What has actually been run:

- React 19, React Native 0.86 and 0.87, NetInfo 12.
- **Not run:** React 18, React Native 0.73 to 0.85, NetInfo 11. Say so in the release notes until
  they are, and tick this list again before each release.

## When something fails

- **`verify` fails:** nothing was published. Fix it with a new commit, and if the tag points at the
  wrong commit, delete it (`git push --delete origin vX.Y.Z`) and tag again. Only do this while
  nothing has been published.
- **`verify` fails on the environment check:** the `npm-publish` environment is missing or has no
  required reviewer. Fix it as in step 0, then push the tag again. If the step cannot read the
  environment at all (an error rather than "no required reviewer"), the token lacks `actions: read`.
- **`publish` fails part-way:** some packages may be on npm already. Rerun the failed job from the
  Actions page: it publishes the same tarballs again, and a version npm already holds is skipped
  rather than failing. The artifact is kept for one day; after that, delete the tag and push it
  again (only while nothing is published) or rerun the whole workflow.
- **A published version is wrong:** npm versions are immutable. Fix forward with a new patch and
  `npm deprecate` the bad one. Never try to reuse a version number.

## Rules

- Never rebase: merge `main` back into `develop` with `git merge origin/main`.
- No npm token anywhere: not in secrets, not in a file, not in chat. Publishing uses OIDC.
- Do not publish from a laptop once trusted publishing is set up, except to recover.
- The release workflow pins every action by commit SHA; Dependabot proposes the updates.
