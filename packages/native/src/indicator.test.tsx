import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { Animated, I18nManager, PanResponder } from 'react-native';
import { flatStyle, mockTiming } from './__test-utils__/animated';
import { EN } from './__test-utils__/fixtures';
import { DOT_LABEL_MS, Indicator, type IndicatorProps } from './indicator';
import { darkTheme } from './theme';

const HIDDEN = { includeHiddenElements: true };

const base: IndicatorProps = {
  phase: 'offline',
  strings: EN,
  onDismiss: jest.fn(),
  testID: 'indicator',
};

let loop: { start: jest.Mock; stop: jest.Mock };
beforeEach(() => {
  mockTiming();
  loop = { start: jest.fn(), stop: jest.fn() };
  jest
    .spyOn(Animated, 'loop')
    .mockReturnValue(loop as unknown as Animated.CompositeAnimation);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function body() {
  return screen.getByTestId('indicator-body');
}

describe('chip (default)', () => {
  it.each([
    ['offline', 'No internet', 'Connection status: No internet', '/'],
    ['checking', 'Checking connection', 'Connection status: Checking connection', 'o'],
    ['recovered', 'Online', 'Connection status: Online', '✓'],
  ] as const)(
    '%s shows %p with the name %p and a %p glyph',
    async (phase, label, name, glyph) => {
      await render(<Indicator {...base} phase={phase} />);
      expect(screen.getByText(label)).toBeTruthy();
      expect(body().props.accessibilityLabel).toBe(name);
      expect(screen.getByText(glyph, HIDDEN)).toBeTruthy();
    },
  );

  it('is an accessible image whose name contains the visible label', async () => {
    await render(<Indicator {...base} />);
    expect(body().props.accessible).toBe(true);
    expect(body().props.accessibilityRole).toBe('image');
  });

  it('is never a live region or an alert', async () => {
    await render(<Indicator {...base} />);
    expect(body().props.accessibilityLiveRegion).toBeUndefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('is a raised pill with a 1 point border and the chip shadow', async () => {
    await render(<Indicator {...base} />);
    expect(flatStyle(body().props.style)).toMatchObject({
      backgroundColor: '#f4f5f7',
      borderColor: '#80878f',
      borderWidth: 1,
      borderRadius: 999,
      minHeight: 28,
      paddingVertical: 4,
      paddingHorizontal: 12,
      shadowOpacity: 0.2,
      elevation: 2,
    });
  });

  it('labels in semibold 12 with the text colour and caps font scaling at 2', async () => {
    await render(<Indicator {...base} />);
    const label = screen.getByText('No internet');
    expect(flatStyle(label.props.style)).toMatchObject({
      color: '#1b1f23',
      fontSize: 12,
      fontWeight: '600',
      marginStart: 8,
    });
    expect(label.props.maxFontSizeMultiplier).toBe(2);
  });

  it('follows the dark theme', async () => {
    await render(<Indicator {...base} theme={darkTheme} />);
    expect(flatStyle(body().props.style).backgroundColor).toBe('#2c2c2e');
  });
});

describe('dot', () => {
  it('is a pressable image named for the status, with no visible label at rest', async () => {
    await render(<Indicator {...base} variant="dot" />);
    expect(body().props.accessibilityRole).toBe('image');
    expect(body().props.accessibilityLabel).toBe('Connection status: No internet');
    expect(screen.queryByText('No internet', HIDDEN)).toBeNull();
  });

  it('reaches a 44 point hit area around the 14 point dot', async () => {
    await render(<Indicator {...base} variant="dot" />);
    expect(body().props.hitSlop).toBe(15);
  });

  it('draws the 14 point dot in the status colour with a 1 point surface ring', async () => {
    await render(<Indicator {...base} variant="dot" />);
    const dot = screen.getByText('/', HIDDEN).parent?.parent;
    expect(flatStyle(dot?.props.style)).toMatchObject({
      width: 14,
      height: 14,
      borderRadius: 999,
      backgroundColor: '#b3261e',
      borderColor: '#ffffff',
      borderWidth: 1,
    });
  });

  it('shows the label for two seconds when pressed', async () => {
    jest.useFakeTimers();
    await render(<Indicator {...base} variant="dot" />);
    await fireEvent.press(body());
    expect(screen.getByText('No internet', HIDDEN)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(DOT_LABEL_MS - 1);
    });
    expect(screen.queryByText('No internet', HIDDEN)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('No internet', HIDDEN)).toBeNull();
    expect(DOT_LABEL_MS).toBe(2000);
  });

  it('restarts the two seconds when pressed again', async () => {
    jest.useFakeTimers();
    await render(<Indicator {...base} variant="dot" />);
    await fireEvent.press(body());
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await fireEvent.press(body());
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('No internet', HIDDEN)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('No internet', HIDDEN)).toBeNull();
  });

  it('hides the pressed label from assistive technology (the name already says it)', async () => {
    await render(<Indicator {...base} variant="dot" />);
    await fireEvent.press(body());
    expect(
      screen.getByText('No internet', HIDDEN).props.accessibilityElementsHidden,
    ).toBe(true);
  });

  it('clears its timer on unmount', async () => {
    jest.useFakeTimers();
    const view = await render(<Indicator {...base} variant="dot" />);
    await fireEvent.press(body());
    const clear = jest.spyOn(globalThis, 'clearTimeout');
    clear.mockClear();
    await view.unmount();
    expect(clear).toHaveBeenCalled();
  });
});

describe('checking pulse', () => {
  it('loops a 1200 ms pulse while checking', async () => {
    const timing = mockTiming();
    await render(<Indicator {...base} phase="checking" variant="dot" />);
    expect(loop.start).toHaveBeenCalledTimes(1);
    const pulse = timing.calls.filter(
      (c) => c.config.useNativeDriver && c.config.duration === 600,
    );
    expect(pulse.map((c) => c.config.toValue)).toEqual([0.4, 1]);
  });

  it('stops the loop on unmount', async () => {
    const view = await render(<Indicator {...base} phase="checking" variant="dot" />);
    await view.unmount();
    expect(loop.stop).toHaveBeenCalledTimes(1);
  });

  it('does not pulse when offline or recovered', async () => {
    await render(<Indicator {...base} phase="offline" variant="dot" />);
    await render(<Indicator {...base} phase="recovered" variant="dot" />);
    expect(loop.start).not.toHaveBeenCalled();
  });

  it('keeps a static ring under reduced motion', async () => {
    await render(<Indicator {...base} phase="checking" variant="dot" reduceMotion />);
    expect(loop.start).not.toHaveBeenCalled();
  });
});

describe('dismissal', () => {
  it.each(['chip', 'dot'] as const)(
    '%s offers the dismiss action and hint',
    async (variant) => {
      await render(<Indicator {...base} variant={variant} />);
      expect(body().props.accessibilityActions).toEqual([
        { name: 'dismiss', label: 'Dismiss' },
      ]);
      expect(body().props.accessibilityHint).toBe('Swipe left or right to dismiss');
      body().props.onAccessibilityAction({ nativeEvent: { actionName: 'other' } });
      expect(base.onDismiss).not.toHaveBeenCalled();
      body().props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
      expect(base.onDismiss).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['chip', 'dot'] as const)(
    '%s has no action when not dismissible',
    async (variant) => {
      await render(<Indicator {...base} variant={variant} dismissible={false} />);
      expect(body().props.accessibilityActions).toBeUndefined();
      expect(body().props.accessibilityHint).toBeUndefined();
    },
  );

  it('has no action without a handler', async () => {
    await render(<Indicator {...base} onDismiss={undefined} />);
    expect(body().props.accessibilityActions).toBeUndefined();
  });
});

describe('position', () => {
  function container() {
    return flatStyle(screen.getByTestId('indicator').props.style);
  }

  it('defaults to top-end, 16 from the edges', async () => {
    await render(<Indicator {...base} />);
    expect(container()).toMatchObject({
      position: 'absolute',
      top: 16,
      end: 16,
      zIndex: 1010,
    });
    expect(container()).not.toHaveProperty('start');
    expect(container()).not.toHaveProperty('bottom');
  });

  it('places top-start', async () => {
    await render(<Indicator {...base} position="top-start" />);
    expect(container()).toMatchObject({ top: 16, start: 16 });
    expect(container()).not.toHaveProperty('end');
  });

  it('places bottom-end and bottom-start', async () => {
    const view = await render(<Indicator {...base} position="bottom-end" />);
    expect(container()).toMatchObject({ bottom: 16, end: 16 });
    await view.rerender(<Indicator {...base} position="bottom-start" />);
    expect(container()).toMatchObject({ bottom: 16, start: 16 });
    expect(container()).not.toHaveProperty('top');
  });

  it('adds insets and offsets on the anchored edges', async () => {
    const view = await render(
      <Indicator
        {...base}
        position="top-end"
        insets={{ top: 47, right: 10, bottom: 34, left: 44 }}
        offsetTop={40}
        offsetBottom={56}
      />,
    );
    expect(container()).toMatchObject({ top: 103, end: 26 });
    await view.rerender(
      <Indicator
        {...base}
        position="bottom-start"
        insets={{ top: 47, right: 10, bottom: 34, left: 44 }}
        offsetTop={40}
        offsetBottom={56}
      />,
    );
    expect(container()).toMatchObject({ bottom: 106, start: 60 });
  });

  it('swaps side insets in a right-to-left layout', async () => {
    const original = I18nManager.isRTL;
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    try {
      await render(
        <Indicator {...base} position="top-start" insets={{ left: 44, right: 10 }} />,
      );
      expect(container()).toMatchObject({ start: 26 });
    } finally {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('visibility', () => {
  it('renders nothing after the exit fade', async () => {
    const view = await render(<Indicator {...base} />);
    await view.rerender(<Indicator {...base} visible={false} />);
    expect(screen.queryByText('No internet')).toBeNull();
  });
});

describe('swipe wiring', () => {
  function gestureConfig() {
    const create = jest.spyOn(PanResponder, 'create');
    return () => create.mock.calls[0]?.[0] as Parameters<typeof PanResponder.create>[0];
  }
  const event = {} as GestureResponderEvent;
  const fling = { dx: 10, dy: 0, vx: 0.9 } as PanResponderGestureState;

  it('dismisses through a fast horizontal swipe', async () => {
    const config = gestureConfig();
    await render(<Indicator {...base} />);
    expect(
      config().onMoveShouldSetPanResponder?.(event, {
        dx: 8,
        dy: 0,
      } as PanResponderGestureState),
    ).toBe(true);
    config().onPanResponderRelease?.(event, fling);
    expect(base.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not claim swipes when not dismissible', async () => {
    const config = gestureConfig();
    await render(<Indicator {...base} dismissible={false} />);
    expect(
      config().onMoveShouldSetPanResponder?.(event, {
        dx: 40,
        dy: 0,
      } as PanResponderGestureState),
    ).toBe(false);
  });

  it('renders without a testID', async () => {
    await render(<Indicator {...base} testID={undefined} />);
    expect(screen.queryByTestId('anything')).toBeNull();
  });
});
