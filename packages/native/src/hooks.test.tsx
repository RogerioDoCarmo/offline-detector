import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { mockTiming, valueOf } from './__test-utils__/animated';
import { usePieceTransition, useOfflineTheme, useReducedMotion } from './hooks';
import { darkTheme, lightTheme } from './theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedScheme = useColorScheme as jest.Mock;

afterEach(() => jest.restoreAllMocks());

describe('useOfflineTheme', () => {
  it('resolves auto to the dark theme when the system is dark', async () => {
    mockedScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useOfflineTheme('auto'));
    expect(result.current.colorSurface).toBe('#1c1c1e');
  });

  it('resolves auto to the light theme when the system is light', async () => {
    mockedScheme.mockReturnValue('light');
    const { result } = await renderHook(() => useOfflineTheme());
    expect(result.current.colorSurface).toBe('#ffffff');
  });

  it('falls back to light when the system reports no scheme', async () => {
    mockedScheme.mockReturnValue(null);
    const { result } = await renderHook(() => useOfflineTheme('auto'));
    expect(result.current).toEqual(lightTheme);
  });

  it('forces a scheme regardless of the system', async () => {
    mockedScheme.mockReturnValue('light');
    const dark = await renderHook(() => useOfflineTheme('dark'));
    expect(dark.result.current).toEqual(darkTheme);
    mockedScheme.mockReturnValue('dark');
    const light = await renderHook(() => useOfflineTheme('light'));
    expect(light.result.current).toEqual(lightTheme);
  });

  it('merges overrides', async () => {
    mockedScheme.mockReturnValue('light');
    const { result } = await renderHook(() =>
      useOfflineTheme('light', { colorAction: '#123456' }),
    );
    expect(result.current.colorAction).toBe('#123456');
    expect(result.current.colorSurface).toBe('#ffffff');
  });
});

describe('useReducedMotion', () => {
  function stubAccessibility(initial: boolean | 'reject') {
    const remove = jest.fn();
    let listener: ((enabled: boolean) => void) | undefined;
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockImplementation(() =>
        initial === 'reject'
          ? Promise.reject(new Error('nope'))
          : Promise.resolve(initial),
      );
    const add = jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      _event: string,
      l: (enabled: boolean) => void,
    ) => {
      listener = l;
      return { remove };
    }) as unknown as typeof AccessibilityInfo.addEventListener);
    return { remove, add, emit: (v: boolean) => listener?.(v) };
  }

  it('is true for reduced without touching AccessibilityInfo', async () => {
    const { add } = stubAccessibility(false);
    const { result } = await renderHook(() => useReducedMotion('reduced'));
    expect(result.current).toBe(true);
    expect(add).not.toHaveBeenCalled();
  });

  it('is false for full even when the system asks for reduced motion', async () => {
    const { add } = stubAccessibility(true);
    const { result } = await renderHook(() => useReducedMotion('full'));
    expect(result.current).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  it('reads the system setting for auto', async () => {
    stubAccessibility(true);
    const { result } = await renderHook(() => useReducedMotion('auto'));
    expect(result.current).toBe(true);
  });

  it('defaults to auto and starts false', async () => {
    stubAccessibility(false);
    const { result } = await renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('follows reduceMotionChanged and unsubscribes on unmount', async () => {
    const { add, emit, remove } = stubAccessibility(false);
    const { result, unmount } = await renderHook(() => useReducedMotion('auto'));
    expect(add).toHaveBeenCalledWith('reduceMotionChanged', expect.any(Function));
    await act(async () => emit(true));
    expect(result.current).toBe(true);
    await act(async () => emit(false));
    expect(result.current).toBe(false);
    await unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('stays false when the system query rejects', async () => {
    stubAccessibility('reject');
    const { result } = await renderHook(() => useReducedMotion('auto'));
    expect(result.current).toBe(false);
  });
});

describe('usePieceTransition', () => {
  it('enters with a 200 ms fade and a 16 point rise on the native driver', async () => {
    const { calls } = mockTiming();
    const { result } = await renderHook(() =>
      usePieceTransition({
        visible: true,
        reduceMotion: false,
        theme: lightTheme,
        translateFrom: 16,
      }),
    );
    expect(calls.map((c) => [c.from, c.config.toValue, c.config.duration])).toEqual([
      [0, 1, 200],
      [16, 0, 200],
    ]);
    expect(calls.map((c) => c.config.useNativeDriver)).toEqual([true, true]);
    expect(result.current.mounted).toBe(true);
    expect(valueOf(result.current.style.opacity)).toBe(1);
  });

  it('uses the enterDuration it is given', async () => {
    const { calls } = mockTiming();
    await renderHook(() =>
      usePieceTransition({
        visible: true,
        reduceMotion: false,
        theme: lightTheme,
        enterDuration: 320,
      }),
    );
    expect(calls.map((c) => c.config.duration)).toEqual([320, 320]);
  });

  it('enters with a 120 ms fade and no movement under reduced motion', async () => {
    const { calls } = mockTiming();
    await renderHook(() =>
      usePieceTransition({
        visible: true,
        reduceMotion: true,
        theme: lightTheme,
        translateFrom: 16,
        enterDuration: 320,
      }),
    );
    expect(calls.map((c) => [c.from, c.config.toValue, c.config.duration])).toEqual([
      [0, 1, 120],
      [0, 0, 0],
    ]);
  });

  it('exits with a 150 ms fade, slides back, then unmounts', async () => {
    const { calls } = mockTiming();
    const { result, rerender } = await renderHook(
      (visible: boolean) =>
        usePieceTransition({
          visible,
          reduceMotion: false,
          theme: lightTheme,
          translateFrom: 16,
        }),
      { initialProps: true },
    );
    calls.length = 0;
    await rerender(false);
    expect(calls.map((c) => [c.config.toValue, c.config.duration])).toEqual([
      [0, 150],
      [16, 150],
    ]);
    expect(result.current.mounted).toBe(false);
  });

  it('exits with a 120 ms fade and no slide under reduced motion', async () => {
    const { calls } = mockTiming();
    const { rerender } = await renderHook(
      (visible: boolean) =>
        usePieceTransition({
          visible,
          reduceMotion: true,
          theme: lightTheme,
          translateFrom: 16,
        }),
      { initialProps: true },
    );
    calls.length = 0;
    await rerender(false);
    expect(calls.map((c) => [c.config.toValue, c.config.duration])).toEqual([
      [0, 120],
      [0, 0],
    ]);
  });

  it('mounts again when it becomes visible after an exit', async () => {
    mockTiming();
    const { result, rerender } = await renderHook(
      (visible: boolean) =>
        usePieceTransition({ visible, reduceMotion: false, theme: lightTheme }),
      { initialProps: false },
    );
    expect(result.current.mounted).toBe(false);
    await rerender(true);
    expect(result.current.mounted).toBe(true);
  });
});
