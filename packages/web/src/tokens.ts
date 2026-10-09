import { createElement } from 'react';
import type { ReactElement } from 'react';
import { componentCss } from './styles';

/** docs/design/tokens.md, section 10. Values are copied, not derived. */
const LIGHT: Record<string, string> = {
  '--od-color-surface': '#ffffff',
  '--od-color-surface-raised': '#f4f5f7',
  '--od-color-surface-inverse': '#1f2328',
  '--od-color-text': '#1b1f23',
  '--od-color-text-muted': '#545b64',
  '--od-color-text-inverse': '#ffffff',
  '--od-color-text-muted-inverse': '#c4c9d0',
  '--od-color-border': '#80878f',
  '--od-color-border-subtle': '#d9dce1',
  '--od-color-status-offline': '#b3261e',
  '--od-color-status-offline-subtle': '#fdecea',
  '--od-color-status-online': '#1a7f37',
  '--od-color-status-checking': '#8a5a00',
  '--od-color-action': '#0b5fd1',
  '--od-color-on-action': '#ffffff',
  '--od-color-action-inverse': '#8ab4ff',
  '--od-color-focus-ring': '#0b5fd1',
  '--od-color-scrim': 'rgba(0, 0, 0, 0.4)',

  '--od-space-xs': '4px',
  '--od-space-sm': '8px',
  '--od-space-md': '12px',
  '--od-space-lg': '16px',
  '--od-space-xl': '24px',
  '--od-space-2xl': '32px',

  '--od-radius-sm': '4px',
  '--od-radius-md': '8px',
  '--od-radius-lg': '12px',
  '--od-radius-full': '999px',

  '--od-shadow-none': 'none',
  '--od-shadow-chip': '0 1px 3px rgba(0, 0, 0, 0.2)',
  '--od-shadow-snackbar': '0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)',

  '--od-font-family':
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--od-font-size-label': '12px',
  '--od-font-size-body': '14px',
  '--od-font-size-title': '16px',
  '--od-font-size-headline': '22px',
  '--od-line-height-label': '16px',
  '--od-line-height-body': '20px',
  '--od-line-height-title': '24px',
  '--od-line-height-headline': '28px',
  '--od-font-weight-regular': '400',
  '--od-font-weight-medium': '500',
  '--od-font-weight-semibold': '600',

  '--od-size-touch-target': '44px',
  '--od-size-indicator-dot': '14px',
  '--od-size-icon': '20px',
  '--od-size-snackbar-min-height': '48px',
  '--od-size-snackbar-max-width': '560px',
  '--od-size-fullscreen-measure': '36ch',
  '--od-border-width': '1px',
  '--od-focus-ring-width': '2px',

  '--od-duration-fast': '120ms',
  '--od-duration-base': '200ms',
  '--od-duration-slow': '320ms',
  '--od-duration-exit': '150ms',
  '--od-duration-pulse': '1200ms',
  '--od-ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
  '--od-ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)',
  '--od-ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',

  '--od-z-banner': '1000',
  '--od-z-indicator': '1010',
  '--od-z-snackbar': '1020',
  '--od-z-fullscreen': '1100',

  '--od-offset-top': '0px',
  '--od-offset-bottom': '0px',
};

const DARK: Record<string, string> = {
  '--od-color-surface': '#1c1c1e',
  '--od-color-surface-raised': '#2c2c2e',
  '--od-color-surface-inverse': '#f2f3f5',
  '--od-color-text': '#f2f3f5',
  '--od-color-text-muted': '#a8aeb7',
  '--od-color-text-inverse': '#1b1f23',
  '--od-color-text-muted-inverse': '#4a5058',
  '--od-color-border': '#8a9099',
  '--od-color-border-subtle': '#3a3a3c',
  '--od-color-status-offline': '#ff8a80',
  '--od-color-status-offline-subtle': '#4a1f1c',
  '--od-color-status-online': '#4cc38a',
  '--od-color-status-checking': '#f0b429',
  '--od-color-action': '#8ab4ff',
  '--od-color-on-action': '#0b1b33',
  '--od-color-action-inverse': '#0b5fd1',
  '--od-color-focus-ring': '#8ab4ff',
  '--od-color-scrim': 'rgba(0, 0, 0, 0.6)',
};

function declarations(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
}

// Flat, unindented blocks on purpose: they are easy to read and to assert on in tests.
// Wrapped in :where() so the selectors weigh nothing: a host rule that sets any `--od-*` token
// wins whatever its specificity or position in the cascade, which is what the README promises.
const LIGHT_SELECTOR = ":where(:root, [data-od-root], [data-od-theme='light'])";
const DARK_SELECTOR =
  ":where(:root[data-od-theme='dark'], [data-od-root][data-od-theme='dark'], [data-od-theme='dark'])";
const AUTO_DARK_SELECTOR =
  ":where(:root:not([data-od-theme='light']), [data-od-root]:not([data-od-theme='light']))";

/**
 * The `--od-*` custom properties. Light is the default; dark follows `prefers-color-scheme`
 * unless the host forces a theme with `data-od-theme="light" | "dark"` on `<html>`, on a
 * `[data-od-root]` element, or on any subtree.
 */
export const offlineTokensCss = `${LIGHT_SELECTOR} {
${declarations(LIGHT)}
}

@media (prefers-color-scheme: dark) {
${AUTO_DARK_SELECTOR} {
${declarations(DARK)}
}
}

${DARK_SELECTOR} {
${declarations(DARK)}
}
`;

/** Tokens plus the styles of the four pieces. This is what `<OfflineTokens />` injects. */
export const offlineCss = `${offlineTokensCss}\n${componentCss}`;

export interface OfflineTokensProps {
  /** CSP nonce for the inline style element. */
  nonce?: string;
}

/**
 * Renders the tokens and piece styles as one inline `<style>` element. It touches no browser
 * global, so it renders the same on the server and on the client. Render it once, near the root.
 */
export function OfflineTokens({ nonce }: OfflineTokensProps): ReactElement {
  return createElement('style', {
    'data-od-tokens': '',
    nonce,
    dangerouslySetInnerHTML: { __html: offlineCss },
  });
}
