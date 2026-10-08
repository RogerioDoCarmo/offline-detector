import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { OfflineDetectorProvider, useNetworkStatus } from './provider';
import { createAdapter, createFetch, PROBE } from '../tests/helpers';

function Status() {
  const { status } = useNetworkStatus();
  return <p>{status}</p>;
}

describe('hydration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [undefined, 'unknown'],
    ['offline' as const, 'offline'],
    ['online' as const, 'online'],
  ])(
    'hydrates server markup (initialStatus %p) without a mismatch',
    async (hint, shown) => {
      const tree = (
        <OfflineDetectorProvider
          adapter={createAdapter().adapter}
          probe={PROBE}
          fetch={createFetch()}
          initialStatus={hint}
        >
          <Status />
        </OfflineDetectorProvider>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(tree);
      expect(container.innerHTML).toBe(`<p>${shown}</p>`);

      const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onRecoverableError = jest.fn();
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, tree, { onRecoverableError });
      });
      // The first client render matched the server markup, then the detector took over.
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(container.innerHTML).toBe('<p>online</p>');
      await act(async () => {
        root.unmount();
      });
      errors.mockRestore();
    },
  );
});
