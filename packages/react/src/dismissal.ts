import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { OfflineStatus } from '@rogeriodocarmo/offline-detector-core';
import { useCore } from './context';
import { useNetworkStatus } from './provider';
import type { DismissiblePiece, DismissOptions } from './types';

/** Pure. A per-piece value wins over the global one; the default is `true`. */
export function resolveDismissible(
  piece: DismissiblePiece,
  options: DismissOptions,
): boolean {
  return options[piece]?.dismissible ?? options.dismissible ?? true;
}

/** The pieces dismissed in one status; a different status means a fresh, empty record. */
interface DismissalRecord {
  status: OfflineStatus;
  pieces: Set<DismissiblePiece>;
}

/**
 * Tracks which pieces the user has dismissed. A dismissed piece stays hidden until the next
 * status transition (online to offline or the reverse), which un-dismisses every piece. In
 * memory only; nothing is persisted.
 */
export function useDismissals(options: DismissOptions = {}): {
  isDismissed(piece: DismissiblePiece): boolean;
  dismiss(piece: DismissiblePiece): void;
} {
  const core = useCore('useDismissals');
  const { status } = useNetworkStatus();
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const record = useRef({ status, pieces: new Set() } as DismissalRecord);
  const latestOptions = useRef(options);
  useEffect(() => {
    latestOptions.current = options;
  });

  // Starts a fresh record when the status differs from the one the record was made in.
  const syncRecord = useCallback(() => {
    const current = core.store.getSnapshot().status;
    if (record.current.status !== current) {
      record.current = { status: current, pieces: new Set() };
    }
  }, [core]);

  // Reset on the transition itself, not on the render that follows it: a status that leaves and
  // comes back between two renders must still have cleared the record on the way.
  useEffect(() => core.store.subscribe(syncRecord), [core, syncRecord]);

  // A record made in another status is stale: reading it as empty IS the reset.
  const isDismissed = useCallback(
    (piece: DismissiblePiece) =>
      record.current.status === status && record.current.pieces.has(piece),
    [status],
  );

  const dismiss = useCallback(
    (piece: DismissiblePiece) => {
      const opts = latestOptions.current;
      if (!resolveDismissible(piece, opts)) return;
      syncRecord();
      if (record.current.pieces.has(piece)) return;
      record.current.pieces.add(piece);
      rerender();
      opts.onDismiss?.(piece);
    },
    [syncRecord],
  );

  return { isDismissed, dismiss };
}
