---
id: accessibility
title: Accessibility
sidebar_position: 8
---

# Accessibility

The target is WCAG 2.2 AA for every state of every piece, in light and dark, on web and native.
Hue is never the only signal: every state is carried by words plus a shape, and colour is a third,
supporting signal.

## Announcements: once, and politely

The failure to avoid is double speech: a banner and a snackbar appearing together and a screen
reader reading "No internet" twice. So **each transition is announced once**. The first visible
piece in this order owns the announcement and the others render silent: snackbar, banner,
indicator. If none of them is enabled, nothing is announced. There is no hidden fallback announcer.
A custom slot takes over its piece's announcement, so it must spread `rootProps` (and on iOS call
`AccessibilityInfo.announceForAccessibility` itself); see [Slots](./slots.md).

| Piece               | Web                                              | Native                                                                |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Snackbar and banner | `role="status"` (a polite live region)           | `accessibilityLiveRegion="polite"` on Android; an announcement on iOS |
| Indicator           | `role="img"` with an accessible name, never live | `accessibilityRole="image"` with a label                              |
| Full-screen         | Focus moves to the heading; no live region       | Accessibility focus moves to the title                                |

- Messages are **polite**, never `role="alert"`: going offline is information, not an emergency,
  and must not interrupt a sentence being read or a form being typed.
- The text announced is the same localised message the piece shows ("No internet", "Back online").
- Recovery is announced once. The snackbar disappearing after four seconds is not announced.
- On the web the live region is mounted empty and receives its text one frame later, because screen
  readers skip a region that appears together with its text. Dismissing a piece is never announced,
  and neither is the snackbar that appears after "Continue offline".
- "Checking…" is not announced as its own message. The Retry control reflects it with
  `aria-busy`, and its name changes.
- Callbacks fire only on transitions, so announcements do too. A re-check that finds the state
  unchanged announces nothing.

## Reduced motion

Motion is short, vertical only and drops to a fade under reduced motion. The `motion` prop is
`'auto'` (follow `prefers-reduced-motion` or the OS setting), `'reduced'` or `'full'`. Under reduced
motion a swiped piece fades out instead of sliding, and the checking spinner stays.

## Swipe alternatives

A swipe is a path-based gesture (WCAG 2.5.1), so a dismissible piece always has another way:

- Snackbar and banner: a visible Dismiss button at least 44 by 44, in the tab order, and Escape
  while focus is inside the piece.
- Indicator: focusable when dismissible; Escape or Delete dismisses it, and on native it exposes a
  `dismiss` accessibility action described by the `dismissHint` string.

On the web, dismissing a piece that had keyboard focus puts focus back on the element that had it
before the piece appeared.

Turn the swipe off with `dismissible={false}`. See [Dismissal](./dismissal.md).

## The full-screen state

Full-screen is opt-in and replaces the app's view, so it is deliberately **not** a `dialog`.

- Focus moves to the heading, and the host content underneath is made inert (`inert` plus
  `aria-hidden` as a fallback on web; hidden from assistive technology on native).
- Escape triggers "Continue offline" when that action exists. Without `continueOffline` there is no
  escape, so use it unless the app truly cannot work offline.
- On exit, focus returns to the element that had it before, when it is still there.
- On native, `<OfflineDetector>` hides the host content for you, and its `onRestoreFocus` prop fires
  when the full-screen state leaves, so you can put screen reader focus back.

## Contrast, targets, text size and direction

- All text meets 4.5 to 1 and interface components meet 3 to 1, in both colour schemes. Status
  colours mark a glyph or dot; they never colour a sentence.
- Every interactive element is at least 44 by 44.
- Layouts wrap for large text and for the longer Portuguese and Spanish strings, and use logical
  start and end properties, so right-to-left hosts work.

## Names

`aria-label` and `aria-labelledby` are only placed on elements with a naming-capable role: the
banner is `role="region"` or `role="status"`, the indicator is `role="img"` or contains visible
text. If you write a [slot](./slots.md), do the same.

## What has not been verified here

Automated checks and unit tests cover the structure. Spoken output has to be confirmed with
VoiceOver, TalkBack, NVDA and JAWS. The contract that matters is "spoken exactly once, politely,
within about a second".
