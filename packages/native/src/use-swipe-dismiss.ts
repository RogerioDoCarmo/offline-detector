import { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native';
import { lightTheme, type OfflineTheme } from './theme';

/** Release past this share of the piece's width dismisses it. */
export const SWIPE_DISTANCE_RATIO = 0.3;
/** Release at or above this speed (px/ms) in the drag direction dismisses it. */
export const SWIPE_VELOCITY = 0.5;
/** Movement (px) after which the drag locks to its dominant axis. */
export const SWIPE_AXIS_LOCK = 8;
/** Slide-out distance used when the piece has not been measured yet. */
const FALLBACK_SLIDE = 400;

export interface UseSwipeDismissOptions {
  /** False makes the hook inert (no gesture is claimed). */
  enabled: boolean;
  onDismiss: () => void;
  /** Removes the slide: dismissal becomes an instant fade. */
  reducedMotion: boolean;
  theme?: OfflineTheme;
}

/**
 * Swipe a piece left or right to dismiss it. PanResponder plus the built-in Animated API on the
 * native driver. Spread `panHandlers` and `style` on an `Animated.View` and pass `onLayout` so the
 * 30% rule knows the width.
 */
export function useSwipeDismiss(options: UseSwipeDismissOptions) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const width = useRef(0);
  const latest = useRef(options);
  latest.current = options;

  const responder = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (responder.current === null) {
    const theme = () => latest.current.theme ?? lightTheme;

    const springBack = () => {
      if (latest.current.reducedMotion) {
        translateX.setValue(0);
        opacity.setValue(1);
        return;
      }
      const t = theme();
      const easing = Easing.bezier(...t.easeOut);
      Animated.timing(translateX, {
        toValue: 0,
        duration: t.durationBase,
        easing,
        useNativeDriver: true,
      }).start();
      Animated.timing(opacity, {
        toValue: 1,
        duration: t.durationBase,
        easing,
        useNativeDriver: true,
      }).start();
    };

    const slideOut = (direction: 1 | -1) => {
      const finish = () => latest.current.onDismiss();
      if (latest.current.reducedMotion) {
        opacity.setValue(0);
        finish();
        return;
      }
      const t = theme();
      const easing = Easing.bezier(...t.easeIn);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: direction * (width.current > 0 ? width.current : FALLBACK_SLIDE),
          duration: t.durationExit,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: t.durationExit,
          easing,
          useNativeDriver: true,
        }),
      ]).start(finish);
    };

    responder.current = PanResponder.create({
      // Taps belong to the buttons inside the piece.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, g: PanResponderGestureState) => {
        if (!latest.current.enabled) return false;
        const horizontal = Math.abs(g.dx);
        const vertical = Math.abs(g.dy);
        return Math.max(horizontal, vertical) >= SWIPE_AXIS_LOCK && horizontal > vertical;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        opacity.stopAnimation();
      },
      onPanResponderMove: (_event, g) => {
        translateX.setValue(g.dx);
        if (width.current > 0) {
          opacity.setValue(1 - Math.min(Math.abs(g.dx) / width.current, 1));
        }
      },
      onPanResponderRelease: (_event, g) => {
        const farEnough =
          width.current > 0 && Math.abs(g.dx) / width.current >= SWIPE_DISTANCE_RATIO;
        const fastEnough = Math.abs(g.vx) >= SWIPE_VELOCITY && g.dx * g.vx > 0;
        if (farEnough || fastEnough) {
          slideOut(g.dx > 0 ? 1 : -1);
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: springBack,
    });
  }

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    width.current = event.nativeEvent.layout.width;
  }, []);

  return {
    panHandlers: responder.current.panHandlers,
    onLayout,
    style: { opacity, transform: [{ translateX }] },
  };
}
