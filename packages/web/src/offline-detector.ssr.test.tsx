/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import { OfflineDetector } from './offline-detector';

describe('OfflineDetector on the server (no window, no document)', () => {
  it('is really a node environment', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(typeof navigator === 'undefined' || navigator.onLine === undefined).toBe(true);
  });

  it('renders the tokens and the children, and no piece, without touching window', () => {
    const html = renderToString(
      <OfflineDetector>
        <h1>Host app</h1>
      </OfflineDetector>,
    );
    expect(html).toContain('<h1>Host app</h1>');
    expect(html).toContain('data-od-tokens');
    expect(html).not.toContain('class="od-snackbar');
    expect(html).not.toContain('class="od-banner');
    expect(html).not.toContain('class="od-indicator');
    expect(html).not.toContain('Back online');
  });

  it('renders the theme wrapper for a forced colour scheme', () => {
    const html = renderToString(
      <OfflineDetector colorScheme="dark">
        <h1>Host app</h1>
      </OfflineDetector>,
    );
    expect(html).toContain('data-od-theme="dark"');
    expect(html).toContain('<h1>Host app</h1>');
  });

  it('shows the pieces when the host hints initialStatus offline', () => {
    const html = renderToString(
      <OfflineDetector initialStatus="offline">
        <h1>Host app</h1>
      </OfflineDetector>,
    );
    expect(html).toContain('class="od-snackbar');
    expect(html).toContain('class="od-banner');
    expect(html).toContain('No internet');
    expect(html).not.toContain('Back online');
  });

  it('shows nothing for initialStatus online', () => {
    const html = renderToString(
      <OfflineDetector initialStatus="online">
        <h1>Host app</h1>
      </OfflineDetector>,
    );
    expect(html).not.toContain('class="od-snackbar');
    expect(html).not.toContain('Back online');
  });
});
