import { renderHook } from '@testing-library/react-native';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponderGestureState,
} from 'react-native';
import { PanResponder } from 'react-native';
import { mockTiming, valueOf } from './__test-utils__/animated';
import { useSwipeDismiss } from './use-swipe-dismiss';

type Config = Parameters<typeof PanResponder.create>[0];

const event = {} as GestureResponderEvent;
const gesture = (g: Partial<PanResponderGestureState>) => g as PanResponderGestureState;

afterEach(() => jest.restoreAllMocks());

async function setup(
  options: { enabled?: boolean; reducedMotion?: boolean; width?: number | null } = {},
) {
  const create = jest.spyOn(PanResponder, 'create');
  const timing = mockTiming();
  const onDismiss = jest.fn();
  const hook = await renderHook(() =>
    useSwipeDismiss({
      enabled: options.enabled ?? true,
      reducedMotion: options.reducedMotion ?? false,
      onDismiss,
    }),
  );
  const config = create.mock.calls[0]?.[0] as Config;
  if (options.width !== null) {
    hook.result.current.onLayout({
      nativeEvent: { layout: { width: options.width ?? 200, height: 48, x: 0, y: 0 } },
    } as LayoutChangeEvent);
  }
  const translateX = () => valueOf(hook.result.current.style.transform[0].translateX);
  const opacity = () => valueOf(hook.result.current.style.opacity);
  return { config, hook, onDismiss, timing, translateX, opacity };
}

describe('axis lock', () => {
  it.each([
    [7, 0, false],
    [8, 0, true],
    [-7, 0, false],
    [-8, 0, true],
    [8, 8, false],
    [8, 7, true],
    [8, 20, false],
    [0, 30, false],
    [3, 3, false],
  ])('dx %p dy %p locks horizontally: %p', async (dx, dy, expected) => {
    const { config } = await setup();
    expect(config.onMoveShouldSetPanResponder?.(event, gesture({ dx, dy }))).toBe(
      expected,
    );
  });

  it('never claims the gesture when disabled', async () => {
    const { config } = await setup({ enabled: false });
    expect(config.onMoveShouldSetPanResponder?.(event, gesture({ dx: 100, dy: 0 }))).toBe(
      false,
    );
  });

  it('leaves taps to the buttons inside the piece', async () => {
    const { config } = await setup();
    expect(config.onStartShouldSetPanResponder?.(event, gesture({}))).toBe(false);
  });
});

describe('release distance (width 200)', () => {
  it('springs back at 29 percent', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 58, dy: 0, vx: 0 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses at 30 percent', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 60, dy: 0, vx: 0 }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses at 30 percent to the left too', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: -60, dy: 0, vx: 0 }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('springs back at 29 percent to the left', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: -58, dy: 0, vx: 0 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('release speed', () => {
  it('springs back at 0.49 px/ms', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 10, dy: 0, vx: 0.49 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses at 0.5 px/ms', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 10, dy: 0, vx: 0.5 }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses a fast fling to the left', async () => {
    const { config, onDismiss, timing } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: -10, dy: 0, vx: -0.5 }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(timing.calls[0]?.config.toValue).toBe(-200);
  });

  it('does not dismiss a fast fling back towards where the drag started', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 30, dy: 0, vx: -0.9 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ignores speed when nothing has moved horizontally', async () => {
    const { config, onDismiss } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 0, dy: 0, vx: 0.9 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('before the width is measured', () => {
  it('does not treat any movement as past 30 percent', async () => {
    const { config, onDismiss } = await setup({ width: null });
    config.onPanResponderRelease?.(event, gesture({ dx: 5, dy: 0, vx: 0.1 }));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('still dismisses on speed, sliding out by a fallback distance', async () => {
    const { config, onDismiss, timing } = await setup({ width: null });
    config.onPanResponderRelease?.(event, gesture({ dx: 5, dy: 0, vx: 0.6 }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(timing.calls[0]?.config.toValue).toBe(400);
  });

  it('does not change opacity while dragging', async () => {
    const { config, opacity } = await setup({ width: null });
    config.onPanResponderMove?.(event, gesture({ dx: 40, dy: 0 }));
    expect(opacity()).toBe(1);
  });
});

describe('dragging', () => {
  it('follows the finger and fades with the distance', async () => {
    const { config, translateX, opacity } = await setup();
    config.onPanResponderMove?.(event, gesture({ dx: 40, dy: 0 }));
    expect(translateX()).toBe(40);
    expect(opacity()).toBe(0.8);
    config.onPanResponderMove?.(event, gesture({ dx: -100, dy: 0 }));
    expect(translateX()).toBe(-100);
    expect(opacity()).toBe(0.5);
  });

  it('never fades below zero past the full width', async () => {
    const { config, opacity } = await setup();
    config.onPanResponderMove?.(event, gesture({ dx: 500, dy: 0 }));
    expect(opacity()).toBe(0);
  });

  it('can be granted without a running animation', async () => {
    const { config } = await setup();
    expect(() => config.onPanResponderGrant?.(event, gesture({}))).not.toThrow();
  });
});

describe('animations', () => {
  it('slides out over 150 ms in the swipe direction on the native driver, then reports', async () => {
    const { config, onDismiss, timing } = await setup();
    config.onPanResponderRelease?.(event, gesture({ dx: 80, dy: 0, vx: 0 }));
    expect(
      timing.calls.map((c) => [
        c.config.toValue,
        c.config.duration,
        c.config.useNativeDriver,
      ]),
    ).toEqual([
      [200, 150, true],
      [0, 150, true],
    ]);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('springs back over 200 ms on the native driver', async () => {
    const { config, timing, translateX, opacity } = await setup();
    config.onPanResponderMove?.(event, gesture({ dx: 40, dy: 0 }));
    config.onPanResponderRelease?.(event, gesture({ dx: 40, dy: 0, vx: 0 }));
    expect(
      timing.calls.map((c) => [
        c.config.toValue,
        c.config.duration,
        c.config.useNativeDriver,
      ]),
    ).toEqual([
      [0, 200, true],
      [1, 200, true],
    ]);
    expect(translateX()).toBe(0);
    expect(opacity()).toBe(1);
  });

  it('springs back when the gesture is terminated', async () => {
    const { config, timing, onDismiss } = await setup();
    config.onPanResponderTerminate?.(event, gesture({ dx: 100, dy: 0, vx: 1 }));
    expect(timing.calls.map((c) => c.config.toValue)).toEqual([0, 1]);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

describe('reduced motion', () => {
  it('fades out at once with no slide', async () => {
    const { config, onDismiss, timing, opacity, translateX } = await setup({
      reducedMotion: true,
    });
    config.onPanResponderMove?.(event, gesture({ dx: 80, dy: 0 }));
    config.onPanResponderRelease?.(event, gesture({ dx: 80, dy: 0, vx: 0 }));
    expect(timing.calls).toEqual([]);
    expect(opacity()).toBe(0);
    expect(translateX()).toBe(80);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('snaps back without animating', async () => {
    const { config, timing, opacity, translateX } = await setup({ reducedMotion: true });
    config.onPanResponderMove?.(event, gesture({ dx: 40, dy: 0 }));
    config.onPanResponderRelease?.(event, gesture({ dx: 40, dy: 0, vx: 0 }));
    expect(timing.calls).toEqual([]);
    expect(translateX()).toBe(0);
    expect(opacity()).toBe(1);
  });
});

it('exposes the responder handlers to spread on the piece', async () => {
  const { hook } = await setup();
  expect(Object.keys(hook.result.current.panHandlers).sort()).toEqual(
    expect.arrayContaining([
      'onMoveShouldSetResponder',
      'onResponderGrant',
      'onResponderMove',
      'onResponderRelease',
      'onResponderTerminate',
    ]),
  );
});
