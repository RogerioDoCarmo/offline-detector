---
id: slots
title: Slots and render props
sidebar_position: 7
---

# Slots and render props

A **slot** replaces one piece (snackbar, banner, indicator or full-screen) with your own component.
Everything else keeps working: detection, dismissal state, announcements and tokens.

```tsx
<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>
```

The keys of `slots` are `snackbar`, `banner`, `indicator` and `fullScreen`.

## What a slot receives

A slot gets the `PieceRenderProps` contract from the React package:

| Prop        | What it is                                                                       |
| ----------- | -------------------------------------------------------------------------------- |
| `state`     | The current `OfflineState`.                                                      |
| `phase`     | `'offline'`, `'checking'` or `'recovered'`.                                      |
| `message`   | The already localised, reason-aware message.                                     |
| `strings`   | The resolved `OfflineStrings` for the locale, with your overrides.               |
| `actions`   | `retry`; `dismiss` when dismissal is allowed; `continueOffline` for full-screen. |
| `visible`   | False while the exit animation plays.                                            |
| `theme`     | The `OfflineTheme` on native, `undefined` on the web.                            |
| `rootProps` | Role, live region and direction props to spread on your root element.            |

## Web example

```tsx
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

function Toast({ message, phase, actions, rootProps }: PieceRenderProps) {
  return (
    <div {...rootProps} className="my-toast">
      {message}
      {phase !== 'recovered' && <button onClick={actions.retry}>Try again</button>}
      {actions.dismiss && <button onClick={actions.dismiss}>Close</button>}
    </div>
  );
}

<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>;
```

The `--od-*` tokens are still rendered, so `var(--od-color-surface-inverse)` and friends work in
your own CSS. See [Theming](./theming.md).

## Native example

```tsx
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import type { OfflineTheme } from '@rogeriodocarmo/offline-detector-native';

function MyToast({ message, actions, rootProps }: PieceRenderProps<OfflineTheme>) {
  return (
    <Pressable {...rootProps} onPress={actions.retry}>
      <Text>{message}</Text>
    </Pressable>
  );
}

<OfflineDetector netInfo={NetInfo} slots={{ snackbar: MyToast }}>
  <App />
</OfflineDetector>;
```

## Keep it accessible

- Spread `rootProps` on your root. It carries the role and live-region settings that make the
  transition announced exactly once. There is no fallback: a slot that omits `rootProps` is not
  caught by anything else, so a screen reader hears nothing for it. iOS has no live region at all,
  so a native slot must also call `AccessibilityInfo.announceForAccessibility(message)` itself when
  it appears or its message changes.
- Put `aria-label` only on an element with a naming role (`role="status"`, `role="region"`,
  `role="img"`), never on a bare `div` or `span`.
- Keep targets at least 44 by 44 and offer a way to dismiss that is not a swipe.
- Respect reduced motion. See [Accessibility](./accessibility.md).

## Reusing the bundled pieces

`Snackbar`, `Banner`, `Indicator` and `FullScreen` are exported from the web and native packages.
A slot can forward its props to one of them to change only a little (for example the icons). See
the [web](./reference/web.md) and [native](./reference/native.md) references.
