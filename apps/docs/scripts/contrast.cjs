'use strict';

/**
 * WCAG 2.x contrast for the docs brand layer (DESIGN.md, "Brand layer"). Every text pairing the
 * stylesheet uses is listed here; `src/css/custom.css` defines exactly these colours. Run
 * `pnpm --filter @offline-detector/docs contrast` to print the table.
 */

const PALETTE = {
  light: {
    paper: '#fafaf7',
    paperRaised: '#f0f0ea',
    ink: '#1b1f23',
    muted: '#545b64',
    signal: '#00694a',
    onSignal: '#fafaf7',
    lost: '#b3261e',
  },
  dark: {
    canvas: '#0e1116',
    canvasRaised: '#171b22',
    ink: '#f2f3f5',
    muted: '#a8aeb7',
    signal: '#2ee6a6',
    onSignal: '#0e1116',
    lost: '#ff6b5e',
  },
};

/** [mode, foreground key, background key, role, minimum ratio] */
const PAIRS = [
  ['light', 'ink', 'paper', 'body text', 4.5],
  ['light', 'muted', 'paper', 'secondary text', 4.5],
  ['light', 'signal', 'paper', 'links', 4.5],
  ['light', 'signal', 'paperRaised', 'links on code and cards', 4.5],
  ['light', 'ink', 'paperRaised', 'inline code and cards', 4.5],
  ['light', 'muted', 'paperRaised', 'secondary text on cards', 4.5],
  ['light', 'onSignal', 'signal', 'primary button label', 4.5],
  ['light', 'lost', 'paper', 'the lost half of a before/after', 4.5],
  ['dark', 'ink', 'canvas', 'body text', 4.5],
  ['dark', 'muted', 'canvas', 'secondary text', 4.5],
  ['dark', 'signal', 'canvas', 'links', 4.5],
  ['dark', 'signal', 'canvasRaised', 'links on code and cards', 4.5],
  ['dark', 'ink', 'canvasRaised', 'inline code and cards', 4.5],
  ['dark', 'muted', 'canvasRaised', 'secondary text on cards', 4.5],
  ['dark', 'onSignal', 'signal', 'primary button label', 4.5],
  ['dark', 'lost', 'canvas', 'the lost half of a before/after', 4.5],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function ratio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function table() {
  return PAIRS.map(([mode, fg, bg, role, min]) => {
    const value = ratio(PALETTE[mode][fg], PALETTE[mode][bg]);
    return {
      mode,
      foreground: fg,
      background: bg,
      fgHex: PALETTE[mode][fg],
      bgHex: PALETTE[mode][bg],
      role,
      min,
      ratio: Math.round(value * 100) / 100,
      pass: value >= min,
    };
  });
}

module.exports = { PALETTE, PAIRS, luminance, ratio, table };

if (require.main === module) {
  const rows = table();
  for (const r of rows) {
    console.log(
      `${r.mode.padEnd(5)} ${r.role.padEnd(34)} ${r.fgHex} on ${r.bgHex}  ${r.ratio.toFixed(2)}:1  ${r.pass ? 'PASS' : 'FAIL'} (>= ${r.min})`,
    );
  }
  if (rows.some((r) => !r.pass)) process.exit(1);
}
