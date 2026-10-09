import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { darkTheme, lightTheme } from '@rogeriodocarmo/offline-detector-native';
import type { OfflineTheme } from '@rogeriodocarmo/offline-detector-native';
import { resolveStrings } from '@rogeriodocarmo/offline-detector-react';
import type { OfflineStrings } from '@rogeriodocarmo/offline-detector-react';

export type Phase = 'offline' | 'checking' | 'recovered';
export type Locale = 'en' | 'pt-BR' | 'es';
export type Scheme = 'light' | 'dark';

/** The arguments every piece story shares. Each one is an on-device control. */
export interface PieceArgs {
  phase: Phase;
  locale: Locale;
  colorScheme: Scheme;
  reduceMotion: boolean;
  /** On: the piece gets `onDismiss` (swipe it away). Off: it cannot be dismissed. */
  dismissible: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/** Control definitions for the four things the on-device panel exposes, plus the actions. */
export const sharedArgTypes = {
  locale: { control: 'radio', options: ['en', 'pt-BR', 'es'] },
  colorScheme: { control: 'radio', options: ['light', 'dark'] },
  reduceMotion: { control: 'boolean' },
  dismissible: { control: 'boolean' },
  onRetry: { action: 'retry' },
  onDismiss: { action: 'dismissed' },
} as const;

export const phaseArgType = {
  phase: { control: 'radio', options: ['offline', 'checking', 'recovered'] },
} as const;

export const sharedArgs = {
  locale: 'en',
  colorScheme: 'light',
  reduceMotion: false,
  dismissible: true,
} as const;

export const themeFor = (scheme: Scheme): OfflineTheme =>
  scheme === 'dark' ? darkTheme : lightTheme;

export function messageFor(strings: OfflineStrings, phase: Phase): string {
  return phase === 'recovered' ? strings.online : strings.offline;
}

/** Zero insets: the stage is a plain box, not a screen with a status bar or a notch. */
export const STAGE_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

const STAGE_BACKGROUND: Record<Scheme, string> = { light: '#F4F5F7', dark: '#101216' };

/**
 * A fixed-height box the absolutely positioned pieces can sit in. The pieces draw themselves
 * with the scheme's theme; the stage only supplies the page colour behind them.
 */
export function Stage(props: {
  colorScheme: Scheme;
  height?: number;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.stage,
        {
          backgroundColor: STAGE_BACKGROUND[props.colorScheme],
          height: props.height ?? 360,
        },
      ]}
    >
      {props.children}
    </View>
  );
}

/**
 * The props every bundled piece takes, built the way `OfflineDetector` builds them. `checking`
 * is shown at once, the way a pressed Retry shows it.
 */
export function pieceProps(args: PieceArgs) {
  const strings = resolveStrings(args.locale);
  return {
    phase: args.phase,
    message: messageFor(strings, args.phase),
    strings,
    theme: themeFor(args.colorScheme),
    reduceMotion: args.reduceMotion,
    insets: STAGE_INSETS,
    onRetry: args.onRetry,
    onDismiss: args.onDismiss,
    dismissible: args.dismissible,
  };
}

const styles = StyleSheet.create({
  stage: { width: '100%', overflow: 'hidden' },
});
