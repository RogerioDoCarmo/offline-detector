import { act } from '@testing-library/react-native';
import { PanResponder, type PanResponderGestureState } from 'react-native';
import type { TestInstance } from 'test-renderer';
import { flatStyle } from './animated';

type Config = Parameters<typeof PanResponder.create>[0];
type Handlers = ReturnType<typeof PanResponder.create>['panHandlers'];
const gesture = (g: Partial<PanResponderGestureState>) => g as PanResponderGestureState;

/**
 * Records every PanResponder the pieces create, so a test can drive the real gesture of the real
 * piece inside `<OfflineDetector>`. Call it before rendering.
 */
export function trackPanResponders() {
  const created: Array<{ config: Config; handlers: Handlers }> = [];
  const real = PanResponder.create.bind(PanResponder);
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    const responder = real(config);
    created.push({ config, handlers: responder.panHandlers });
    return responder;
  });

  /** The closest ancestor of `inside` that carries a recorded pan responder's handlers. */
  function find(inside: TestInstance) {
    let node: TestInstance | null = inside;
    while (node) {
      const current: TestInstance = node;
      const entry = created.find(
        (c) =>
          typeof c.handlers.onResponderRelease === 'function' &&
          c.handlers.onResponderRelease === current.props.onResponderRelease,
      );
      if (entry) return { surface: current, config: entry.config };
      node = current.parent;
    }
    throw new Error('no swipe surface above this element');
  }

  return {
    /** The element that carries the swipe handlers of the piece around `inside`. */
    surfaceOf: (inside: TestInstance) => find(inside).surface,
    /** A fast leftward flick that starts on the surface above `inside`, then lets go. */
    async swipeAway(inside: TestInstance) {
      const { config } = find(inside);
      const event = {} as never;
      const g = gesture({ dx: -300, dy: 0, vx: -1, vy: 0 });
      await act(async () => {
        config.onPanResponderGrant?.(event, g);
        config.onPanResponderMove?.(event, g);
        config.onPanResponderRelease?.(event, g);
      });
    },
  };
}

/**
 * What the user sees of a piece: its container's opacity times the swipe surface's, and the
 * surface's horizontal offset. A piece is visible only when opacity is 1 and the offset is 0.
 */
export function shown(
  container: TestInstance,
  surface: TestInstance,
): { opacity: number; translateX: number } {
  const outer = flatStyle(container.props.style);
  const inner = flatStyle(surface.props.style);
  const opacity = Number(outer.opacity ?? 1) * Number(inner.opacity ?? 1);
  const transform = (inner.transform ?? []) as Array<{ translateX?: number }>;
  const translateX = transform.reduce((sum, t) => sum + Number(t.translateX ?? 0), 0);
  return { opacity, translateX };
}
