import { I18nManager, Platform, StatusBar } from 'react-native';

/** Safe-area insets in dp. `react-native-safe-area-context` is not required: pass these in. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * The insets used when the host passes none: the Android status bar height on top and zero
 * elsewhere. iOS has no platform API for this in core React Native, so hosts that draw under the
 * notch or home indicator pass `insets` (for example from `useSafeAreaInsets()`).
 */
export function defaultInsets(): Insets {
  return {
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
}

export function resolveInsets(insets?: Partial<Insets>): Insets {
  return { ...defaultInsets(), ...insets };
}

/** The inset on the inline-start and inline-end edges (swapped in right-to-left layouts). */
export function inlineInsets(insets: Insets): { start: number; end: number } {
  return I18nManager.isRTL
    ? { start: insets.right, end: insets.left }
    : { start: insets.left, end: insets.right };
}
