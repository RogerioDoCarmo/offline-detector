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

Publishes the docs and demo site under the owner's name. Branch `main`, folder `/docs` is the
standing convention; revisit when Plan 6 defines the Pages build.

```bash
gh api -X POST repos/RogerioDoCarmo/offline-detector/pages \
  -f "source[branch]=main" -f "source[path]=/docs"
gh api repos/RogerioDoCarmo/offline-detector/pages --jq .status
```

Poll until the status reads `built`, then compare the live bytes against the local file.

## Create the npm-publish environment

In GitHub: Settings, Environments, New environment `npm-publish`, add the owner as required
reviewer. Trusted publishing for each package is configured on npmjs.com after its first manual
publish; see `NPM-SETUP.md`.
