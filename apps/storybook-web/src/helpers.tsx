import { resolveStrings } from '@rogeriodocarmo/offline-detector-react';
import type { OfflineStrings } from '@rogeriodocarmo/offline-detector-react';
import type { Motion, Phase, PieceProps } from '@rogeriodocarmo/offline-detector-web';

/** Arguments shared by the four piece stories. */
export interface PieceArgs {
  phase: Phase;
  /** On: the piece gets `actions.dismiss` (swipe, Escape, the Dismiss button). */
  dismissible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export const phaseControl = {
  control: 'inline-radio',
  options: ['offline', 'checking', 'recovered'],
} as const;

/** What the toolbar globals say. Stories read them in `render`, so a toolbar change re-renders. */
export function environment(globals: Record<string, unknown>) {
  const locale = String(globals.locale ?? 'en');
  const motion: Motion = globals.motion === 'reduced' ? 'reduced' : 'auto';
  return { locale, motion, strings: resolveStrings(locale) };
}

export function messageFor(strings: OfflineStrings, phase: Phase): string {
  return phase === 'recovered' ? strings.online : strings.offline;
}

/**
 * The props every bundled piece takes, built the way `OfflineDetector` builds them. A pressed
 * Retry would show "Checking" after 0 ms, so the checking stories do the same; that keeps the
 * snapshot from depending on the 150 ms window.
 */
export function pieceProps(
  args: PieceArgs,
  globals: Record<string, unknown>,
  dismissible = args.dismissible,
): PieceProps {
  const { strings, motion } = environment(globals);
  return {
    phase: args.phase,
    message: messageFor(strings, args.phase),
    strings,
    motion,
    checkingDelayMs: 0,
    actions: { retry: args.onRetry, dismiss: dismissible ? args.onDismiss : undefined },
  };
}
