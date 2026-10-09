/**
 * Styles of the four pieces, adapted from docs/design/prototype.html. Logical properties only
 * (RTL), system fonts only, no url(), no @import. Every piece carries `data-od-motion`
 * ("auto" | "reduced" | "full") so reduced motion works both from the OS setting and from a prop.
 */

/** Rules that remove movement; `m` is the selector prefix that scopes them to reduced motion. */
function reducedRules(m: string): string {
  return `${m}.od-snackbar,
${m}.od-banner,
${m}.od-fullscreen,
${m}.od-indicator {
  animation-name: od-fade;
  animation-duration: var(--od-duration-fast);
}
${m}.od-snackbar[data-od-state='exit'],
${m}.od-banner[data-od-state='exit'],
${m}.od-fullscreen[data-od-state='exit'],
${m}.od-indicator[data-od-state='exit'] {
  animation-name: od-fade-out;
}
${m} .od-spinner {
  display: none;
}
${m} .od-dot.checking::after {
  animation: none;
  opacity: 0.7;
  transform: scale(1.55);
}
${m} .od-msg,
${m} .od-text-button,
${m} .od-button {
  transition-duration: 0ms;
}`;
}

export const componentCss = `
/* ---------- Shared ---------- */
.od-icon {
  width: var(--od-size-icon);
  height: var(--od-size-icon);
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.od-text-button,
.od-button,
.od-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--od-space-sm);
  min-height: var(--od-size-touch-target);
  min-width: var(--od-size-touch-target);
  border: 0;
  font: inherit;
  cursor: pointer;
  position: relative;
  transition: background-color var(--od-duration-fast) var(--od-ease-standard);
}
.od-text-button,
.od-button {
  font-size: var(--od-font-size-label);
  line-height: var(--od-line-height-label);
  font-weight: var(--od-font-weight-semibold);
  letter-spacing: 0.02em;
}
.od-text-button {
  padding-inline: var(--od-space-md);
  background: transparent;
  border-radius: var(--od-radius-md);
}
.od-button {
  padding-inline: var(--od-space-xl);
  border-radius: var(--od-radius-md);
  background: var(--od-color-action);
  color: var(--od-color-on-action);
  font-size: var(--od-font-size-title);
  line-height: var(--od-line-height-title);
}
.od-button.full {
  width: 100%;
}
.od-button[aria-disabled='true'],
.od-text-button[aria-disabled='true'] {
  cursor: default;
}
.od-button:active {
  background-image: linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12));
}
[data-od-theme='dark'] .od-button:active {
  background-image: linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12));
}
.od-icon-button {
  padding: 0;
  background: transparent;
  color: var(--od-color-text-muted);
  border-radius: var(--od-radius-md);
}
.od-button:focus-visible,
.od-text-button:focus-visible,
.od-icon-button:focus-visible,
.od-dot-target:focus-visible,
.od-chip:focus-visible {
  outline: var(--od-focus-ring-width) solid var(--od-color-focus-ring);
  outline-offset: 2px;
}
.od-spinner {
  width: 16px;
  height: 16px;
  flex: none;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-inline-end-color: transparent;
  animation: od-spin 800ms linear infinite;
}
.od-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
@keyframes od-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes od-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes od-fade-out {
  to {
    opacity: 0;
  }
}

/* ---------- Snackbar ---------- */
.od-snackbar {
  position: fixed;
  inset-inline: max(var(--od-space-lg), env(safe-area-inset-left, 0px))
    max(var(--od-space-lg), env(safe-area-inset-right, 0px));
  inset-block-end: calc(
    var(--od-space-lg) + env(safe-area-inset-bottom, 0px) + var(--od-offset-bottom)
  );
  margin-inline: auto;
  max-width: var(--od-size-snackbar-max-width);
  min-height: var(--od-size-snackbar-min-height);
  display: flex;
  align-items: center;
  gap: var(--od-space-md);
  padding: var(--od-space-md) var(--od-space-lg);
  box-sizing: border-box;
  background: var(--od-color-surface-inverse);
  color: var(--od-color-text-inverse);
  border-radius: var(--od-radius-md);
  box-shadow: var(--od-shadow-snackbar);
  z-index: var(--od-z-snackbar);
  font-family: var(--od-font-family);
  font-size: var(--od-font-size-body);
  line-height: var(--od-line-height-body);
  animation: od-in-up var(--od-duration-base) var(--od-ease-out) backwards;
}
.od-snackbar .od-msg {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}
.od-snackbar .od-text-button {
  color: var(--od-color-action-inverse);
  margin-block: calc(var(--od-space-sm) * -1);
}
.od-snackbar .od-icon-button {
  color: var(--od-color-text-muted-inverse);
  margin-block: calc(var(--od-space-sm) * -1);
  margin-inline-end: calc(var(--od-space-md) * -1);
}
.od-snackbar .od-text-button:focus-visible,
.od-snackbar .od-icon-button:focus-visible {
  outline-color: var(--od-color-action-inverse);
}
.od-snackbar[data-od-state='exit'] {
  animation: od-out-down var(--od-duration-exit) var(--od-ease-in) both;
}
@keyframes od-in-up {
  from {
    opacity: 0;
    transform: translateY(var(--od-space-lg));
  }
}
@keyframes od-out-down {
  to {
    opacity: 0;
    transform: translateY(var(--od-space-lg));
  }
}

/* ---------- Banner ---------- */
.od-banner {
  position: sticky;
  inset-block-start: 0;
  display: flex;
  align-items: center;
  gap: var(--od-space-sm);
  box-sizing: border-box;
  padding-block: var(--od-space-sm);
  padding-block-start: calc(
    var(--od-space-sm) + env(safe-area-inset-top, 0px) + var(--od-offset-top)
  );
  padding-inline: var(--od-space-lg);
  min-height: 40px;
  background: var(--od-color-status-offline-subtle);
  color: var(--od-color-text);
  border-block-end: var(--od-border-width) solid var(--od-color-border-subtle);
  font-family: var(--od-font-family);
  font-size: var(--od-font-size-body);
  line-height: var(--od-line-height-body);
  font-weight: var(--od-font-weight-medium);
  z-index: var(--od-z-banner);
  overflow: hidden;
  animation: od-expand var(--od-duration-base) var(--od-ease-out) backwards;
}
.od-banner[data-od-overlay] {
  position: fixed;
  inset-inline: 0;
}
.od-banner > .od-icon {
  color: var(--od-color-status-offline);
}
.od-banner .od-msg {
  flex: 1 1 auto;
  min-width: 0;
}
.od-banner .od-text-button {
  color: var(--od-color-action);
  margin-block: calc(var(--od-space-sm) * -1);
}
.od-banner .od-icon-button {
  margin-block: calc(var(--od-space-sm) * -1);
  margin-inline-end: calc(var(--od-space-md) * -1);
}
.od-banner[data-od-state='exit'] {
  animation: od-collapse var(--od-duration-exit) var(--od-ease-in) both;
}
@keyframes od-expand {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 120px;
  }
}
@keyframes od-collapse {
  from {
    opacity: 1;
    max-height: 120px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}

/* ---------- Indicator: dot and chip ---------- */
.od-indicator {
  position: fixed;
  z-index: var(--od-z-indicator);
  font-family: var(--od-font-family);
  animation: od-fade var(--od-duration-base) var(--od-ease-out) backwards;
}
.od-indicator[data-od-state='exit'] {
  animation: od-fade-out var(--od-duration-exit) var(--od-ease-in) both;
}
.od-pos-top-start,
.od-pos-top-end {
  inset-block-start: calc(
    var(--od-space-lg) + env(safe-area-inset-top, 0px) + var(--od-offset-top) +
      var(--od-banner-height, 0px)
  );
}
.od-pos-bottom-start,
.od-pos-bottom-end {
  inset-block-end: calc(
    var(--od-space-lg) + env(safe-area-inset-bottom, 0px) + var(--od-offset-bottom) +
      var(--od-snackbar-height, 0px)
  );
}
.od-pos-top-start,
.od-pos-bottom-start {
  inset-inline-start: var(--od-space-lg);
}
.od-pos-top-end,
.od-pos-bottom-end {
  inset-inline-end: var(--od-space-lg);
}
.od-dot {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--od-size-indicator-dot);
  height: var(--od-size-indicator-dot);
  flex: none;
  border-radius: var(--od-radius-full);
  box-shadow: 0 0 0 1px var(--od-color-surface);
  color: var(--od-color-surface);
}
.od-dot svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.od-dot.offline {
  background: var(--od-color-status-offline);
}
.od-dot.online {
  background: var(--od-color-status-online);
}
.od-dot.checking {
  background: var(--od-color-status-checking);
}
.od-dot.checking::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 2px solid var(--od-color-status-checking);
  animation: od-pulse var(--od-duration-pulse) var(--od-ease-out) infinite;
}
@keyframes od-pulse {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(2.2);
    opacity: 0;
  }
}
.od-dot-target {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: var(--od-size-touch-target);
  min-height: var(--od-size-touch-target);
  border-radius: var(--od-radius-full);
}
.od-dot-target:focus-visible {
  outline-offset: -2px;
}
.od-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--od-space-sm);
  min-height: 28px;
  box-sizing: border-box;
  padding-block: var(--od-space-xs);
  padding-inline: var(--od-space-sm) var(--od-space-md);
  background: var(--od-color-surface-raised);
  color: var(--od-color-text);
  border: var(--od-border-width) solid var(--od-color-border);
  border-radius: var(--od-radius-full);
  box-shadow: var(--od-shadow-chip);
  font-size: var(--od-font-size-label);
  line-height: var(--od-line-height-label);
  font-weight: var(--od-font-weight-semibold);
  letter-spacing: 0.02em;
}
.od-chip .od-dot {
  box-shadow: 0 0 0 1px var(--od-color-surface-raised);
}
.od-chip[tabindex]::before {
  content: '';
  position: absolute;
  inset-block: -8px;
  inset-inline: -4px;
}

/* ---------- Full-screen ---------- */
.od-fullscreen {
  position: fixed;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--od-space-xl);
  padding: var(--od-space-xl);
  padding-block-start: calc(var(--od-space-xl) + env(safe-area-inset-top, 0px));
  padding-block-end: calc(var(--od-space-xl) + env(safe-area-inset-bottom, 0px));
  height: 100dvh;
  overflow-y: auto;
  background: var(--od-color-surface);
  color: var(--od-color-text);
  text-align: center;
  z-index: var(--od-z-fullscreen);
  font-family: var(--od-font-family);
  animation: od-fade var(--od-duration-slow) var(--od-ease-out) backwards;
}
.od-fullscreen[data-od-state='exit'] {
  animation: od-fade-out var(--od-duration-exit) var(--od-ease-in) both;
}
.od-fullscreen-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--od-space-lg);
  max-width: var(--od-size-fullscreen-measure);
  width: 100%;
}
.od-fullscreen .od-big-icon {
  width: 48px;
  height: 48px;
  color: var(--od-color-status-offline);
  stroke-width: 1.75;
}
.od-fullscreen h1 {
  margin: 0;
  font-size: var(--od-font-size-headline);
  line-height: var(--od-line-height-headline);
  font-weight: var(--od-font-weight-semibold);
}
.od-fullscreen h1:focus {
  outline: none;
}
.od-fullscreen p {
  margin: 0;
  font-size: var(--od-font-size-title);
  line-height: var(--od-line-height-title);
  color: var(--od-color-text-muted);
}
.od-fullscreen-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--od-space-sm);
  width: 100%;
  margin-block-start: var(--od-space-sm);
}
.od-fullscreen .od-text-button {
  color: var(--od-color-action);
  font-size: var(--od-font-size-title);
  line-height: var(--od-line-height-title);
  font-weight: var(--od-font-weight-medium);
  letter-spacing: 0;
}

/* ---------- Reduced motion: fade only, no movement, no loops ---------- */
@media (prefers-reduced-motion: reduce) {
${reducedRules("[data-od-motion='auto']")}
}
${reducedRules("[data-od-motion='reduced']")}

/* ---------- Windows High Contrast ---------- */
@media (forced-colors: active) {
  .od-snackbar,
  .od-chip,
  .od-button,
  .od-text-button {
    border: 1px solid CanvasText;
  }
  .od-dot {
    background: CanvasText;
    color: Canvas;
    forced-color-adjust: none;
  }
}
`;
