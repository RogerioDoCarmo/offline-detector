import { fireEvent, render, screen } from '@testing-library/react-native';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';
import {
  AccessibilityInfo,
  I18nManager,
  PanResponder,
  Platform,
  Text,
} from 'react-native';
import { flatStyle, mockTiming } from './__test-utils__/animated';
import { EN } from './__test-utils__/fixtures';
import { Snackbar, type SnackbarProps } from './snackbar';
import { darkTheme } from './theme';

const HIDDEN = { includeHiddenElements: true };

const base: SnackbarProps = {
  phase: 'offline',
  message: 'No internet',
  strings: EN,
  onRetry: jest.fn(),
  onDismiss: jest.fn(),
  testID: 'snackbar',
};

beforeEach(() => {
  mockTiming();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('offline', () => {
  it('shows the message, Retry and a dismiss button', async () => {
    await render(<Snackbar {...base} />);
    expect(screen.getByText('No internet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });

  it('calls onRetry when Retry is pressed', async () => {
    await render(<Snackbar {...base} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(base.onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when the dismiss button is pressed', async () => {
    await render(<Snackbar {...base} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(base.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no Retry without a handler', async () => {
    await render(<Snackbar {...base} onRetry={undefined} />);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

describe('accessibility', () => {
  it('announces politely, never assertively', async () => {
    await render(<Snackbar {...base} />);
    expect(screen.getByTestId('snackbar-message').props.accessibilityLiveRegion).toBe(
      'polite',
    );
  });

  it('does not use the alert role anywhere', async () => {
    await render(<Snackbar {...base} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('turns the live region off when another piece owns the announcement', async () => {
    await render(<Snackbar {...base} announce={false} />);
    expect(screen.getByTestId('snackbar-message').props.accessibilityLiveRegion).toBe(
      'none',
    );
  });

  it('offers the dismiss action with the dismiss hint on the message element', async () => {
    await render(<Snackbar {...base} />);
    const message = screen.getByTestId('snackbar-message');
    expect(message.props.accessible).toBe(true);
    expect(message.props.accessibilityActions).toEqual([
      { name: 'dismiss', label: 'Dismiss' },
    ]);
    expect(message.props.accessibilityHint).toBe('Swipe left or right to dismiss');
  });

  it('runs onDismiss for the dismiss accessibility action only', async () => {
    await render(<Snackbar {...base} />);
    const message = screen.getByTestId('snackbar-message');
    message.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    expect(base.onDismiss).not.toHaveBeenCalled();
    message.props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
    expect(base.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('gives every interactive element a 44 point target', async () => {
    await render(<Snackbar {...base} />);
    const retry = flatStyle(screen.getByRole('button', { name: 'Retry' }).props.style);
    const dismiss = flatStyle(
      screen.getByRole('button', { name: 'Dismiss' }).props.style,
    );
    expect([retry.minWidth, retry.minHeight]).toEqual([44, 44]);
    expect([dismiss.width, dismiss.height]).toEqual([44, 44]);
    expect(dismiss.marginStart).toBe(8);
  });

  it('hides the decorative glyphs from assistive technology', async () => {
    await render(<Snackbar {...base} />);
    const glyph = screen.getByText('⊘', HIDDEN);
    expect(glyph.props.accessible).toBe(false);
    expect(glyph.props.accessibilityElementsHidden).toBe(true);
  });

  it('announces on iOS through announceForAccessibility, once per message', async () => {
    const original = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
    try {
      const view = await render(<Snackbar {...base} />);
      expect(announce).toHaveBeenCalledWith('No internet');
      await view.rerender(<Snackbar {...base} />);
      expect(announce).toHaveBeenCalledTimes(1);
      await view.rerender(<Snackbar {...base} phase="recovered" message="Back online" />);
      expect(announce).toHaveBeenLastCalledWith('Back online');
    } finally {
      Platform.OS = original;
    }
  });

  it('does not call announceForAccessibility on Android (the live region speaks)', async () => {
    const original = Platform.OS;
    Platform.OS = 'android';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
    try {
      await render(<Snackbar {...base} />);
      expect(announce).not.toHaveBeenCalled();
    } finally {
      Platform.OS = original;
    }
  });

  it('does not announce on iOS when another piece owns the announcement', async () => {
    const original = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
    try {
      await render(<Snackbar {...base} announce={false} />);
      expect(announce).not.toHaveBeenCalled();
    } finally {
      Platform.OS = original;
    }
  });
});

describe('checking', () => {
  it('turns Retry into a busy, disabled "Checking…"', async () => {
    await render(<Snackbar {...base} phase="checking" />);
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true });
    expect(screen.queryByText('Retry')).toBeNull();
    expect(screen.getByText('Checking…')).toBeTruthy();
  });

  it('ignores presses while checking', async () => {
    await render(<Snackbar {...base} phase="checking" />);
    await fireEvent.press(screen.getByRole('button', { name: 'Checking…' }));
    expect(base.onRetry).not.toHaveBeenCalled();
  });

  it('shows a spinner, and none under reduced motion', async () => {
    const view = await render(<Snackbar {...base} phase="checking" />);
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeTruthy();
    await view.rerender(<Snackbar {...base} phase="checking" reduceMotion />);
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeNull();
  });

  it('keeps the offline message and idle Retry label when not checking', async () => {
    await render(<Snackbar {...base} phase="offline" />);
    expect(
      screen.getByRole('button', { name: 'Retry' }).props.accessibilityState,
    ).toEqual({
      busy: false,
      disabled: false,
    });
  });
});

describe('recovered', () => {
  it('shows the recovery message with a tick and no Retry', async () => {
    await render(<Snackbar {...base} phase="recovered" message="Back online" />);
    expect(screen.getByText('Back online')).toBeTruthy();
    expect(screen.getByText('✓', HIDDEN)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});

describe('dismissible', () => {
  it('has no dismiss button, hint or action when dismissible is false', async () => {
    await render(<Snackbar {...base} dismissible={false} />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    const message = screen.getByTestId('snackbar-message');
    expect(message.props.accessibilityActions).toBeUndefined();
    expect(message.props.accessibilityHint).toBeUndefined();
  });

  it('is not dismissible without an onDismiss handler', async () => {
    await render(<Snackbar {...base} onDismiss={undefined} />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });
});

describe('layout', () => {
  it('sits 16 above the bottom edge plus inset and offset', async () => {
    await render(<Snackbar {...base} insets={{ bottom: 34 }} offsetBottom={10} />);
    const style = flatStyle(screen.getByTestId('snackbar').props.style);
    expect(style.bottom).toBe(60);
    expect(style.zIndex).toBe(1020);
    expect(style.position).toBe('absolute');
  });

  it('keeps a 16 gutter plus the side insets, using start and end', async () => {
    await render(<Snackbar {...base} insets={{ left: 44, right: 10 }} />);
    const style = flatStyle(screen.getByTestId('snackbar').props.style);
    expect(style.paddingStart).toBe(60);
    expect(style.paddingEnd).toBe(26);
    expect(style).not.toHaveProperty('left');
    expect(style).not.toHaveProperty('right');
  });

  it('swaps the side insets in a right-to-left layout', async () => {
    const original = I18nManager.isRTL;
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    try {
      await render(<Snackbar {...base} insets={{ left: 44, right: 10 }} />);
      const style = flatStyle(screen.getByTestId('snackbar').props.style);
      expect(style.paddingStart).toBe(26);
      expect(style.paddingEnd).toBe(60);
    } finally {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      });
    }
  });

  it('uses the inverse surface and caps the width at 560', async () => {
    await render(<Snackbar {...base} />);
    const surface = flatStyle(screen.getByTestId('snackbar-message').parent?.props.style);
    expect(surface.backgroundColor).toBe('#1f2328');
    expect(surface.maxWidth).toBe(560);
    expect(surface.minHeight).toBe(48);
    expect(surface.borderRadius).toBe(8);
  });

  it('follows the dark theme', async () => {
    await render(<Snackbar {...base} theme={darkTheme} />);
    const surface = flatStyle(screen.getByTestId('snackbar-message').parent?.props.style);
    expect(surface.backgroundColor).toBe('#f2f3f5');
  });

  it('wraps long text with a font scale cap of 2', async () => {
    await render(<Snackbar {...base} message="A very long translated message" />);
    const text = screen.getByText('A very long translated message');
    expect(text.props.maxFontSizeMultiplier).toBe(2);
    expect(text.props.numberOfLines).toBeUndefined();
  });

  it('accepts replacement icons', async () => {
    await render(
      <Snackbar
        {...base}
        icons={{ offline: <Text>OFFLINE-ICON</Text>, online: <Text>ONLINE-ICON</Text> }}
      />,
    );
    expect(screen.getByText('OFFLINE-ICON')).toBeTruthy();
    expect(screen.queryByText('⊘', HIDDEN)).toBeNull();
  });

  it('accepts a replacement recovery icon', async () => {
    await render(
      <Snackbar
        {...base}
        phase="recovered"
        icons={{ offline: <Text>OFFLINE-ICON</Text>, online: <Text>ONLINE-ICON</Text> }}
      />,
    );
    expect(screen.getByText('ONLINE-ICON')).toBeTruthy();
  });
});

describe('visibility', () => {
  it('renders nothing once the exit animation finishes', async () => {
    const view = await render(<Snackbar {...base} />);
    await view.rerender(<Snackbar {...base} visible={false} />);
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
    await render(<Snackbar {...base} />);
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
    await render(<Snackbar {...base} dismissible={false} />);
    expect(
      config().onMoveShouldSetPanResponder?.(event, {
        dx: 40,
        dy: 0,
      } as PanResponderGestureState),
    ).toBe(false);
  });

  it('renders without a testID', async () => {
    await render(<Snackbar {...base} testID={undefined} />);
    expect(screen.queryByTestId('anything')).toBeNull();
  });
});
