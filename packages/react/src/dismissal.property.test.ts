import fc from 'fast-check';
import type { DismissiblePiece } from './types';
import { resolveDismissible } from './dismissal';

const tri = fc.constantFrom(true, false, undefined);
const pieces = fc
  .constantFrom('snackbar', 'banner', 'indicator')
  .map((p): DismissiblePiece => p);

/** Builds an options object, leaving a key out entirely when its value is undefined. */
const build = (
  global: boolean | undefined,
  perPiece: Record<string, boolean | undefined>,
) => {
  const options: Record<string, unknown> = {};
  if (global !== undefined) options.dismissible = global;
  for (const [piece, value] of Object.entries(perPiece)) {
    options[piece] = value === undefined ? {} : { dismissible: value };
  }
  return options;
};

describe('resolveDismissible (property)', () => {
  it('matches the truth table for every combination of global and per-piece values', () => {
    fc.assert(
      fc.property(pieces, tri, tri, tri, tri, (piece, global, s, b, i) => {
        const per: Record<DismissiblePiece, boolean | undefined> = {
          snackbar: s,
          banner: b,
          indicator: i,
        };
        const options = build(global, per);
        const expected =
          per[piece] !== undefined ? per[piece] : global !== undefined ? global : true;
        expect(resolveDismissible(piece, options)).toBe(expected);
      }),
      { numRuns: 500 },
    );
  });

  it('is false only when something explicitly said false', () => {
    fc.assert(
      fc.property(pieces, tri, tri, (piece, global, own) => {
        const options = build(global, { [piece]: own });
        const result = resolveDismissible(piece, options);
        if (!result)
          expect(own === false || (own === undefined && global === false)).toBe(true);
      }),
    );
  });
});
