/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import { OfflineDetectorProvider, useNetworkStatus } from './provider';
import type { PlatformAdapter } from '@rogeriodocarmo/offline-detector-core';

function Status() {
  const { status, isOnline } = useNetworkStatus();
  return (
    <p>
      {status}:{String(isOnline)}
    </p>
  );
}

/** An adapter that fails the test if anything touches it during server rendering. */
function untouchableAdapter() {
  const touched: string[] = [];
  const adapter: PlatformAdapter = {
    isInterfaceUp: () => {
      touched.push('isInterfaceUp');
      return true;
    },
    subscribeInterface: () => {
      touched.push('subscribeInterface');
      return () => {};
    },
    subscribeForeground: () => {
      touched.push('subscribeForeground');
      return () => {};
    },
  };
  return { adapter, touched };
}

describe('server rendering', () => {
  it('runs in an environment with no window and no document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('never reads navigator or window while rendering', () => {
    const reads: string[] = [];
    const trap = (name: string) =>
      Object.defineProperty(globalThis, name, {
        configurable: true,
        get() {
          reads.push(name);
          return undefined;
        },
      });
    const saved = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    trap('navigator');
    trap('window');
    try {
      const { adapter } = untouchableAdapter();
      renderToString(
        <OfflineDetectorProvider adapter={adapter} probe={{ mode: 'interface-only' }}>
          <Status />
        </OfflineDetectorProvider>,
      );
    } finally {
      delete (globalThis as Record<string, unknown>).window;
      if (saved) Object.defineProperty(globalThis, 'navigator', saved);
      else delete (globalThis as Record<string, unknown>).navigator;
    }
    expect(reads).toEqual([]);
  });

  it('renders the unknown state and starts nothing', () => {
    const { adapter, touched } = untouchableAdapter();
    const html = renderToString(
      <OfflineDetectorProvider adapter={adapter} probe={{ mode: 'interface-only' }}>
        <Status />
      </OfflineDetectorProvider>,
    );
    expect(html).toBe('<p>unknown<!-- -->:<!-- -->true</p>');
    expect(touched).toEqual([]);
  });

  it('renders the initialStatus hint', () => {
    const { adapter, touched } = untouchableAdapter();
    const html = renderToString(
      <OfflineDetectorProvider
        adapter={adapter}
        probe={{ mode: 'interface-only' }}
        initialStatus="offline"
      >
        <Status />
      </OfflineDetectorProvider>,
    );
    expect(html).toBe('<p>offline<!-- -->:<!-- -->false</p>');
    expect(touched).toEqual([]);
  });
});
