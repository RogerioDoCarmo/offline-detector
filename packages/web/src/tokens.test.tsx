/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import { OfflineTokens, offlineCss, offlineTokensCss } from './tokens';

/** Declarations of the first block whose selector list is exactly `selector`. */
function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no block for ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const out: Record<string, string> = {};
  for (const line of css.slice(open + 1, close).split(';')) {
    const colon = line.indexOf(':');
    if (colon > 0) out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return out;
}

const LIGHT_SELECTOR = ":root,\n[data-od-root],\n[data-od-theme='light']";
const DARK_SELECTOR =
  ":root[data-od-theme='dark'],\n[data-od-root][data-od-theme='dark'],\n[data-od-theme='dark']";

describe('light tokens (docs/design/tokens.md)', () => {
  const light = block(offlineTokensCss, LIGHT_SELECTOR);

  it.each([
    ['--od-color-surface', '#ffffff'],
    ['--od-color-surface-raised', '#f4f5f7'],
    ['--od-color-surface-inverse', '#1f2328'],
    ['--od-color-text', '#1b1f23'],
    ['--od-color-text-muted', '#545b64'],
    ['--od-color-text-inverse', '#ffffff'],
    ['--od-color-text-muted-inverse', '#c4c9d0'],
    ['--od-color-border', '#80878f'],
    ['--od-color-border-subtle', '#d9dce1'],
    ['--od-color-status-offline', '#b3261e'],
    ['--od-color-status-offline-subtle', '#fdecea'],
    ['--od-color-status-online', '#1a7f37'],
    ['--od-color-status-checking', '#8a5a00'],
    ['--od-color-action', '#0b5fd1'],
    ['--od-color-on-action', '#ffffff'],
    ['--od-color-action-inverse', '#8ab4ff'],
    ['--od-color-focus-ring', '#0b5fd1'],
    ['--od-color-scrim', 'rgba(0, 0, 0, 0.4)'],
    ['--od-space-xs', '4px'],
    ['--od-space-sm', '8px'],
    ['--od-space-md', '12px'],
    ['--od-space-lg', '16px'],
    ['--od-space-xl', '24px'],
    ['--od-space-2xl', '32px'],
    ['--od-radius-sm', '4px'],
    ['--od-radius-md', '8px'],
    ['--od-radius-lg', '12px'],
    ['--od-radius-full', '999px'],
    ['--od-shadow-none', 'none'],
    ['--od-shadow-chip', '0 1px 3px rgba(0, 0, 0, 0.2)'],
    [
      '--od-shadow-snackbar',
      '0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)',
    ],
    [
      '--od-font-family',
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ],
    ['--od-font-size-label', '12px'],
    ['--od-font-size-body', '14px'],
    ['--od-font-size-title', '16px'],
    ['--od-font-size-headline', '22px'],
    ['--od-line-height-label', '16px'],
    ['--od-line-height-body', '20px'],
    ['--od-line-height-title', '24px'],
    ['--od-line-height-headline', '28px'],
    ['--od-font-weight-regular', '400'],
    ['--od-font-weight-medium', '500'],
    ['--od-font-weight-semibold', '600'],
    ['--od-size-touch-target', '44px'],
    ['--od-size-indicator-dot', '14px'],
    ['--od-size-icon', '20px'],
    ['--od-size-snackbar-min-height', '48px'],
    ['--od-size-snackbar-max-width', '560px'],
    ['--od-size-fullscreen-measure', '36ch'],
    ['--od-border-width', '1px'],
    ['--od-focus-ring-width', '2px'],
    ['--od-duration-fast', '120ms'],
    ['--od-duration-base', '200ms'],
    ['--od-duration-slow', '320ms'],
    ['--od-duration-exit', '150ms'],
    ['--od-duration-pulse', '1200ms'],
    ['--od-ease-out', 'cubic-bezier(0.16, 1, 0.3, 1)'],
    ['--od-ease-in', 'cubic-bezier(0.7, 0, 0.84, 0)'],
    ['--od-ease-standard', 'cubic-bezier(0.4, 0, 0.2, 1)'],
    ['--od-z-banner', '1000'],
    ['--od-z-indicator', '1010'],
    ['--od-z-snackbar', '1020'],
    ['--od-z-fullscreen', '1100'],
    ['--od-offset-top', '0px'],
    ['--od-offset-bottom', '0px'],
  ])('%s is %s', (name, value) => {
    expect(light[name]).toBe(value);
  });

  it('declares exactly 65 custom properties', () => {
    expect(Object.keys(light)).toHaveLength(65);
  });
});

describe('dark tokens', () => {
  const expected: Record<string, string> = {
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

  it('applies under data-od-theme="dark" (on :root, a subtree root, or any element)', () => {
    expect(block(offlineTokensCss, DARK_SELECTOR)).toEqual(expected);
  });

  it('applies under prefers-color-scheme: dark unless the theme is forced light', () => {
    const media =
      ":root:not([data-od-theme='light']),\n[data-od-root]:not([data-od-theme='light'])";
    const at = offlineTokensCss.indexOf('@media (prefers-color-scheme: dark)');
    expect(at).toBeGreaterThan(0);
    expect(block(offlineTokensCss.slice(at), media)).toEqual(expected);
  });
});

describe('component CSS', () => {
  it('is part of offlineCss but not of the tokens-only string', () => {
    expect(offlineTokensCss).not.toContain('.od-snackbar');
    expect(offlineCss.startsWith(offlineTokensCss)).toBe(true);
    expect(offlineCss).toContain('.od-snackbar');
    expect(offlineCss).toContain('.od-banner');
    expect(offlineCss).toContain('.od-chip');
    expect(offlineCss).toContain('.od-fullscreen');
  });

  it('uses logical properties only (no left/right insets, margins or paddings)', () => {
    expect(offlineCss).not.toMatch(/(^|[\s;{])(left|right)\s*:/);
    expect(offlineCss).not.toMatch(/(margin|padding|border)-(left|right)/);
    expect(offlineCss).not.toMatch(/translateX\(-?\d/);
  });

  it('loads nothing from the network', () => {
    expect(offlineCss).not.toMatch(/@import|url\(|@font-face|https?:/);
  });

  it('has a reduced-motion path for the auto and the forced setting', () => {
    expect(offlineCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(offlineCss).toContain("[data-od-motion='reduced']");
  });

  it('keeps borders under forced colours', () => {
    expect(offlineCss).toContain('@media (forced-colors: active)');
  });
});

describe('<OfflineTokens />', () => {
  it('renders one style element holding the CSS, with no window or document', () => {
    expect(typeof window).toBe('undefined');
    const html = renderToString(<OfflineTokens />);
    expect(html.startsWith('<style data-od-tokens="">')).toBe(true);
    expect(html.endsWith('</style>')).toBe(true);
    expect(html).toContain('--od-color-surface: #ffffff;');
  });

  it('forwards a CSP nonce', () => {
    expect(renderToString(<OfflineTokens nonce="abc123" />)).toContain('nonce="abc123"');
  });
});
