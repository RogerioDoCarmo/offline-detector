# Owner actions

Everything here is outward-facing: it publishes something, changes a third-party service or uses an
account only the owner controls. Nothing in this list runs without the owner saying so.

The repository already exists. The first four sections are **step 0 of the first release**: do them
before any `v*` tag is pushed (see `docs/RELEASING.md`). The commands use a POSIX shell with
here-documents, so run them in Git Bash on Windows; PowerShell 5.1 cannot run them as written.

## Create the npm-publish environment

The release workflow's publish job runs in this environment, so nothing reaches npm until you
approve it. **Create it before the first tag.** A job that names an environment which does not
exist makes GitHub create it with no reviewers, and that publish would then run unapproved. Two
settings matter: you are the required reviewer, and only `v*.*.*` tags can deploy to it.

```bash
gh api -X PUT repos/RogerioDoCarmo/offline-detector/environments/npm-publish --input - <<EOF
{
  "reviewers": [{ "type": "User", "id": $(gh api users/RogerioDoCarmo --jq .id) }],
  "prevent_self_review": false,
  "deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
EOF
gh api -X POST repos/RogerioDoCarmo/offline-detector/environments/npm-publish/deployment-branch-policies \
  -f name='v*.*.*' -f type=tag
```

`prevent_self_review` is false on purpose: you are the only reviewer and also the person who pushes
the tag, so true would make the job impossible to approve.

Check it: the command below must print `1` or more.

```bash
gh api repos/RogerioDoCarmo/offline-detector/environments/npm-publish \
  --jq '[.protection_rules[] | select(.type=="required_reviewers")] | length'
```

The release workflow runs the same query as its first step and fails the run if the answer is 0
or the environment is missing.

## Protect main

Releases and Git Flow both go through pull requests into `main`. This ruleset requires one, requires
the CI check, and blocks force-pushes and deletion. Nobody is exempt from the pull request, so
merge the release PR (not a direct push).

```bash
gh api -X POST repos/RogerioDoCarmo/offline-detector/rulesets --input - <<'EOF'
{
  "name": "protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "Build, lint, typecheck and test" }] } }
  ]
}
EOF
```

## Restrict who can create release tags

Without this, anyone with write access can push a `v*` tag and start the release workflow (the
environment still waits for you, but the run, the build and the artifact would exist). Only
repository admins, which is you, may create, move or delete a `v*` tag.

```bash
gh api -X POST repos/RogerioDoCarmo/offline-detector/rulesets --input - <<'EOF'
{
  "name": "release tags",
  "target": "tag",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/tags/v*"], "exclude": [] } },
  "rules": [{ "type": "creation" }, { "type": "update" }, { "type": "deletion" }],
  "bypass_actors": [{ "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" }]
}
EOF
```

`actor_id` 5 is the built-in Admin role.

## Enable CodeQL default setup

Default setup detects languages itself; do not add a workflow unless it fails.

```bash
gh api -X PATCH repos/RogerioDoCarmo/offline-detector/code-scanning/default-setup \
  -f state=configured -f query_suite=default
```

**Wait for the first scan to finish on `main` before tagging**, and read what it found. A release
should not be the first time anyone looks at the code scanning results.

```bash
gh api "repos/RogerioDoCarmo/offline-detector/code-scanning/analyses?ref=refs/heads/main" \
  --jq '.[0] | {commit_sha, created_at, error}'
gh api "repos/RogerioDoCarmo/offline-detector/code-scanning/alerts?state=open" --jq length
```

## Enable Dependabot alerts and security updates

`.github/dependabot.yml` only schedules version updates. Alerts and automatic security pull requests
are separate repository settings, and they are off until you turn them on.

```bash
gh api -X PUT repos/RogerioDoCarmo/offline-detector/vulnerability-alerts
gh api -X PUT repos/RogerioDoCarmo/offline-detector/automated-security-fixes
```

Security updates open against the default branch (`main`), not `develop`, whatever `target-branch`
says. Dependabot cannot fix a transitive dependency inside a pnpm lockfile: for those, add a
`pnpm.overrides` entry by hand, after checking the advisory reaches what ships.

## Enable GitHub Pages

Publishes the docs and the web demo as one site under the owner's name:
`https://rogeriodocarmo.github.io/offline-detector/`. Nothing in the repository enables it.

The site is **built** by `.github/workflows/pages.yml` (docs at the root, the demo under `/demo/`,
and `docs/privacy-policy.html` at `/privacy-policy.html` once that file exists), so the Pages source
must be **GitHub Actions**, not a branch and folder. The older convention of `main` and `/docs` does
not apply here, because `/docs` holds sources, not the built site.

```bash
gh api -X POST repos/RogerioDoCarmo/offline-detector/pages -f build_type=workflow
# if Pages already exists with another source:
gh api -X PUT repos/RogerioDoCarmo/offline-detector/pages -f build_type=workflow
```

Then merge to `main` (or run the workflow manually from `main`) and poll until the status reads
`built`:

```bash
gh api repos/RogerioDoCarmo/offline-detector/pages --jq .status
```

Verify by bytes, not by a 200. A 200 can come from a stale copy elsewhere (a project site shadows a
same-named folder in the user site). Build the docs locally and compare the length of the live page
with the local file:

```bash
pnpm --filter @offline-detector/docs build
wc -c < apps/docs/build/index.html
curl -s https://rogeriodocarmo.github.io/offline-detector/ | wc -c
```

The two numbers must match. Check `/demo/` the same way against `apps/demo-web/out/index.html`.

## Publish the first release by hand

Once, because npm only lets you configure trusted publishing on a package that already exists.
The exact steps are in `docs/RELEASING.md`, section "The first release". The short version: log in
to npm with two-factor authentication, then run this once from the repository root, in Git Bash
(PowerShell 5.1 does not understand `&&`):

```bash
pnpm changeset publish --no-git-tag
```

It publishes in dependency order, skips a version already on npm and stops after a failed batch, so
nothing is ever published pinned to a version that does not exist. Do not loop over the four
package folders by hand: a failed `core` would not stop the other three. Confirm your npm username
is exactly `rogeriodocarmo` first (`NPM-SETUP.md`).

## Configure npm trusted publishing

For each of the four packages, on npmjs.com: Packages, the package, Settings, Trusted publishing,
GitHub Actions.

| Field                | Value              |
| -------------------- | ------------------ |
| Organization or user | `RogerioDoCarmo`   |
| Repository           | `offline-detector` |
| Workflow filename    | `release.yml`      |
| Environment name     | `npm-publish`      |
| Allowed actions      | tick `npm publish` |

The last row is easy to miss: configs created after 3 September 2026 allow only staged publish by
default, and the workflow publishes directly, so without the tick the first automated release
fails with a permissions error. A connection cannot be edited afterwards; delete and recreate it
to change a field.

## Set up SonarCloud

The CI scan step is already wired and skips itself until all of this exists. None of it can be
done from the repository.

1. On sonarcloud.io, open the organisation `rogeriodocarmo`, choose Analyze new project and import
   `RogerioDoCarmo/offline-detector`. The project key must be `RogerioDoCarmo_offline-detector`.
2. In the project's Administration, Analysis Method, turn Automatic Analysis OFF. It conflicts
   with the CI-based scan and the second analysis is rejected.
3. Generate a token (My Account, Security) and add it as the repository secret `SONAR_TOKEN`
   (Settings, Secrets and variables, Actions).

The scan is non-blocking by design: a SonarCloud outage never turns the `verify` check red.
