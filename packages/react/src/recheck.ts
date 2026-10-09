import { useEffect, useRef, useSyncExternalStore } from 'react';
import { isOnline } from '@rogeriodocarmo/offline-detector-core';
import { useCore } from './context';
import type { RecheckOnReturnOptions } from './types';

/**
 * Opt-in per screen. While the calling component is mounted, a foreground return (reported by the
 * platform adapter) triggers a check; `onResult` then receives the outcome. Several mounted hooks
 * share one probe because core de-duplicates concurrent checks. Returns the latest known boolean
 * (`false` only when the app is offline).
 */
export function useRecheckOnReturn(options: RecheckOnReturnOptions = {}): boolean {
  const core = useCore('useRecheckOnReturn');
  const brief = options.checkingFeedback === 'brief';

  const onResult = useRef(options.onResult);
  useEffect(() => {
    onResult.current = options.onResult;
  });

  useEffect(() => {
    let mounted = true;
    const releases: Set<() => void> = new Set();

    const unsubscribe = core.adapter.subscribeForeground(() => {
      const release = brief ? core.feedback.begin() : () => {};
      releases.add(release);
      const settle = () => {
        releases.delete(release);
        release();
      };
      core.checkNow().then(
        (state) => {
          settle();
          if (!mounted) return;
          try {
            onResult.current?.(isOnline(state));
          } catch (error) {
            core.reportError(error);
          }
        },
        (error: unknown) => {
          settle();
          core.reportError(error);
        },
      );
    });

    return () => {
      mounted = false;
      unsubscribe();
      for (const release of [...releases]) release();
      releases.clear();
    };
  }, [core, brief]);

  // Subscribe to the boolean itself, so a checking flip that leaves the answer unchanged does not
  // re-render the screen.
  return useSyncExternalStore(
    core.store.subscribe,
    () => isOnline(core.store.getSnapshot()),
    () => isOnline(core.store.getServerSnapshot()),
  );
}

/**
 * For the UI layer: `'brief'` while a return-triggered check started by a
 * `useRecheckOnReturn({ checkingFeedback: 'brief' })` is pending, otherwise `'none'`.
 */
export function useCheckingFeedback(): 'brief' | 'none' {
  const { feedback } = useCore('useCheckingFeedback');
  return useSyncExternalStore(feedback.subscribe, feedback.getSnapshot, () => 'none');
}
