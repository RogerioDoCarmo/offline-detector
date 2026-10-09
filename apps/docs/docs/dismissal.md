---
id: dismissal
title: Dismissal
sidebar_position: 6
---

# Dismissal and the `dismissible` flag

The snackbar, the banner and the indicator can be dismissed by the person using the app. The
full-screen state is never dismissed this way: it has its own "Continue offline" action.

Dismissal is **on by default**. One flag turns it off:

```tsx
<OfflineDetector dismissible={false}>
  <App />
</OfflineDetector>
```

A per-piece value wins over the global one:

```tsx
<OfflineDetector dismissible={false} banner={{ dismissible: true }}>
  <App />
</OfflineDetector>
```

## How a piece is dismissed

| Piece     | Gesture             | Without a gesture                                            |
| --------- | ------------------- | ------------------------------------------------------------ |
| Snackbar  | Swipe left or right | The Dismiss button (44 by 44), or Escape while focused       |
| Banner    | Swipe left or right | The Dismiss icon button at the inline end, or Escape         |
| Indicator | Swipe left or right | Escape or Delete while focused; a `dismiss` action on native |

A swipe is a path-based gesture, so every dismissible piece has an alternative that needs only a
single tap or key press.

The swipe rules:

- A horizontal drag in either direction. The piece follows the finger or pointer.
- Releasing at or past **30 percent** of its width, or at **0.5 px/ms** or faster, dismisses.
  Anything less springs back.
- After 8 px of movement the drag locks to its dominant axis, so vertical scrolling keeps working.
- Under reduced motion the piece fades out instead of sliding.

## What "dismissed" means

- Only the piece is hidden. The connection state is unchanged, `useNetworkStatus()` and the
  callbacks are unaffected, and the other pieces keep showing.
- A dismissed piece stays hidden until the **next status transition** (offline, then online, then
  offline again shows the pieces again). The recovery snackbar still shows on recovery.
- Dismissal is kept in memory only. A reload resets it. Nothing is stored.
- Dismissing the banner reflows the content below it.
- Dismissing by the user is not announced to screen readers: the user caused it.
- On the web, dismissing a piece that held keyboard focus puts focus back on the element that had it
  before the piece appeared (the page body if that element is gone).
- A piece you assemble yourself is dismissible exactly when you pass `actions.dismiss`, on web and
  native alike.

## Reacting to a dismissal

```tsx
<OfflineDetector onDismiss={(piece) => analytics.track('dismissed', { piece })}>
  <App />
</OfflineDetector>
```

`piece` is `'snackbar'`, `'banner'` or `'indicator'`.

## In your own components

`resolveDismissible` and `useDismissals` are exported from the React package
(`@rogeriodocarmo/offline-detector-react`, which the web and native packages depend on but do not
re-export these two from):

```ts
resolveDismissible('banner', { dismissible: false, banner: { dismissible: true } }); // true

const { isDismissed, dismiss } = useDismissals({ onDismiss: (piece) => log(piece) });
dismiss('snackbar'); // no-op when that piece is not dismissible
```

`resolveDismissible(piece, options)` is pure: a per-piece value wins over the global one and the
default is `true`. See the [react reference](./reference/react.md).
