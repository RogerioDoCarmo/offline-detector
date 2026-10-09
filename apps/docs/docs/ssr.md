---
id: ssr
title: Server rendering and Next.js
sidebar_position: 10
---

# Server rendering and Next.js

Importing the packages, creating the adapter and rendering on the server never touch `window`,
`document` or `navigator`. The server renders the tokens and your children, and no piece (unless
you pass `initialStatus="offline"`). The first connectivity check runs in an effect after mount, so
hydration produces the same markup as the server and nothing flashes.

## Next.js App Router

The component uses state and effects, so put it in a client component:

```tsx
'use client';

import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Offline({ children }: { children: React.ReactNode }) {
  return <OfflineDetector>{children}</OfflineDetector>;
}
```

Then use `<Offline>` in your root layout. The same applies to any hook from the React package: it
runs in client components only.

## `initialStatus`

Without `initialStatus`, the first render on the server and on the client shows the state `unknown`,
which `isOnline` treats as online. Pass `initialStatus="offline"` when you know better, for example
from a cookie or a request header:

```tsx
<OfflineDetector initialStatus="offline">{children}</OfflineDetector>
```

The server markup and the first client render then agree, and the hint holds until the first real
check completes. It is only a hint for the first paint: if the first real check finds the app
online, the pieces simply go away, with **no** "Back online" message.

## Static export

A statically exported site (Next.js `output: 'export'`, Docusaurus, Astro islands) works the same:
nothing runs until the page is in a browser. The [live demo](https://rogeriodocarmo.github.io/offline-detector/demo/)
is a static export.

## Content security policy

`<OfflineDetector>` renders one inline `<style>` element with the `--od-*` tokens and the piece
styles, and it does not take a `nonce` prop. A strict `style-src` without `unsafe-inline` therefore
blocks it. The building blocks are exported if you need to assemble your own: `OfflineTokens`
(accepts a `nonce`), `offlineTokensCss` and `offlineCss` (the CSS as strings). See the
[web reference](./reference/web.md). This path has not been tested against a real policy.
