# Accessibility

Target: WCAG 2.2 AA for every state of every piece, in light and dark, on web and native. Contrast
numbers are in `tokens.md`; anatomy in `components.md`.

## 1. Announcements: one announcer, per-piece politeness

The failure to avoid is double speech: a banner and a snackbar both appearing on the same
transition and a screen reader reading "No internet" twice. Rule: **each transition is announced
once.** The announcement is owned by the first visible piece in this priority order, and the others
render silent (no live region role):

1. snackbar, 2. banner, 3. indicator, 4. a visually hidden provider announcer (when no visible piece
   is enabled, or when a slot omits `rootProps`).

The full-screen state does not use a live region: it announces by moving focus (section 2).

| Piece                             | Web                                                                    | Native                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Snackbar, offline                 | `role="status"` (implicit `aria-live="polite"`, `aria-atomic="true"`)  | `accessibilityLiveRegion="polite"` (Android); iOS: `AccessibilityInfo.announceForAccessibility(message)` |
| Snackbar, recovery                | `role="status"`, polite                                                | same as above                                                                                            |
| Banner (when it is the announcer) | `role="status"`, polite                                                | `accessibilityLiveRegion="polite"` / announce on iOS                                                     |
| Banner (snackbar active)          | `role="region"` + `aria-label` ("No internet"), no live                | plain accessible `View` with the message as its label, no live region                                    |
| Indicator                         | `role="img"` + `aria-label` (never live; state read on focus)          | `accessible`, `accessibilityRole="image"`, `accessibilityLabel`                                          |
| Full-screen                       | `role="dialog"` is **not** used (see below); focus moves to the `<h1>` | `AccessibilityInfo.setAccessibilityFocus` on the title                                                   |
| Hidden provider announcer         | visually hidden `<div role="status" aria-live="polite">`               | `announceForAccessibility` (iOS and Android 11 and below)                                                |

Why polite and not assertive: going offline is information the user needs promptly, but it is not
an emergency and must not interrupt a sentence being read or a form being typed. The UI never
uses `role="alert"`.

Details:

- **Live regions must exist before their content changes.** Several screen readers skip a live
  region that is mounted together with its text. So on web the hidden announcer is mounted once
  after hydration and its text is swapped on each transition; it speaks for whichever piece is the
  owner, and the visible piece renders with `aria-live="off"`. If an implementation instead makes
  the visible snackbar the live region, it must mount the empty container first and set the text
  one frame later. Either way, test with VoiceOver, TalkBack, NVDA and JAWS; the contract that
  matters is "spoken exactly once, politely, within about a second".
- **Text sent to the announcer is the same localised message the piece shows**, plus nothing else
  ("No internet", "Back online"). Do not announce "Retry available" or timestamps.
- **Recovery** announces "Back online" once. The disappearance of the snackbar after 4 s is not
  announced.
- **Checking** is not announced as its own message. The Retry control reflects it:
  `aria-busy="true"`, `aria-disabled="true"` (not `disabled`, so focus is kept), and its name
  changes to "Checking…" (a name change on a focused control is read by screen readers).
- **Native iOS** has no `accessibilityLiveRegion`. Use `AccessibilityInfo.announceForAccessibility`
  from an effect on real transitions. On Android prefer `accessibilityLiveRegion="polite"` and do
  not also call `announceForAccessibility` for the same text (double speech).
- **Callbacks** fire only on transitions, so announcements do too. A foreground re-probe that finds
  the state unchanged announces nothing.
- **Names**: `aria-label` and `aria-labelledby` are only placed on elements with a naming-capable
  role. The banner container is `role="region"` (or `role="status"`), the indicator is
  `role="img"` (dot) or contains visible text (chip), the snackbar is `role="status"`. A bare
  `<div>` or `<span>` never carries a label; use a role, or put the text in the content.

## 2. Focus management (full-screen state)

The full-screen state is a replacement for the app's current view, not a modal dialog the user
opened, so it deliberately does **not** claim `role="dialog"`/`aria-modal`. It does take focus,
because the content it covers must be unreachable.

Web:

1. On appearance, record `document.activeElement`, then move focus to the title (`<h1
tabindex="-1">`), so a screen reader reads "No internet", then the body, then the actions in
   reading order.
2. While visible, the host content underneath is made inert: `inert` on the host root siblings
   (progressive: also `aria-hidden="true"` as a fallback where `inert` is unsupported). Tab order
   cycles within the full-screen state: Try again, then Continue offline. No focus trap that
   blocks the browser chrome (Shift+Tab off the first control reaches the browser UI, which is
   the standard behaviour for a non-modal page).
3. `Escape` triggers "Continue offline" if that action exists; otherwise it does nothing.
4. On exit, focus returns to the recorded element when it is still in the document and visible,
   otherwise to the document body (`tabindex="-1"` on the root of the app). Never lose focus to
   `<body>` silently when a better target exists.
5. After Retry is pressed, focus stays on the button (it becomes `aria-disabled`, not removed).
   After a failed retry, focus stays there; nothing is announced (state unchanged).

Native:

1. On appearance, call `AccessibilityInfo.setAccessibilityFocus(findNodeHandle(titleRef))` after
   the entrance settles (next frame), and use `accessibilityViewIsModal` on iOS and
   `importantForAccessibility="no-hide-descendants"` on the host content on Android while visible.
2. The Android back button / iOS back gesture: with `continueOffline` it acts as "Continue
   offline"; without it, the system behaviour is left to the host.
3. On exit, restore the previous focus target if the host exposes one (`onRestoreFocus`
   callback); otherwise leave focus to the host.

For the other pieces focus is never moved automatically: the snackbar, banner and indicator must
not steal focus. Retry in the snackbar is reachable in normal order (the snackbar is the last
element in the DOM order, after the app content, on web; on native it is last in the overlay
container).

## 3. Reduced motion

Principle: reduced motion removes movement, not clarity. State changes stay immediate and
visible.

Web:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --od-duration-base: 0ms;
    --od-duration-slow: 0ms;
    --od-duration-pulse: 0ms;
  }
  .od-snackbar,
  .od-banner,
  .od-fullscreen {
    transform: none;
  }
  .od-spinner,
  .od-pulse {
    animation: none;
  }
}
```

Native: the provider reads `AccessibilityInfo.isReduceMotionEnabled()` once at mount and subscribes
to `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)`. The flag is exposed through
`useOfflineTheme()` as `reduceMotion`.

Behaviour under reduced motion, both platforms:

| Motion                             | Normal               | Reduced                                     |
| ---------------------------------- | -------------------- | ------------------------------------------- |
| Snackbar enter / exit              | translate + fade     | fade only, `duration-fast`                  |
| Banner enter / exit                | height + fade        | fade only, `duration-fast`, no height tween |
| Full-screen enter / exit           | fade `duration-slow` | fade `duration-fast`                        |
| Checking dot                       | pulsing ring         | static ring                                 |
| Checking spinner (buttons, banner) | rotating             | no rotation; "Checking…" text only          |
| Recovery crossfade                 | `duration-fast`      | instant swap                                |

Fades up to 120 ms are allowed under reduced motion because they carry no spatial movement. If a
host wants zero animation, `motion="none"` on the provider sets every duration to 0.

The 4 s recovery timeout is unaffected by reduced motion.

## 4. Colour is never the only signal

Every state has at least two independent signals besides hue:

| State    | Text / name                         | Shape / glyph                    | Colour (supporting only) |
| -------- | ----------------------------------- | -------------------------------- | ------------------------ |
| offline  | "No internet" (visible or name)     | wifi-off icon; slashed dot glyph | red                      |
| checking | "Checking…" / "Checking connection" | ring (dot); spinner (button)     | amber                    |
| online   | "Back online" / "Online"            | check icon; ticked dot glyph     | green                    |

Rules:

- The dot-only indicator always has a glyph inside and an accessible name; hue alone is not enough
  (red and green are indistinguishable to many users).
- Status colours are never used for text. Text is `text`, `text-muted` or the inverse pair.
- Buttons are identified by shape and label, not by colour: Retry is a filled button or a text
  button with a visible focus ring.
- Contrast for status graphics is 3:1 against the actual background they sit on (listed in
  `tokens.md`), including the 1 px `surface` ring around the dot.
- Windows High Contrast / `forced-colors: active`: backgrounds collapse, so the pieces keep
  `border: 1px solid CanvasText` (snackbar, chip, buttons) and the dot glyph uses `CanvasText`
  and `Canvas`; icons use `currentColor`. Native honours the OS contrast setting through the
  system colours the host provides; the tokens remain the baseline.

## 5. Targets, text and other requirements

- Interactive elements are at least 44x44 (`--od-size-touch-target`), with at least 8 px between
  neighbouring targets (Retry and dismiss in the snackbar are `space-sm` apart).
- Text scales: web `rem`-based sizes from user preference (tokens are px for clarity but ship as
  `rem`/`em` with a 16 px root), layouts wrap instead of truncating; native allows font scaling up
  to `maxFontSizeMultiplier` 2 in compact pieces and unbounded in the full-screen state.
- Zoom to 400 % and 320 px width: the snackbar and banner wrap, the full-screen content scrolls.
- Visible focus: 2 px `focus-ring` (or `action-inverse` in the snackbar) with 2 px offset, never
  removed. Focus is never hidden by the sticky banner (`scroll-padding-top` is set from
  `--od-banner-height`).
- The snackbar's 4 s recovery message pauses on hover, focus and touch, and carries nothing
  critical that is not also shown by the cleared banner and indicator.
- Language: the provider sets `lang` on its own elements when its locale differs from the
  document's (`lang="pt-BR"`), so a screen reader pronounces the string correctly.
- Everything works with a keyboard alone (web) and with TalkBack/VoiceOver swipe navigation
  (native). Automated check: `@axe-core/playwright` on every offline UI state, light and dark.
