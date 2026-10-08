import type { ReactNode } from 'react';
import fc from 'fast-check';
import { act, renderHook } from '@testing-library/react';
import { OfflineDetectorProvider } from './provider';
import { useDismissals } from './dismissal';
import type { DismissiblePiece } from './types';
import { createAdapter, createFakeDetector, stateOf } from '../tests/helpers';

const PIECES: DismissiblePiece[] = ['snackbar', 'banner', 'indicator'];

type Event =
  | { kind: 'dismiss'; piece: DismissiblePiece }
  | { kind: 'status'; status: 'online' | 'offline' | 'unknown'; reason: boolean }
  | { kind: 'noise'; checking: boolean; lastChecked: number };

const piece = fc
  .constantFrom('snackbar', 'banner', 'indicator')
  .map((p): DismissiblePiece => p);
const event = fc.oneof(
  piece.map((p): Event => ({ kind: 'dismiss', piece: p })),
  fc
    .record({
      status: fc.constantFrom('online', 'offline', 'unknown'),
      reason: fc.boolean(),
    })
    .map((e): Event => ({ kind: 'status', ...e })),
  fc
    .record({ checking: fc.boolean(), lastChecked: fc.nat(1000) })
    .map((e): Event => ({ kind: 'noise', ...e })),
);
const flag = fc.constantFrom(true, false, undefined);

describe('useDismissals (property)', () => {
  it('matches a model: dismissals reset on every status transition, and only then', () => {
    fc.assert(
      fc.property(
        fc.array(event, { maxLength: 25 }),
        flag,
        flag,
        flag,
        flag,
        (events, global, s, b, i) => {
          const options = {
            ...(global === undefined ? {} : { dismissible: global }),
            ...(s === undefined ? {} : { snackbar: { dismissible: s } }),
            ...(b === undefined ? {} : { banner: { dismissible: b } }),
            ...(i === undefined ? {} : { indicator: { dismissible: i } }),
          };
          const allowed = (p: DismissiblePiece) =>
            ({ snackbar: s, banner: b, indicator: i })[p] ?? global ?? true;

          const fake = createFakeDetector(stateOf('offline', 'no-internet'));
          const adapter = createAdapter().adapter;
          const wrapper = ({ children }: { children: ReactNode }) => (
            <OfflineDetectorProvider adapter={adapter} detector={fake.detector}>
              {children}
            </OfflineDetectorProvider>
          );
          const { result, unmount } = renderHook(() => useDismissals(options), {
            wrapper,
          });

          let status = 'offline';
          let model: Set<DismissiblePiece> = new Set();
          for (const e of events) {
            if (e.kind === 'dismiss') {
              act(() => result.current.dismiss(e.piece));
              if (allowed(e.piece)) model.add(e.piece);
            } else if (e.kind === 'status') {
              act(() =>
                fake.set(stateOf(e.status, e.reason ? 'no-interface' : 'no-internet')),
              );
              if (e.status !== status) model = new Set();
              status = e.status;
            } else {
              act(() =>
                fake.set({
                  ...stateOf(
                    status as 'online',
                    status === 'offline' ? 'no-internet' : null,
                  ),
                  checking: e.checking,
                  lastChecked: e.lastChecked,
                }),
              );
            }
            for (const p of PIECES) {
              expect(result.current.isDismissed(p)).toBe(model.has(p));
            }
          }
          unmount();
        },
      ),
      { numRuns: 60 },
    );
  });
});
