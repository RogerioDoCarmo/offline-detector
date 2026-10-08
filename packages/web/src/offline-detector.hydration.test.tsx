import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { OfflineDetector } from './offline-detector';
import { createFakeAdapter, createFakeFetch, PROBE } from '../test-utils/fakes';

describe('OfflineDetector hydration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [undefined, 'auto'],
    ['online' as const, 'auto'],
    ['offline' as const, 'auto'],
    ['offline' as const, 'dark'],
  ])(
    'hydrates server markup (initialStatus %p, colorScheme %p) without a mismatch',
    async (hint, scheme) => {
      const fake = createFakeAdapter();
      const tree = (
        <OfflineDetector
          adapter={fake.adapter}
          probe={PROBE}
          fetch={createFakeFetch()}
          initialStatus={hint}
          colorScheme={scheme as 'auto' | 'dark'}
        >
          <h1>Host app</h1>
        </OfflineDetector>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(tree);
      const serverHtml = container.innerHTML;

      const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
      const onRecoverableError = jest.fn();
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, tree, { onRecoverableError });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();

      // Hydration kept the server DOM; afterwards the detector takes over (online here).
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      expect(serverHtml).toContain('<h1>Host app</h1>');
      expect(container.querySelector('.od-snackbar')).toBeNull();
      await act(async () => {
        root.unmount();
      });
      errors.mockRestore();
    },
  );
});
