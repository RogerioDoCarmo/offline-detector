# Components

Anatomy, states and rules for the four pieces. Token names come from `tokens.md`; copy from
`strings.md`; accessibility details from `accessibility.md`. Web and native share the same anatomy
and tokens; only the primitives differ (DOM elements versus `View`/`Text`/`Pressable`).

Defaults: snackbar, banner and indicator are **on**; full-screen is **off** (opt-in via the
`fullScreen` prop).

## Which piece shows when

| Provider state                   | Snackbar              | Banner | Indicator                              | Full-screen          |
| -------------------------------- | --------------------- | ------ | -------------------------------------- | -------------------- |
| `unknown` (before first check)   | hidden                | hidden | hidden                                 | hidden               |
| `online`, never was offline      | hidden                | hidden | hidden (see note)                      | hidden               |
| transition to `offline`          | "No internet" + Retry | shown  | offline                                | shown if opted in    |
| `offline`, `checking` (brief)    | Retry shows checking  | shown  | checking                               | Retry shows checking |
| transition `offline` to `online` | "Back online", 4 s    | hidden | online, then hidden after the snackbar | hidden               |
| `online` again, steady           | hidden                | hidden | hidden                                 | hidden               |

Note: the indicator is shown only while offline or checking, plus its brief online flash; a
permanent "online" dot is noise. `indicator="always"` keeps it visible in all states for hosts
that want a status light.

The snackbar fires only on a real transition (spec section 4), never at mount.

## 1. Snackbar

A transient, bottom-anchored message surface. Offline message persists until recovery; the recovery
message lasts about 4 seconds.

### Anatomy

```text
+--------------------------------------------------------------+
| [icon]  No internet                           [ Retry ]  [x] |
+--------------------------------------------------------------+
   1        2                                      3        4
```

1. **Icon** (20 px, `text-inverse`): wifi-off glyph while offline, check glyph on recovery.
   Decorative (`aria-hidden`); the text carries the meaning.
2. **Message**: `body`, `text-inverse`. It wraps to as many lines as needed and is never
   truncated (translations and large text are longer).
3. **Action**: "Retry", a text button, `label` semibold, `action-inverse`, minimum 44x44 hit area.
   Hidden on the recovery message.
4. **Dismiss**: icon button, 44x44, `text-muted-inverse`, shown while the piece is dismissible (the
   default, see [Dismissal](#dismissal-swipe-keyboard-and-assistive-technology)). Swiping the
   snackbar left or right dismisses it too.

Surface: `surface-inverse`, `radius-md`, `shadow-snackbar`, padding `space-md` vertical,
`space-lg` inline, minimum height 48. Max width 560, centred; on viewports narrower than
`560 + 2 x space-lg` it spans the width minus the gutter.

### Placement

Bottom, centred. Bottom offset = `space-lg` + safe-area inset + `--od-offset-bottom`. The web
safe area is `env(safe-area-inset-bottom)`; native uses the bottom inset from
`react-native-safe-area-context` when available. Left/right insets are respected in landscape.
Never covers the system home indicator or gesture bar.

### States

| State             | Visual                                                          |
| ----------------- | --------------------------------------------------------------- |
| offline (default) | wifi-off icon, "No internet", Retry                             |
| checking (brief)  | Retry becomes a spinner plus "Checking…", disabled, `aria-busy` |
| recovery          | check icon, "Back online", no action, auto-hides after 4000 ms  |
| entering          | translate-up `space-lg` + fade, `duration-base`, `ease-out`     |
| exiting           | fade (and translate-down), `duration-exit`, `ease-in`           |
| action pressed    | 12% `text-inverse` overlay on the action                        |
| action focused    | 2 px `action-inverse` ring, 2 px offset                         |

The 4 s recovery timer pauses while the snackbar is hovered, focused or being touched (web) and
restarts on leave. Under larger text it does not shorten. It never needs user action, so it is not
a WCAG timing failure (it carries no information that is not also shown by the cleared banner and
indicator).

Only one snackbar is visible at a time. A recovery message replaces the offline message in place
(crossfade `duration-fast`, no slide). A second offline transition during the recovery window
replaces the recovery message immediately.

## 2. Banner

A persistent strip at the top while offline. The default text is "No internet"; the opt-in
"Connected, but no internet" appears with `distinguishReason`.

### Anatomy

```text
+--------------------------------------------------------------+
| [icon]  No internet                                          |
+--------------------------------------------------------------+
```

- Full width, in the document flow (web: `position: sticky; top: 0`; native: rendered above the
  app content, not overlaid), so it pushes content rather than hiding it. Setting
  `banner={{ position: 'overlay' }}` opts into floating over content.
- Surface `status-offline-subtle`, text `text` (`body`, medium weight), icon `status-offline`
  (wifi-off). A 1 px `border-subtle` bottom edge. Square corners. No shadow.
- Padding: `space-sm` vertical + safe-area top inset, `space-lg` inline. Minimum height 40 plus
  inset. It has no action by default (the snackbar owns Retry); `banner={{ action: true }}` adds a
  Retry text button (44x44 hit area) for hosts that disable the snackbar.
- Optional secondary line (`label`, `text-muted`) used only for the distinguished reason, for
  example `Connected, but no internet` as the message with no second line. No second line by
  default.

### States

| State    | Visual                                                                             |
| -------- | ---------------------------------------------------------------------------------- |
| offline  | as above                                                                           |
| checking | icon swaps to spinner (or a static "…" glyph under reduced motion); text unchanged |
| entering | height 0 to natural + fade, `duration-base`, `ease-out`                            |
| exiting  | reverse, `duration-exit`, `ease-in`                                                |

Under reduced motion the banner appears and disappears with a `duration-fast` fade and no height
animation.

## 3. Indicator

A small, always-labelled status marker for hosts that want a persistent glanceable light.

### Anatomy

Two forms, chosen by `indicator={{ variant: 'dot' | 'chip' }}`; default **chip**.

```text
dot:   (o)                     chip:  ( o  Offline )
```

- **Dot**: 14 px circle in the status colour with a 1 px `surface` ring so it separates from
  content, and a glyph inside it drawn in `surface` colour (offline: a slash, checking: a ring,
  online: a tick). Hit area 44x44 (it is focusable and shows the label as a tooltip on hover/focus
  on web; on native a press shows a short-lived label). Colour alone never carries the state: the
  glyph differs per state, so it survives greyscale and colour-blindness.
- **Chip**: `surface-raised`, 1 px `border`, `radius-full`, `shadow-chip`, padding `space-xs`
  vertical and `space-md` inline, dot on the inline-start, then the label in `label` semibold,
  `text`. Minimum height 28 visible, 44 hit area if it is interactive. By default the chip is not
  interactive (it only displays), so it is not a touch target.

In the chip, the same dot sits on the inline-start of the label, and the label text is the second,
independent signal.

### Position

`indicator={{ position: 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start' }}`; default
`top-end`. `start`/`end` follow the writing direction (see RTL). Offset: `space-lg` from the
edges plus safe-area inset plus `--od-offset-top` / `--od-offset-bottom`. When the banner is
visible and the indicator is at `top-*`, the indicator sits below the banner's current height
(web: the banner publishes its measured height on `--od-banner-height`; native: shared context).

### Labels

The label text is always present: visible in the chip; for the dot it is the accessible name
(`role="img"` plus `aria-label` on web, `accessibilityLabel` on native) and the tooltip. Strings:
`indicator.online`, `indicator.offline`, `indicator.checking` from `strings.md`.

### States

| State    | Visual                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| offline  | red slashed dot, "No internet" label                                                  |
| checking | amber pulsing ring (static ring under reduced motion), "Checking connection"          |
| online   | green ticked dot, "Online"; shown for the recovery window, then fades `duration-base` |

## 4. Full-screen state (opt-in)

A page-level replacement for hosts whose screens are useless offline. Enabled with
`fullScreen` (boolean) or `fullScreen={{ continueOffline: true }}` for the optional second
action.

### Anatomy

```text
+------------------------------------------+
|                                          |
|              [ large icon ]              |
|                                          |
|             No internet                  |
|   Check your connection and try again.   |
|                                          |
|            [   Try again   ]             |
|           Continue offline               |
|                                          |
+------------------------------------------+
```

- Opaque `surface`, fills the viewport (web: `position: fixed; inset: 0`, `100dvh`; native: a
  full-window overlay, not a `Modal`, so the host's navigation is preserved underneath). Content
  is centred, column, max measure `size-fullscreen-measure`, `space-xl` gaps, safe-area padding
  on all sides.
- Icon: 48 px wifi-off in `status-offline`, decorative.
- Title: `headline` semibold, `text`, an `<h1>` on web (`accessibilityRole="header"` native).
- Body: `title` regular, `text-muted`. The distinguished reason changes the title, not the body.
- Primary action: solid button, `action` background, `on-action` label, `label`-size semibold at
  `font-size-title`, `radius-md`, minimum 44 high, full width up to the measure. Label "Try again"
  (`retry` string).
- Secondary action (only with `continueOffline`): text button, `action`, 44 high, label
  "Continue offline". Pressing it dismisses the full-screen state for the current offline
  episode and fires `onContinueOffline`. The state returns on the next offline transition.

### States

| State        | Visual                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- |
| offline      | as above                                                                                 |
| checking     | primary button shows spinner + "Checking…", disabled, `aria-busy`; layout does not shift |
| failed retry | title and body stay; a brief `aria-live` line is not added (state is unchanged)          |
| entering     | fade `duration-slow`, `ease-out`; no translate                                           |
| exiting      | fade `duration-exit`                                                                     |

When connectivity returns, the full-screen state exits and the recovery snackbar ("Back online")
shows. While the full-screen state is visible the banner, indicator and offline snackbar are
suppressed (it already says the same thing). Focus handling is in `accessibility.md`.

## Dismissal (swipe, keyboard and assistive technology)

Owner decision (8 Oct 2026): every non-full-screen piece (snackbar, banner, indicator) is
**dismissible by default**, by swiping it to the left or to the right. A single `dismissible` flag
turns this off; `dismissible={false}` makes the pieces permanent. The full-screen state is never
swipe-dismissible: it has its own "Continue offline" action.

| Aspect               | Rule                                                                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flag                 | `dismissible` (default `true`) on the provider or UI wrapper. Per-piece override: `snackbar={{ dismissible }}`, `banner={{ dismissible }}`, `indicator={{ dismissible }}`. A per-piece value wins over the global one.                                                                                     |
| Gesture              | A horizontal drag in either direction. The piece follows the finger or pointer. Release at or past **30% of its width**, or at a speed of **0.5 px/ms or more** in the drag direction, dismisses (both limits are inclusive, on web and native); anything less springs back (`duration-base`, `ease-out`). |
| Axis lock            | After 8 px of movement the drag locks to its dominant axis. Vertical drags are ignored, so page and list scrolling keep working. Web: `touch-action: pan-y` on the piece.                                                                                                                                  |
| Exit motion          | The piece slides out in the swipe direction while fading, over `duration-exit`. Under reduced motion there is no slide: it fades out instantly.                                                                                                                                                            |
| Direction            | Direction-agnostic and RTL-neutral: both directions behave identically, so nothing is mirrored.                                                                                                                                                                                                            |
| Meaning of dismissed | Only the piece is hidden. The connection state is unchanged, `useNetworkStatus()` and callbacks are unaffected, and the other pieces keep showing.                                                                                                                                                         |
| Comes back when      | The **next status transition** (offline, then online, then offline again shows the pieces again). A dismissed offline piece does not reappear while the same offline period continues, and the recovery snackbar still shows on recovery.                                                                  |
| Persistence          | None. Dismissal is in memory only; a reload resets it. Nothing is stored.                                                                                                                                                                                                                                  |
| Layout               | Dismissing the banner reflows content: `--od-banner-height` returns to 0 over `duration-base` (instant under reduced motion).                                                                                                                                                                              |
| Callback             | Optional `onDismiss(piece)` with `'snackbar' \| 'banner' \| 'indicator'` for hosts that want to react.                                                                                                                                                                                                     |
| Implementation       | Web: pointer events (mouse, touch, pen) with pointer capture. Native: `PanResponder` plus the built-in `Animated` API with the native driver. No Reanimated and no gesture-handler dependency.                                                                                                             |

### Alternatives to the swipe (required)

A swipe is a path-based gesture, so every dismissible piece also needs a way to dismiss that does
not depend on it (WCAG 2.2 criterion 2.5.1, Pointer Gestures, and 2.1.1, Keyboard).

| Piece     | Single-pointer alternative                                                     | Keyboard                                                     | Screen reader                                                                                                               |
| --------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Snackbar  | The visible dismiss button (44x44)                                             | The button is in the tab order; Escape while focus is inside | Button named by the `dismiss` string                                                                                        |
| Banner    | A dismiss icon button (44x44) at the inline end                                | Same                                                         | Button named by the `dismiss` string                                                                                        |
| Indicator | None visible (it is a tiny status mark). It becomes focusable when dismissible | Escape or Delete while focused                               | Native `accessibilityActions` entry `dismiss` (TalkBack and VoiceOver custom action), described by the `dismissHint` string |

When a dismissed piece held focus, focus returns to the element that had it before the piece
appeared, if that element is still in the document, otherwise to the document body. Dismissal by
the user is never announced (the user caused it).

## Checking feedback ('brief' vs 'none')

`useRecheckOnReturn({ checkingFeedback })` controls whether a **background** re-probe is visible.
It defaults to `'none'`.

| Source of the check                                       | `'none'`                                   | `'brief'`                                                                                        |
| --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Re-probe on return to the app (visibility/focus/AppState) | nothing visible                            | indicator shows checking state; if offline, the snackbar/banner/full-screen Retry shows checking |
| User presses Retry                                        | the pressed button shows checking (always) | same                                                                                             |
| Scheduled back-off probe while offline                    | nothing visible                            | nothing visible (only return-triggered checks)                                                   |
| While online with no problem                              | nothing visible                            | nothing visible; a successful brief check shows nothing at all                                   |

Rules for `'brief'`:

- The checking state is shown only if the check is still pending after 150 ms (avoids flashes on
  fast networks) and, once shown, stays for at least 400 ms (avoids flicker).
- It never moves layout: spinners replace the label in the same box.
- It is announced politely only through the button's `aria-busy`/label change, not as a new live
  message. When a brief check ends with the state unchanged (still offline), nothing is announced;
  the result is the absence of change plus the button returning to "Retry".
- A user-initiated Retry always shows checking regardless of `checkingFeedback`: a press without a
  response feels broken.

## Stacking rules

Several pieces can be visible at once. Zones and order:

| Zone   | Pieces (z-order low to high)                                        |
| ------ | ------------------------------------------------------------------- |
| top    | banner (z 1000), indicator when `top-*` (z 1010, sits below banner) |
| bottom | indicator when `bottom-*` (z 1010), snackbar (z 1020)               |
| screen | full-screen (z 1100), above everything                              |

1. The banner is in the flow at the very top and pushes content; it never overlaps the indicator.
2. The indicator at `top-*` shifts down by the banner height; at `bottom-*` it shifts **up** by the
   snackbar height plus `space-sm` while the snackbar is visible, so the two never overlap.
3. One snackbar at a time. It is the lowest piece in the bottom zone.
4. Full-screen suppresses banner, indicator and the offline snackbar. The recovery snackbar still
   shows after it closes.
5. With all three default pieces visible on a phone (banner, `top-end` chip, bottom snackbar) the
   chip duplicates the banner's message. To keep it calm: when the banner is shown, the chip
   collapses to its dot form automatically (`indicator.autoCollapse`, default true).
6. Safe areas are applied per piece, once: the banner owns the top inset, the snackbar the
   bottom inset; the indicator adds the inset only where no other piece already has.

## RTL

- Use logical properties on web (`padding-inline`, `inset-inline-end`, `margin-inline-start`,
  `text-align: start`) and `start`/`end` styles on native (`marginStart`, `paddingEnd`,
  `start: 0`). Never `left`/`right`.
- Snackbar: icon on the start, action(s) on the end. In RTL the order mirrors; nothing else
  changes. The slide animation is vertical, so it does not mirror.
- Indicator positions `*-start` and `*-end` mirror with direction. Chip: dot on the start side.
- Icons: wifi-off, check, spinner and the dot are direction-neutral and do not mirror. If a host
  or translation adds an arrow, it must mirror.
- Text direction comes from the host (`dir` on web, `I18nManager.isRTL` on native), not from the
  bundled locale list, so Arabic or Hebrew host apps with overridden strings work as is.
- Numbers or Latin text inside translations are isolated with `<bdi>` (web) / Unicode isolation
  marks (native) when interpolated.

## Slots and render props

Every piece can be replaced while still receiving the tokens, the state and the behaviour. Three
levels, from lightest to heaviest:

1. **Tokens**: re-theme without touching structure (`tokens.md`).
2. **Slot props** (partial customisation): `slotProps={{ snackbar: { className, style, testID } }}`
   and `strings`, `icons={{ offline, online, checking }}` replace icons and copy.
3. **Slots** (full replacement): `slots={{ Snackbar, Banner, Indicator, FullScreen }}`. Each is a
   component that receives a **render-props contract**:

```ts
type PieceRenderProps = {
  state: OfflineState; // status, reason, checking, lastChecked, lastOnlineAt
  phase: 'offline' | 'checking' | 'recovered'; // what the piece should show now
  message: string; // already localised, already reason-aware
  actions: {
    retry: () => Promise<OfflineState>; // wraps checkNow, drives the checking phase
    continueOffline?: () => void; // only when the full-screen opted in
    dismiss?: () => void; // present unless dismissible is false for this piece
  };
  strings: ResolvedStrings; // every string, for custom layouts
  theme: OfflineTheme; // native; on web tokens are inherited CSS variables
  visible: boolean; // false during the exit animation window
  rootProps: Record<string, unknown>; // role, aria-live, testID, dir: spread on your root
};
```

Contract:

- `rootProps` carries the live-region role and politeness for that piece, so replacement does not
  lose announcements. If the slot omits it, the provider's hidden announcer (see
  `accessibility.md`) still announces, so a naive slot is never silent.
- Layering, stacking, safe-area offsets and suppression rules are applied by the provider
  **around** the slot; the slot renders only its own content. A slot that wants full control
  (portal, own positioning) sets `slots.Snackbar.unstyled = true`.
- Tokens apply because the provider root carries `data-od-root` (web) and the theme context
  (native). Slot authors read `var(--od-color-surface-inverse)` or `theme.colorSurfaceInverse`.
- Timing (4 s recovery, minimum checking display) stays with the provider and is exposed through
  `visible`/`phase`; the slot does not manage timers.

`renderSnackbar`, `renderBanner`, `renderIndicator`, `renderFullScreen` function props are the
inline form of the same contract (`renderSnackbar={(p) => <MyToast {...p} />}`); passing `null`
or `false` turns the piece off.
