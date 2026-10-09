# Product

<!-- impeccable:product-schema 1 -->

> Status: written from the confirmed design spec
> (`docs/superpowers/specs/2026-10-07-offline-detector-design.md`), not from an interview. The
> owner could not be asked; every inference is listed under "Assumptions to confirm" in
> `DESIGN.md`.

## Platform

adaptive

## Users

Two audiences, in this order of priority:

1. **App developers** (React web and React Native, including Expo Go) who want to know when their
   app has no working internet and want sensible feedback without building it. They judge the
   package in minutes: install, wrap the app in one provider, see something correct. They want to
   re-theme it with tokens, or replace any piece, without forking.
2. **End users of those apps**, often on a phone, often on a train, in a lift or on patchy mobile
   data. They are mid-task. They need to know, calmly and at once, that the app is not talking to
   the internet and that nothing they did is lost, and they need to know the moment it recovers.
   Many use screen readers, large text, reduced motion, right-to-left languages or one hand.

The author's own apps (`morse_app`, `mirror_app`) are the first consumers.

## Product Purpose

Detect when an app has **no real internet** (connected to Wi-Fi or cellular that carries no data
counts as offline) and give visual feedback plus a programmable callback. Success is a developer
who ships the default UI unchanged because it looks like it belongs in their app, and an end user
who never has to wonder whether the app is broken or the network is.

## Positioning

Most connectivity libraries report `navigator.onLine`, which lies when a network is connected but
dead. This one confirms reachability with a probe and ships the full user-facing experience
(snackbar, banner, indicator, optional full-screen state) for web and native from one package
family, with no custom native code and three languages bundled. The default UI is deliberately
unbranded so it can disappear into any host app.

## Operating Context

- Four npm packages under `@rogeriodocarmo/`: `core`, `react`, `web`, `native`.
- The UI renders inside someone else's app, on top of or beside their content, in their theme
  (light or dark), their language and their safe areas.
- Offline moments are stressful and brief. The UI appears at the worst time and must add no
  friction: no blocking, no layout surprises, no alarm.
- Documentation site (Docusaurus; en, pt-BR, es) and a promo video (no audio) may carry a stronger
  identity than the package UI.

## Capabilities and Constraints

- Four pieces: snackbar, banner, indicator (all on by default) and a full-screen state (opt-in).
- Customization through props, design tokens (CSS custom properties on web, theme object on
  native) and slots / render props.
- `en`, `pt-BR`, `es` bundled; every string overridable.
- Default message is always "No internet". "Connected, but no internet" is opt-in.
- No custom native code. No Reanimated, no `react-native-web`, no web-font downloads: system font
  stacks only. Motion uses CSS on web and React Native `Animated` on native.
- The only network traffic is the reachability probe; the UI collects and shows nothing else.
- SSR: server assumes online; nothing renders before mount.

## Brand Commitments

- Package UI: neutral and system-like. No logo, no mascot, no accent that is not a token.
- Docs and promo: a separate "brand layer" (see `DESIGN.md`), never leaking into default tokens.
- Name: `offline-detector` under the owner's scope `@rogeriodocarmo`.

## Evidence on Hand

- The design spec and `NPM-SETUP.md`. No screenshots, no user research, no testimonials, no
  benchmarks. None may be invented.
- Real footage for the promo comes from the demo apps after v1.

## Product Principles

1. **Disappear into the host.** Default look follows the platform; the host's brand wins.
2. **Calm, not alarming.** Offline is a state, not an error. Never red-alert theatre.
3. **Say it once, in the right place.** One announcer, one message per transition; pieces never
   repeat each other to the same person.
4. **Never block what the user can still do.** Full-screen is opt-in and always has a way out.
5. **Every default is replaceable.** Tokens first, then slots; replacing a piece must not lose
   accessibility or theming.

## Accessibility & Inclusion

- WCAG 2.2 AA minimum: 4.5:1 text, 3:1 UI components and graphical objects, 44x44 touch targets.
- Status is never carried by colour alone. Announcements for assistive tech, reduced motion
  honoured on web and native, large-text and RTL layouts supported, screen-reader-correct
  full-screen focus handling.
- Languages: English, Brazilian Portuguese, Spanish with native-quality copy.
