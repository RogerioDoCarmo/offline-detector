import axe from 'axe-core';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Banner, FullScreen, Indicator, Snackbar } from './index';
import { EN } from './test-utils';

const actions = {
  retry: () => Promise.resolve({} as never),
  dismiss: () => {},
  continueOffline: () => {},
};
const base = { message: 'No internet', strings: EN, actions } as const;

/** jsdom has no layout or paint, so the rules that need them are off; the rest run. */
async function violations(ui: ReactElement) {
  const { container } = render(ui);
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    },
  });
  return results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`,
  );
}

describe('axe harness', () => {
  it('actually reports problems (negative control)', async () => {
    const found = await violations(<img src="x.png" />);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('image-alt');
  });
});

describe('axe: no violations', () => {
  it.each([
    ['offline', 'offline'],
    ['checking', 'checking'],
    ['recovered', 'recovered'],
  ] as const)('Snackbar %s', async (_name, phase) => {
    expect(
      await violations(<Snackbar {...base} phase={phase} checkingDelayMs={0} />),
    ).toEqual([]);
  });

  it('Snackbar silent (another piece announces)', async () => {
    expect(
      await violations(<Snackbar {...base} phase="offline" announce={false} />),
    ).toEqual([]);
  });

  it.each([true, false])('Banner (announcer: %s)', async (announce) => {
    expect(
      await violations(
        <Banner {...base} phase="offline" announce={announce} showRetry />,
      ),
    ).toEqual([]);
  });

  it('Banner checking', async () => {
    expect(
      await violations(
        <Banner {...base} phase="checking" checkingDelayMs={0} showRetry />,
      ),
    ).toEqual([]);
  });

  it.each([
    ['chip', 'offline'],
    ['chip', 'checking'],
    ['chip', 'recovered'],
    ['dot', 'offline'],
    ['dot', 'checking'],
    ['dot', 'recovered'],
  ] as const)('Indicator %s %s', async (variant, phase) => {
    expect(
      await violations(
        <Indicator {...base} variant={variant} phase={phase} checkingDelayMs={0} />,
      ),
    ).toEqual([]);
  });

  it('Indicator dismissible and not dismissible', async () => {
    expect(await violations(<Indicator {...base} phase="offline" />)).toEqual([]);
    expect(
      await violations(
        <Indicator {...base} actions={{}} phase="offline" variant="dot" />,
      ),
    ).toEqual([]);
  });

  it.each(['offline', 'checking'] as const)('FullScreen %s', async (phase) => {
    expect(
      await violations(<FullScreen {...base} phase={phase} checkingDelayMs={0} />),
    ).toEqual([]);
  });
});
