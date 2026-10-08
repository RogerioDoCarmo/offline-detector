import type { DismissiblePiece, DismissOptions } from './types';

/** Pure. A per-piece value wins over the global one; the default is `true`. */
export function resolveDismissible(
  piece: DismissiblePiece,
  options: DismissOptions,
): boolean {
  return options[piece]?.dismissible ?? options.dismissible ?? true;
}
