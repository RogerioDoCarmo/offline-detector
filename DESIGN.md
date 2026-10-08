---
name: offline-detector
description: A neutral, system-like offline UI that disappears into any host app and re-themes through tokens.
colors:
  surface: '#ffffff'
  surface-raised: '#f4f5f7'
  surface-inverse: '#1f2328'
  text: '#1b1f23'
  text-muted: '#545b64'
  text-inverse: '#ffffff'
  border: '#80878f'
  status-offline: '#b3261e'
  status-offline-subtle: '#fdecea'
  status-online: '#1a7f37'
  status-checking: '#8a5a00'
  action: '#0b5fd1'
  action-inverse: '#8ab4ff'
typography:
  headline:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: '22px'
    fontWeight: 600
    lineHeight: '28px'
  lead:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: '24px'
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: '20px'
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: '12px'
    fontWeight: 600
    lineHeight: '16px'
    letterSpacing: '0.02em'
rounded:
  sm: '4px'
  md: '8px'
  lg: '12px'
  full: '999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '16px'
  xl: '24px'
  2xl: '32px'
components:
  snackbar:
    backgroundColor: '{colors.surface-inverse}'
    textColor: '{colors.text-inverse}'
    rounded: '{rounded.md}'
    padding: '12px 16px'
    height: '48px'
  banner:
    backgroundColor: '{colors.status-offline-subtle}'
    textColor: '{colors.text}'
    padding: '8px 16px'
  indicator-chip:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.text}'
    rounded: '{rounded.full}'
    padding: '4px 12px'
  button-primary:
    backgroundColor: '{colors.action}'
    textColor: '{colors.surface}'
    rounded: '{rounded.md}'
    height: '44px'
---

<!-- markdownlint-disable MD036 MD026 -->

# Design System: offline-detector

Authoritative values live in `docs/design/tokens.md`; this file explains the intent behind them.
Companion docs: `docs/design/components.md`, `accessibility.md`, `strings.md`, and the visual
check in `docs/design/prototype.html`.

## Overview

**Creative North Star: "The Polite Notice"**

The package UI appears at an awkward moment, inside someone else's app, to a person who is in the
middle of something. It should behave like a considerate colleague who quietly says "heads up,
we've lost the connection" and says "we're back" when it returns: clear, short, never dramatic,
never in the way. It is system-like on purpose. A developer should install it and find it already
looks like their app.

Density is low and the type is the platform's own. Colour is almost absent: grey surfaces, one
blue for actions, and three small status hues (red, green, amber) used only for glyphs and dots,
never for text. Depth is minimal: the banner is flat; the snackbar and chip float with a soft,
short shadow because they sit over content.

Rejected on purpose: alarm red banners with white text, pulsing full-width bars, bouncing toasts,
custom fonts, gradients, glassmorphism, illustrations of unplugged cables, and humour in the copy.

**Key Characteristics:**

- Neutral by default, re-themed entirely through `--od-*` tokens (web) or a theme object (native).
- System font on every platform; no font downloads.
- Status = text plus glyph plus colour, never colour alone.
- Motion is short, exponential ease-out, vertical only, and drops to a fade under reduced motion.
- Every piece is replaceable through slots without losing tokens or accessibility.

## Colors

A neutral palette with four functional hues. Values below are light; dark values and every
contrast ratio are in `docs/design/tokens.md`.

### Neutral

- **Paper** (`#ffffff` / dark `#1c1c1e`): the surface of the full-screen state and the base for
  everything that is not floating.
- **Cloud** (`#f4f5f7` / dark `#2c2c2e`): the indicator chip.
- **Ink** (`#1b1f23` / dark `#f2f3f5`) and **Slate** (`#545b64` / dark `#a8aeb7`): primary and
  secondary text.
- **Toast** (`#1f2328` / dark `#f2f3f5`): the snackbar surface, inverted against the host theme so
  it always separates from what is behind it, as system toasts do.

### Functional

- **Alert Red** (`#b3261e` / dark `#ff8a80`): offline. Dot, icon, and tint (`#fdecea` / `#4a1f1c`)
  behind the banner. Never text colour.
- **Signal Green** (`#1a7f37` / dark `#4cc38a`): back online.
- **Caution Amber** (`#8a5a00` / dark `#f0b429`): checking.
- **System Blue** (`#0b5fd1` / dark `#8ab4ff`): actions and focus. On the snackbar the inverse blue
  (`#8ab4ff` / dark `#0b5fd1`) is used.

### Named Rules

**The No-Red-Text Rule.** Red marks a state with a glyph; it never colours a sentence. The banner is
tinted, its words stay in the text colour.

**The Two-Signals Rule.** Every state is carried by words plus a shape. Hue is a third, supporting
signal.

## Typography

**Font:** the platform's system font (`system-ui, -apple-system, "Segoe UI", Roboto,
"Helvetica Neue", Arial, sans-serif` on web; the platform face on native).

**Character:** invisible. The host app's voice should carry through, because the system face is
the closest thing a library has to the host's own type.

### Hierarchy

- **Headline** (600, 22/28): the full-screen title only.
- **Title** (400, 16/24): the full-screen body and its primary action label.
- **Body** (400, 14/20): snackbar and banner messages.
- **Label** (600, 12/16, +0.02 em): chip text and text-button actions.

### Named Rules

**The Borrowed Voice Rule.** No web font is ever downloaded and no font family is ever hard-coded
beyond the system stack. Branding the type is the host's job via `--od-font-family`.

## Layout

A 4 px base scale (4, 8, 12, 16, 24, 32). Floating pieces sit `16` from the edges plus the safe-area
inset. The banner is in flow and pushes content. The snackbar is bottom-centred, full width minus
gutter on phones and capped at 560 on wider viewports. The full-screen state is a single centred
column, max 36 characters wide. Every interactive element is at least 44x44. Logical start/end
properties throughout so right-to-left works without extra code. Stacking and suppression rules are
in `docs/design/components.md`.

## Elevation & Depth

Flat by default; shadows only for pieces that float over content.

### Shadow Vocabulary

- **Chip** (`0 1px 3px rgba(0,0,0,0.2)`): the indicator chip.
- **Snackbar** (`0 2px 8px rgba(0,0,0,0.24), 0 1px 2px rgba(0,0,0,0.16)`): the snackbar.

### Named Rules

**The Flat-Until-Floating Rule.** Banner and full-screen have no shadow. Only a piece that overlaps
host content earns one.

## Shapes

Gently rounded and plain: 8 for the snackbar and buttons, 12 for the full-screen card on tablets,
pill (999) for the chip and dot, square for the banner so it reads as part of the page edge. 1 px
borders only where 3:1 UI contrast is needed (chip outline). No custom silhouettes.

## Components

### Snackbar

Dark bar at the bottom: glyph, message, text-button Retry (and optional dismiss). Offline
message persists; recovery lasts about 4 s. Safe-area aware.

### Banner

A thin tinted strip at the top while offline. Words in text colour, glyph in red.

### Indicator

A chip (default) or dot, positionable to any corner, always labelled. The dot carries an inner
glyph per state.

### Full-screen

Opt-in. Large wifi-off glyph, headline, one sentence, solid Try again button, optional Continue
offline text button.

### Buttons

- **Primary (solid):** `action` fill, `on-action` label, radius 8, 44 high.
- **Text:** `action` (or `action-inverse` on the snackbar) label, 44 high hit area.
- **Focus:** 2 px ring in `focus-ring`, 2 px offset. **Pressed:** 12% overlay.
- **Checking:** label swaps to spinner plus "Checking…", `aria-busy`, no layout shift.

## Do's and Don'ts

### Do:

- **Do** read all colour, spacing, radius and motion from tokens; never hard-code.
- **Do** keep copy to a few words and pair every status colour with a word and a glyph.
- **Do** respect safe areas, large text, right-to-left and reduced motion in every piece.
- **Do** announce each transition once, politely.

### Don't:

- **Don't** use red text, `role="alert"`, bounces, shakes, or looping animation outside the
  checking indicator.
- **Don't** download fonts or add a brand colour to the default tokens.
- **Don't** block the host app unless the owner opted into the full-screen state, and give that
  state a way out.
- **Don't** put `aria-label` on a bare `div` or `span`; give it a naming-capable role.

## Brand layer (docs site and promo only)

The package UI above is intentionally anonymous. The Docusaurus site (`apps/docs`), the demos'
chrome and the promo video may carry a stronger identity. This layer lives in the docs app's own
stylesheet and in the video's design file, **never** in the `--od-*` defaults, so installing the
package never imports a brand.

**Concept: "Signal, found"** (proposal). The story is the moment a connection returns. Visual
language: a dark, near-black canvas with a single saturated signal hue, large confident type, and
one recurring motif, a thin signal arc that is broken and then completes.

- **Palette:** canvas `#0e1116`, text `#f2f3f5`, signal accent `#2ee6a6` (a connection-found
  green-teal, distinct from the package's neutral status green), warning accent `#ff6b5e` for the
  "lost" half of every before/after. Docs light mode inverts to paper `#fafaf7` with deep teal
  `#00694a`. Contrast to be verified when implemented (all text pairings must still hit 4.5:1).
- **Type:** the docs site may self-host one display face for headings plus the system stack for
  body (Instrument Sans or a comparable grotesque; the choice is open). Web fonts are allowed in
  the docs only, `font-display: swap`, self-hosted, never from a CDN.
- **Motif:** the broken-then-whole signal arc as the logo mark, section dividers, the hero and the
  video's opening and closing frames.
- **Motion:** one authored moment per surface: the arc completing. Docs respect reduced motion.
- **Voice:** the same short, calm sentences as the package; the brand is visual, not chatty.
- **Promo video:** 16:9 and 9:16, 30 to 40 seconds, **no audio** (owner decision), real footage
  from the demos in the default theme so the product is shown as it ships, framed with the brand
  canvas and arc. On-screen text in en, optional pt-BR and es cuts.
- **Boundary:** the demos show the package in its default theme inside a branded frame; only the
  frame is branded.

## Assumptions to confirm

1. PRODUCT.md and this file were written without an interview, from the confirmed spec.
2. Platform is recorded as `adaptive` (one design, system-adaptive typography, safe areas and
   motion per OS). The alternative is `web`.
3. Creative North Star "The Polite Notice" and the neutral grey + blue palette are my choices; the
   owner only specified "neutral and system-like".
4. The snackbar is an inverted surface (dark on light apps), not a tinted one.
5. Status hues (red, green, amber) are for glyphs and dots only; blue is the action colour.
6. Banner is in-flow (pushes content) by default, with an opt-in overlay; the spec only says
   "persistent banner at the top".
7. Indicator default is the chip, default position `top-end`, and it collapses to a dot while the
   banner shows. It is not a live region; one announcer per transition.
8. Both offline messages are polite (`role="status"`); `role="alert"` is never used.
9. Full-screen is not a `dialog`: it takes focus and inerts the host but is a page replacement.
   Escape triggers "Continue offline" when present.
10. Recovery copy is "Back online" in en (spec) but "Conexão restabelecida" / "Conexión
    restablecida" in pt-BR / es for naturalness.
11. `distinguishReason` variant for `no-interface` is "No network connection"; the spec defines
    only the `no-internet` wording.
12. Checking: a user-pressed Retry always shows checking; `'brief'` shows only after 150 ms and
    stays at least 400 ms; `'none'` shows nothing for background checks.
13. API names used in docs (`slots`, `slotProps`, `renderSnackbar`, `indicator={{ position }}`,
    `banner={{ position, action }}`, `fullScreen={{ continueOffline }}`, `dismissible`,
    `motion`, `indicator="always"`, `colorScheme`, `data-od-theme`, `--od-banner-height`) are
    proposals for the `react`/`web`/`native` plans; only `fullScreen`, `distinguishReason`,
    `checkingFeedback` and `initialStatus` come from the spec.
14. Indicator dot is 14 px with an inner glyph, so state is readable without colour.
15. The brand layer (concept, palette, accent `#2ee6a6`, display face) is a proposal; contrast
    must be checked on implementation.
16. `.impeccable/design.json` (the Impeccable sidecar) was not written because it lies outside the
    files this task owns.

## Owner decisions after review (8 Oct 2026)

- The design was reviewed and approved.
- All non-full-screen pieces are swipe-dismissible (left or right) by default; a `dismissible`
  flag turns it off. Rules and the required non-gesture alternatives are in
  docs/design/components.md (Dismissal).
