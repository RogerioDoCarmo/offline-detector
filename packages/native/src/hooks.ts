import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, useColorScheme } from 'react-native';
import { createTheme, type OfflineTheme } from './theme';

/**
 * The resolved theme. `auto` follows `useColorScheme()` (and falls back to light when the
 * platform reports none); `light` and `dark` force a scheme. Overrides are merged on top.
 */
export function useOfflineTheme(
  colorScheme: 'auto' | 'light' | 'dark' = 'auto',
  overrides?: Partial<OfflineTheme>,
): OfflineTheme {
  const system = useColorScheme();
  const scheme =
    colorScheme === 'auto' ? (system === 'dark' ? 'dark' : 'light') : colorScheme;
  return useMemo(() => createTheme(overrides, scheme), [overrides, scheme]);
}

/**
 * Whether movement should be removed. `reduced` and `full` force the answer; `auto` reads
 * `AccessibilityInfo.isReduceMotionEnabled()` once and follows `reduceMotionChanged`.
 */
export function useReducedMotion(motion: 'auto' | 'reduced' | 'full' = 'auto'): boolean {
  const [system, setSystem] = useState(false);
  useEffect(() => {
    if (motion !== 'auto') return undefined;
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setSystem(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystem,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, [motion]);
  if (motion === 'reduced') return true;
  if (motion === 'full') return false;
  return system;
}

export interface PieceTransitionOptions {
  visible: boolean;
  reduceMotion: boolean;
  theme: OfflineTheme;
  /** Vertical offset the piece enters from and leaves to. 0 for a pure fade. */
  translateFrom?: number;
  /** Enter duration in ms; reduced motion always uses `durationFast`. */
  enterDuration?: number;
}

/**
 * Enter and exit for a piece: opacity and translateY, native driver only. Under reduced motion
 * there is no translation and every fade lasts `durationFast`. After the exit finishes the piece
 * reports `mounted: false` so it can render nothing (and leave the accessibility tree).
 */
export function usePieceTransition({
  visible,
  reduceMotion,
  theme,
  translateFrom = 0,
  enterDuration,
}: PieceTransitionOptions) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateFrom)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(reduceMotion ? 0 : translateFrom);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduceMotion
            ? theme.durationFast
            : (enterDuration ?? theme.durationBase),
          easing: Easing.bezier(...theme.easeOut),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduceMotion ? 0 : (enterDuration ?? theme.durationBase),
          easing: Easing.bezier(...theme.easeOut),
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }
    let cancelled = false;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: reduceMotion ? theme.durationFast : theme.durationExit,
        easing: Easing.bezier(...theme.easeIn),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: reduceMotion ? 0 : translateFrom,
        duration: reduceMotion ? 0 : theme.durationExit,
        easing: Easing.bezier(...theme.easeIn),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!cancelled) setMounted(false);
    });
    return () => {
      cancelled = true;
    };
    // The values are stable refs; only the inputs below should restart the animation.
  }, [visible, reduceMotion]);

  return { mounted, style: { opacity, transform: [{ translateY }] } };
}
