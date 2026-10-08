import { fireEvent, render, screen } from '@testing-library/react-native';
import type { GestureResponderEvent, PanResponderGestureState } from 'react-native';
import {
  AccessibilityInfo,
  I18nManager,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import { flatStyle, mockTiming } from './__test-utils__/animated';
import { EN } from './__test-utils__/fixtures';
import { Banner, type BannerProps } from './banner';
import { darkTheme } from './theme';

const HIDDEN = { includeHiddenElements: true };

const base: BannerProps = {
  phase: 'offline',
  message: 'No internet',
  strings: EN,
  onDismiss: jest.fn(),
  onRetry: jest.fn(),
  testID: 'banner',
};

beforeEach(() => {
  mockTiming();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('offline', () => {
  it('shows the message and a dismiss button, and no Retry by default', async () => {
    await render(<Banner {...base} />);
    expect(screen.getByText('No internet')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('adds a Retry text button with action', async () => {
    await render(<Banner {...base} action />);
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(base.onRetry).toHaveBeenCalledTimes(1);
  });

  it('has no Retry for action without a handler', async () => {
    await render(<Banner {...base} action onRetry={undefined} />);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('calls onDismiss from the dismiss button', async () => {
    await render(<Banner {...base} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(base.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('draws the offline glyph in the offline status colour', async () => {
    await render(<Banner {...base} />);
    expect(flatStyle(screen.getByText('⊘', HIDDEN).props.style).color).toBe('#b3261e');
  });

  it('accepts a replacement icon', async () => {
    await render(<Banner {...base} icons={{ offline: <Text>MY-ICON</Text> }} />);
    expect(screen.getByText('MY-ICON')).toBeTruthy();
    expect(screen.queryByText('⊘', HIDDEN)).toBeNull();
  });
});

describe('checking', () => {
  it('swaps the icon for a spinner and leaves the text unchanged', async () => {
    await render(<Banner {...base} phase="checking" />);
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeTruthy();
    expect(screen.queryByText('⊘', HIDDEN)).toBeNull();
    expect(screen.getByText('No internet')).toBeTruthy();
  });

  it('uses a static ellipsis glyph under reduced motion', async () => {
    await render(<Banner {...base} phase="checking" reduceMotion />);
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeNull();
    expect(screen.getByText('…', HIDDEN)).toBeTruthy();
  });

  it('accepts a replacement checking icon', async () => {
    await render(
      <Banner {...base} phase="checking" icons={{ checking: <Text>WAIT</Text> }} />,
    );
    expect(screen.getByText('WAIT')).toBeTruthy();
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeNull();
  });

  it('shows a busy, disabled Retry labelled "Checking…" with action', async () => {
    await render(<Banner {...base} phase="checking" action />);
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true });
    await fireEvent.press(button);
    expect(base.onRetry).not.toHaveBeenCalled();
  });
});

describe('accessibility', () => {
  it('is the polite live region when it owns the announcement', async () => {
    await render(<Banner {...base} />);
    const message = screen.getByTestId('banner-message');
    expect(message.props.accessibilityLiveRegion).toBe('polite');
    expect(message.props.accessibilityLabel).toBeUndefined();
  });

  it('is a silent labelled view when another piece announces', async () => {
    await render(<Banner {...base} announce={false} />);
    const message = screen.getByTestId('banner-message');
    expect(message.props.accessibilityLiveRegion).toBeUndefined();
    expect(message.props.accessibilityLabel).toBe('No internet');
    expect(message.props.accessible).toBe(true);
  });

  it('never uses the alert role', async () => {
    await render(<Banner {...base} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('offers the dismiss action with the hint', async () => {
    await render(<Banner {...base} />);
    const message = screen.getByTestId('banner-message');
    expect(message.props.accessibilityActions).toEqual([
      { name: 'dismiss', label: 'Dismiss' },
    ]);
    expect(message.props.accessibilityHint).toBe('Swipe left or right to dismiss');
    message.props.onAccessibilityAction({ nativeEvent: { actionName: 'dismiss' } });
    expect(base.onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits the action and hint when not dismissible', async () => {
    await render(<Banner {...base} dismissible={false} />);
    const message = screen.getByTestId('banner-message');
    expect(message.props.accessibilityActions).toBeUndefined();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('has 44 point targets', async () => {
    await render(<Banner {...base} action />);
    const retry = flatStyle(screen.getByRole('button', { name: 'Retry' }).props.style);
    const dismiss = flatStyle(
      screen.getByRole('button', { name: 'Dismiss' }).props.style,
    );
    expect([retry.minWidth, retry.minHeight]).toEqual([44, 44]);
    expect([dismiss.width, dismiss.height]).toEqual([44, 44]);
  });

  it('announces on iOS only when it owns the announcement', async () => {
    const original = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation();
    try {
      await render(<Banner {...base} announce={false} />);
      expect(announce).not.toHaveBeenCalled();
      await render(<Banner {...base} />);
      expect(announce).toHaveBeenCalledWith('No internet');
    } finally {
      Platform.OS = original;
    }
  });
});

describe('layout', () => {
  function strip() {
    return flatStyle(screen.getByTestId('banner-message').parent?.props.style);
  }

  it('is a square, flat strip on the offline-subtle surface with a hairline bottom edge', async () => {
    await render(<Banner {...base} />);
    expect(strip()).toMatchObject({
      backgroundColor: '#fdecea',
      borderColor: '#d9dce1',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 0,
      minHeight: 40,
      paddingTop: 8,
      paddingBottom: 8,
      paddingStart: 16,
      paddingEnd: 16,
    });
    expect(strip()).not.toHaveProperty('borderRadius');
    expect(strip()).not.toHaveProperty('shadowOpacity');
  });

  it('adds the top inset and offset above the content', async () => {
    await render(<Banner {...base} insets={{ top: 47 }} offset={10} />);
    expect(strip()).toMatchObject({ paddingTop: 65, minHeight: 97 });
  });

  it('sits at the bottom with a top edge', async () => {
    await render(<Banner {...base} position="bottom" insets={{ bottom: 34 }} />);
    expect(strip()).toMatchObject({
      paddingBottom: 42,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: 0,
    });
  });

  it('uses start and end for the side insets and never left or right', async () => {
    await render(<Banner {...base} insets={{ left: 44, right: 10 }} />);
    expect(strip()).toMatchObject({ paddingStart: 60, paddingEnd: 26 });
    expect(strip()).not.toHaveProperty('paddingLeft');
    expect(strip()).not.toHaveProperty('paddingRight');
  });

  it('swaps the side insets in a right-to-left layout', async () => {
    const original = I18nManager.isRTL;
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    try {
      await render(<Banner {...base} insets={{ left: 44, right: 10 }} />);
      expect(strip()).toMatchObject({ paddingStart: 26, paddingEnd: 60 });
    } finally {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      });
    }
  });

  it('stays in the layout by default (pushes content)', async () => {
    await render(<Banner {...base} />);
    const root = flatStyle(screen.getByTestId('banner').props.style);
    expect(root.position).toBeUndefined();
    expect(root.zIndex).toBe(1000);
  });

  it('floats over content with overlay, pinned to the chosen edge', async () => {
    const view = await render(<Banner {...base} overlay />);
    let root = flatStyle(screen.getByTestId('banner').props.style);
    expect([root.position, root.top, root.bottom]).toEqual(['absolute', 0, undefined]);
    await view.rerender(<Banner {...base} overlay position="bottom" />);
    root = flatStyle(screen.getByTestId('banner').props.style);
    expect([root.position, root.top, root.bottom]).toEqual(['absolute', undefined, 0]);
  });

  it('uses the primary text colour at medium weight and the dark theme when asked', async () => {
    const view = await render(<Banner {...base} />);
    expect(flatStyle(screen.getByText('No internet').props.style)).toMatchObject({
      color: '#1b1f23',
      fontWeight: '500',
      fontSize: 14,
    });
    await view.rerender(<Banner {...base} theme={darkTheme} />);
    expect(flatStyle(screen.getByText('No internet').props.style).color).toBe('#f2f3f5');
    expect(screen.getByText('No internet').props.maxFontSizeMultiplier).toBe(2);
  });
});

describe('visibility', () => {
  it('renders nothing after the exit fade', async () => {
    const view = await render(<Banner {...base} />);
    await view.rerender(<Banner {...base} visible={false} />);
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
    await render(<Banner {...base} />);
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
    await render(<Banner {...base} dismissible={false} />);
    expect(
      config().onMoveShouldSetPanResponder?.(event, {
        dx: 40,
        dy: 0,
      } as PanResponderGestureState),
    ).toBe(false);
  });

  it('renders without a testID', async () => {
    await render(<Banner {...base} testID={undefined} />);
    expect(screen.queryByTestId('anything')).toBeNull();
  });
});
