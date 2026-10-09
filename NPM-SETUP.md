# npm account and scope setup (manual steps)

These steps need you, not the agent: creating accounts, enabling 2FA and
publishing credentials are things only the account owner can do.

**Decision (7 Oct 2026):** packages publish under your personal scope,
`@rogeriodocarmo/offline-detector-*`. The bare name `offline-detector` is
already taken on npm (v1.1.1, someone else's package), so everything must be
scoped anyway. The GitHub repo stays `RogerioDoCarmo/offline-detector`.

Planned packages:

| Package                                   | Purpose                                           |
| ----------------------------------------- | ------------------------------------------------- |
| `@rogeriodocarmo/offline-detector-core`   | Headless state machine, probe, adapter interface  |
| `@rogeriodocarmo/offline-detector-react`  | Provider, hooks, callbacks                        |
| `@rogeriodocarmo/offline-detector-web`    | DOM UI (snackbar, banner, indicator, full-screen) |
| `@rogeriodocarmo/offline-detector-native` | React Native UI, same four pieces                 |

## How scopes work (why this matters)

- A scope is either an npm **user** or an **organization**. They share one
  namespace.
- Your npm **username** is your scope. `@rogeriodocarmo/...` works **only if
  your npm username is exactly `rogeriodocarmo`**. If it is different, the
  scope is different, and the package names must change to match.
- Scoped packages are private by default. Publishing them publicly needs
  `--access public` (the release workflow will set this).

## Checklist

### 1. Find or create your npm account

- [ ] Go to <https://www.npmjs.com/login>. Sign in, or create an account.
- [ ] Note your exact **username** (profile page, top of the page).
- [ ] Is it `rogeriodocarmo`?
  - **Yes** -> the scope is already yours. Go to step 2.
  - **No, and `rogeriodocarmo` is free** -> create a new account with that
    username, or rename the existing one under _Account settings_. Renaming
    breaks old links to your existing packages, so prefer a new account if
    you already publish things.
  - **No, and `rogeriodocarmo` is taken** -> stop and tell Claude. Packages
    would have to use another scope, and this is a branding decision.

### 2. Turn on two-factor authentication

- [ ] _Account settings -> Two-Factor Authentication -> Enable._ Choose
      **Authorization and publishing** (the stricter option).
- [ ] Save the recovery codes somewhere outside this repository.

Provenance publishing (decision Q17) needs a verified account, and npm
requires 2FA for publishing anyway.

### 3. Confirm the scope is really yours

- [ ] Visit `https://www.npmjs.com/~rogeriodocarmo` and check it shows your
      profile.
- [ ] Optional sanity check once logged in from a terminal:

  ```bash
  npm login
  npm whoami
  ```

  The output must read `rogeriodocarmo`.

### 4. Check that no package name is already used

Run these once logged in. `E404` means the name is **free**. Anything else
means it is taken.

```bash
npm view @rogeriodocarmo/offline-detector-core name
npm view @rogeriodocarmo/offline-detector-react name
npm view @rogeriodocarmo/offline-detector-web name
npm view @rogeriodocarmo/offline-detector-native name
```

Because they live in your own scope, collisions are only possible if you
already published something with these names.

### 5. Prepare automated publishing

Releases use **npm trusted publishing (OIDC)**, which needs no long-lived
token. The package page only exists **after the first publish**, so the very
first version of each package is published once by hand (with 2FA), then
switched to trusted publishing.

The exact settings are easy to get wrong (the environment name, the
"Allowed actions: `npm publish`" tick, the order of the steps), so they are not
repeated here. Follow `docs/OWNER-ACTIONS.md`:

- [ ] "Create the npm-publish environment" **first**, before any tag.
- [ ] "Publish the first release by hand".
- [ ] "Configure npm trusted publishing", for each of the four packages.

Do **not** paste an npm token into chat, into a file in this repo, or into a
workflow. If a token is ever needed, it goes in GitHub _Settings -> Secrets_
only.

## Report back to Claude

Tell Claude just these facts, nothing secret:

1. Your exact npm username.
2. Whether 2FA is on (yes/no).
3. Whether any of the four names in step 4 returned something other than
   `E404`.
