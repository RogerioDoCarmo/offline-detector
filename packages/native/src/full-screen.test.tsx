import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  AccessibilityInfo,
  BackHandler,
  I18nManager,
  Text,
  findNodeHandle,
} from 'react-native';
import { flatStyle, mockTiming } from './__test-utils__/animated';
import { EN } from './__test-utils__/fixtures';
import {
  FullScreen,
  hostContentAccessibilityProps,
  type FullScreenProps,
} from './full-screen';
import { darkTheme } from './theme';

jest.mock('react-native/Libraries/ReactNative/RendererProxy', () => ({
  ...jest.requireActual('react-native/Libraries/ReactNative/RendererProxy'),
  findNodeHandle: jest.fn(() => 42),
}));
const mockedHandle = findNodeHandle as jest.Mock;

const HIDDEN = { includeHiddenElements: true };

const base: FullScreenProps = {
  phase: 'offline',
  title: 'No internet',
  strings: EN,
  onRetry: jest.fn(),
  testID: 'full',
};

let timing: ReturnType<typeof mockTiming>;
let setFocus: jest.SpyInstance;
beforeEach(() => {
  timing = mockTiming();
  setFocus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('content', () => {
  it('shows the title, the body and the Try again button', async () => {
    await render(<FullScreen {...base} />);
    expect(screen.getByText('No internet')).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('has no Continue offline by default', async () => {
    await render(<FullScreen {...base} />);
    expect(screen.queryByRole('button', { name: 'Continue offline' })).toBeNull();
  });

  it('shows Continue offline and calls its handler', async () => {
    const onContinueOffline = jest.fn();
    await render(<FullScreen {...base} onContinueOffline={onContinueOffline} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue offline' }));
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry from the primary button', async () => {
    await render(<FullScreen {...base} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(base.onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to the retry string when fullScreenRetry is empty', async () => {
    await render(<FullScreen {...base} strings={{ ...EN, fullScreenRetry: '' }} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('shows a reason-aware title', async () => {
    await render(<FullScreen {...base} title="Connected, but no internet" />);
    expect(screen.getByRole('header').props.children).toBe('Connected, but no internet');
  });

  it('draws the large offline glyph in the status colour, or a replacement', async () => {
    const view = await render(<FullScreen {...base} />);
    const glyph = screen.getByText('⊘', HIDDEN);
    expect(flatStyle(glyph.props.style)).toMatchObject({
      fontSize: 48,
      color: '#b3261e',
    });
    await view.rerender(<FullScreen {...base} icons={{ offline: <Text>BIG</Text> }} />);
    expect(screen.getByText('BIG')).toBeTruthy();
    expect(screen.queryByText('⊘', HIDDEN)).toBeNull();
  });
});

describe('checking', () => {
  it('turns the primary button into a busy, disabled "Checking…"', async () => {
    await render(<FullScreen {...base} phase="checking" />);
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button.props.accessibilityState).toEqual({ busy: true, disabled: true });
    await fireEvent.press(button);
    expect(base.onRetry).not.toHaveBeenCalled();
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeTruthy();
  });

  it('shows no spinner under reduced motion', async () => {
    await render(<FullScreen {...base} phase="checking" reduceMotion />);
    expect(screen.queryByTestId('od-spinner', HIDDEN)).toBeNull();
    expect(screen.getByText('Checking…')).toBeTruthy();
  });

  it('keeps the title and body while checking', async () => {
    await render(<FullScreen {...base} phase="checking" />);
    expect(screen.getByText('No internet')).toBeTruthy();
    expect(screen.getByText('Check your connection and try again.')).toBeTruthy();
  });
});

describe('accessibility', () => {
  it('makes the title a header and does not use a live region or the alert role', async () => {
    await render(<FullScreen {...base} />);
    expect(screen.getByRole('header')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('full').props.accessibilityLiveRegion).toBeUndefined();
  });

  it('is modal to iOS screen readers', async () => {
    await render(<FullScreen {...base} />);
    expect(screen.getByTestId('full').props.accessibilityViewIsModal).toBe(true);
  });

  it('moves screen reader focus to the title on the next frame', async () => {
    jest.useFakeTimers();
    await render(<FullScreen {...base} />);
    expect(setFocus).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(32);
    });
    expect(setFocus).toHaveBeenCalledTimes(1);
    expect(setFocus).toHaveBeenCalledWith(42);
  });

  it('skips the focus move when the title has no native node', async () => {
    jest.useFakeTimers();
    mockedHandle.mockReturnValueOnce(null);
    await render(<FullScreen {...base} />);
    await act(async () => {
      jest.advanceTimersByTime(32);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('does not move focus when it unmounts before the frame', async () => {
    jest.useFakeTimers();
    const view = await render(<FullScreen {...base} />);
    await view.unmount();
    await act(async () => {
      jest.advanceTimersByTime(32);
    });
    expect(setFocus).not.toHaveBeenCalled();
  });

  it('has 44 point targets', async () => {
    await render(<FullScreen {...base} onContinueOffline={jest.fn()} />);
    const primary = flatStyle(
      screen.getByRole('button', { name: 'Try again' }).props.style,
    );
    const secondary = flatStyle(
      screen.getByRole('button', { name: 'Continue offline' }).props.style,
    );
    expect(primary.minHeight).toBe(44);
    expect(secondary.minHeight).toBe(44);
  });

  it('does not cap font scaling on its text', async () => {
    await render(<FullScreen {...base} />);
    expect(screen.getByText('No internet').props.maxFontSizeMultiplier).toBeUndefined();
    expect(
      screen.getByText('Check your connection and try again.').props
        .maxFontSizeMultiplier,
    ).toBeUndefined();
  });
});

describe('focus restoration', () => {
  it('calls onRestoreFocus when it leaves', async () => {
    const onRestoreFocus = jest.fn();
    const view = await render(<FullScreen {...base} onRestoreFocus={onRestoreFocus} />);
    expect(onRestoreFocus).not.toHaveBeenCalled();
    await view.rerender(
      <FullScreen {...base} onRestoreFocus={onRestoreFocus} visible={false} />,
    );
    expect(onRestoreFocus).toHaveBeenCalledTimes(1);
  });

  it('calls onRestoreFocus on unmount', async () => {
    const onRestoreFocus = jest.fn();
    const view = await render(<FullScreen {...base} onRestoreFocus={onRestoreFocus} />);
    await view.unmount();
    expect(onRestoreFocus).toHaveBeenCalledTimes(1);
  });

  it('is fine without onRestoreFocus', async () => {
    const view = await render(<FullScreen {...base} />);
    await view.unmount();
  });
});

describe('hardware back button', () => {
  function stubBack() {
    const remove = jest.fn();
    let handler: (() => boolean | null | undefined) | undefined;
    const add = jest.spyOn(BackHandler, 'addEventListener').mockImplementation(((
      _event: string,
      h: () => boolean,
    ) => {
      handler = h;
      return { remove };
    }) as unknown as typeof BackHandler.addEventListener);
    return { add, remove, press: () => handler?.() };
  }

  it('acts as Continue offline and consumes the event', async () => {
    const back = stubBack();
    const onContinueOffline = jest.fn();
    await render(<FullScreen {...base} onContinueOffline={onContinueOffline} />);
    expect(back.add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    expect(back.press()).toBe(true);
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
  });

  it('is left to the host without Continue offline', async () => {
    const back = stubBack();
    await render(<FullScreen {...base} />);
    expect(back.add).not.toHaveBeenCalled();
  });

  it('stops listening on unmount', async () => {
    const back = stubBack();
    const view = await render(<FullScreen {...base} onContinueOffline={jest.fn()} />);
    await view.unmount();
    expect(back.remove).toHaveBeenCalledTimes(1);
  });

  it('does not listen while hidden', async () => {
    const back = stubBack();
    await render(<FullScreen {...base} onContinueOffline={jest.fn()} visible={false} />);
    expect(back.add).not.toHaveBeenCalled();
  });
});

describe('layout', () => {
  it('is an opaque surface filling the window above the other pieces', async () => {
    await render(<FullScreen {...base} />);
    expect(flatStyle(screen.getByTestId('full').props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      backgroundColor: '#ffffff',
      zIndex: 1100,
    });
  });

  it('is dark in the dark theme', async () => {
    await render(<FullScreen {...base} theme={darkTheme} />);
    expect(flatStyle(screen.getByTestId('full').props.style).backgroundColor).toBe(
      '#1c1c1e',
    );
  });

  it('fades in over 320 ms with no movement', async () => {
    await render(<FullScreen {...base} />);
    expect(timing.calls.map((c) => [c.config.toValue, c.config.duration])).toEqual([
      [1, 320],
      [0, 320],
    ]);
    expect(timing.calls[1]?.from).toBe(0);
  });

  it('fades in over 120 ms under reduced motion', async () => {
    await render(<FullScreen {...base} reduceMotion />);
    expect(timing.calls[0]?.config.duration).toBe(120);
  });

  it('typesets the title and body from the tokens', async () => {
    await render(<FullScreen {...base} />);
    expect(flatStyle(screen.getByText('No internet').props.style)).toMatchObject({
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600',
      color: '#1b1f23',
    });
    expect(
      flatStyle(screen.getByText('Check your connection and try again.').props.style),
    ).toMatchObject({
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      color: '#545b64',
    });
  });

  it('styles the primary button as a solid action and the secondary as text', async () => {
    await render(<FullScreen {...base} onContinueOffline={jest.fn()} />);
    expect(
      flatStyle(screen.getByRole('button', { name: 'Try again' }).props.style),
    ).toMatchObject({ backgroundColor: '#0b5fd1', borderRadius: 8 });
    expect(flatStyle(screen.getByText('Try again').props.style).color).toBe('#ffffff');
    expect(flatStyle(screen.getByText('Continue offline').props.style).color).toBe(
      '#0b5fd1',
    );
  });

  it('pads by 24 plus the insets, using start and end', async () => {
    await render(
      <FullScreen {...base} insets={{ top: 47, bottom: 34, left: 44, right: 10 }} />,
    );
    expect(flatStyle(screen.getByTestId('full-content').props.style)).toMatchObject({
      paddingTop: 71,
      paddingBottom: 58,
      paddingStart: 68,
      paddingEnd: 34,
    });
  });

  it('renders nothing after the exit fade', async () => {
    const view = await render(<FullScreen {...base} />);
    await view.rerender(<FullScreen {...base} visible={false} />);
    expect(screen.queryByText('No internet')).toBeNull();
  });

  it('swaps side insets in a right-to-left layout without error', async () => {
    const original = I18nManager.isRTL;
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    try {
      await render(<FullScreen {...base} insets={{ left: 44, right: 10 }} />);
      expect(screen.getByText('No internet')).toBeTruthy();
    } finally {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      });
    }
  });
});

describe('hostContentAccessibilityProps', () => {
  it('hides the host content from assistive technology while visible', () => {
    expect(hostContentAccessibilityProps(true)).toEqual({
      importantForAccessibility: 'no-hide-descendants',
      accessibilityElementsHidden: true,
    });
  });

  it('leaves the host content alone otherwise', () => {
    expect(hostContentAccessibilityProps(false)).toEqual({
      importantForAccessibility: 'auto',
      accessibilityElementsHidden: false,
    });
  });
});

it('renders without a testID', async () => {
  await render(<FullScreen {...base} testID={undefined} />);
  expect(screen.getByText('No internet')).toBeTruthy();
});
