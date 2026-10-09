/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import {
  Banner,
  FullScreen,
  Indicator,
  OfflineTokens,
  Snackbar,
  createWebAdapter,
  createWebProbeFetch,
} from './index';
import { EN } from '../test-utils';

describe('SSR safety (no window, no document)', () => {
  it('is really a node environment', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('importing and creating the adapter and probe fetch touches no browser global', () => {
    const adapter = createWebAdapter();
    expect(adapter.isInterfaceUp()).toBe(true);
    expect(typeof adapter.subscribeInterface(() => {})).toBe('function');
    expect(typeof adapter.subscribeForeground(() => {})).toBe('function');
    expect(typeof createWebProbeFetch()).toBe('function');
  });

  it('renders every piece to a string', () => {
    const base = { phase: 'offline', message: 'No internet', strings: EN } as const;
    const actions = { retry: () => {}, dismiss: () => {}, continueOffline: () => {} };
    const html = renderToString(
      <>
        <OfflineTokens />
        <Snackbar {...base} actions={actions} />
        <Banner {...base} actions={actions} />
        <Indicator {...base} actions={actions} />
        <FullScreen {...base} actions={actions} />
      </>,
    );
    expect(html).toContain('class="od-snackbar"');
    expect(html).toContain('class="od-banner"');
    expect(html).toContain('od-indicator od-pos-top-end');
    expect(html).toContain('class="od-fullscreen"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  });
});
