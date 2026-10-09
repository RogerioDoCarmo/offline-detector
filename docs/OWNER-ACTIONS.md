# Owner actions

Everything here is outward-facing: it publishes something, changes a third-party service or uses an
account only the owner controls. Nothing in this list runs without the owner saying so.

## Create the GitHub repository

```bash
gh repo create RogerioDoCarmo/offline-detector --public --source . --remote origin
git push -u origin main develop
```

## Enable CodeQL default setup

Default setup detects languages itself; do not add a workflow unless it fails.

```bash
gh api -X PATCH repos/RogerioDoCarmo/offline-detector/code-scanning/default-setup \
  -f state=configured -f query_suite=default
```

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

## Create the npm-publish environment

In GitHub: Settings, Environments, New environment `npm-publish`, add the owner as required
reviewer. Trusted publishing for each package is configured on npmjs.com after its first manual
publish; see `NPM-SETUP.md`.

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
