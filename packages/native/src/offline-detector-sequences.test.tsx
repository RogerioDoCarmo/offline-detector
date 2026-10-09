/**
 * The multi-step sequences of the final review, driven through the whole `<OfflineDetector>`:
 * the REAL react package, the REAL pieces and the REAL pan gesture. Isolated piece tests passed
 * while every one of these was broken.
 */
import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import { mockTiming } from '../test-utils/animated';
import {
  advance,
  banner,
  fullScreen,
  goOffline,
  goOnline,
  indicator,
  makeNet,
  mount,
  release,
  snackbar,
  theBanner,
  theFullScreen,
  theIndicator,
  theSnackbar,
} from '../test-utils/net';
import { shown, trackPanResponders } from '../test-utils/swipe';
import type { NetInfoLike } from './adapter';
import type { OfflineTheme } from './theme';

beforeEach(() => {
  jest.useFakeTimers();
  mockTiming();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const message = (id: string) => screen.getByTestId(`offline-detector-${id}-message`);
const indicatorBody = () => screen.getByTestId('offline-detector-indicator-body');

describe.each(['reduced', 'full'] as const)(
  'A-C1: a swiped-away piece comes back (%s motion)',
  (motion) => {
    it('shows the "Back online" snackbar after the offline one was swiped away', async () => {
      const pan = trackPanResponders();
      const net = makeNet({ up: false });
      await mount(net, { motion });
      await pan.swipeAway(message('snackbar'));
      await advance(500);
      expect(snackbar()).toBeNull();

      await goOnline(net);
      expect(screen.getByText('Back online')).toBeTruthy();
      expect(shown(theSnackbar(), pan.surfaceOf(message('snackbar')))).toEqual({
        opacity: 1,
        translateX: 0,
      });
    });

    it('shows the next offline snackbar after a swipe, a recovery and a new outage', async () => {
      const pan = trackPanResponders();
      const net = makeNet({ up: false });
      await mount(net, { motion });
      await pan.swipeAway(message('snackbar'));
      await advance(500);
      await goOnline(net);
      await advance(4000);
      await advance(500);
      expect(snackbar()).toBeNull();

      await goOffline(net);
      expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
      expect(shown(theSnackbar(), pan.surfaceOf(message('snackbar')))).toEqual({
        opacity: 1,
        translateX: 0,
      });
    });

    it('shows the banner again on the next outage after it was swiped away', async () => {
      const pan = trackPanResponders();
      const net = makeNet({ up: false });
      await mount(net, { motion });
      await pan.swipeAway(message('banner'));
      await advance(500);
      expect(banner()).toBeNull();

      await goOnline(net);
      await advance(4000);
      await advance(500);
      await goOffline(net);
      expect(within(theBanner()).getByText('No internet')).toBeTruthy();
      expect(shown(theBanner(), pan.surfaceOf(message('banner')))).toEqual({
        opacity: 1,
        translateX: 0,
      });
    });

    it('shows the indicator as online after it was swiped away while offline', async () => {
      const pan = trackPanResponders();
      const net = makeNet({ up: false });
      await mount(net, { motion });
      await pan.swipeAway(indicatorBody());
      await advance(500);
      expect(indicator()).toBeNull();

      await goOnline(net);
      expect(
        within(theIndicator()).getByLabelText('Connection status: Online'),
      ).toBeTruthy();
      expect(shown(theIndicator(), pan.surfaceOf(indicatorBody()))).toEqual({
        opacity: 1,
        translateX: 0,
      });
    });

    it('survives two swipe cycles in a row', async () => {
      const pan = trackPanResponders();
      const net = makeNet({ up: false });
      await mount(net, { motion });
      for (let cycle = 0; cycle < 2; cycle++) {
        await pan.swipeAway(message('snackbar'));
        await advance(500);
        await goOnline(net);
        expect(shown(theSnackbar(), pan.surfaceOf(message('snackbar'))).opacity).toBe(1);
        await advance(4500);
        await goOffline(net);
        expect(shown(theSnackbar(), pan.surfaceOf(message('snackbar'))).opacity).toBe(1);
      }
    });
  },
);

describe('A-I2: announcements on iOS and Android', () => {
  async function onPlatform(os: 'ios' | 'android', run: () => Promise<void>) {
    const original = Platform.OS;
    Platform.OS = os;
    try {
      await run();
    } finally {
      Platform.OS = original;
    }
  }

  it('on iOS speaks each transition once and never a user dismissal', async () => {
    await onPlatform('ios', async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation();
      announce.mockClear();
      const net = makeNet({ up: false });
      await mount(net);
      expect(announce.mock.calls).toEqual([['No internet']]);

      await fireEvent.press(
        within(theSnackbar()).getByRole('button', { name: 'Dismiss' }),
      );
      await advance(500);
      expect(announce.mock.calls).toEqual([['No internet']]);

      await goOnline(net);
      expect(announce.mock.calls).toEqual([['No internet'], ['Back online']]);
      await advance(5000);
      expect(announce).toHaveBeenCalledTimes(2);
    });
  });

  it('on iOS does not speak when the banner or indicator is dismissed either', async () => {
    await onPlatform('ios', async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation();
      announce.mockClear();
      const net = makeNet({ up: false });
      await mount(net);
      await fireEvent.press(within(theBanner()).getByRole('button', { name: 'Dismiss' }));
      await fireEvent(
        screen.getByTestId('offline-detector-indicator-body'),
        'accessibilityAction',
        { nativeEvent: { actionName: 'dismiss' } },
      );
      await advance(500);
      expect(announce.mock.calls).toEqual([['No internet']]);
    });
  });

  it('on Android keeps the live region on the snackbar, and gives it to no one on dismissal', async () => {
    await onPlatform('android', async () => {
      const net = makeNet({ up: false });
      await mount(net);
      expect(message('snackbar').props.accessibilityLiveRegion).toBe('polite');
      expect(message('banner').props.accessibilityLiveRegion).toBeUndefined();
      await fireEvent.press(
        within(theSnackbar()).getByRole('button', { name: 'Dismiss' }),
      );
      expect(message('banner').props.accessibilityLiveRegion).toBeUndefined();
    });
  });

  it('on iOS does not re-announce after "Continue offline"', async () => {
    await onPlatform('ios', async () => {
      const announce = jest
        .spyOn(AccessibilityInfo, 'announceForAccessibility')
        .mockImplementation();
      announce.mockClear();
      const net = makeNet({ up: false });
      await mount(net, { fullScreen: { continueOffline: true } });
      expect(announce).not.toHaveBeenCalled();
      await fireEvent.press(
        within(theFullScreen()).getByRole('button', { name: 'Continue offline' }),
      );
      await advance(500);
      expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
      expect(announce).not.toHaveBeenCalled();
      await goOnline(net);
      expect(announce.mock.calls).toEqual([['Back online']]);
    });
  });
});

describe('A-I5: an initialStatus hint is not an observation', () => {
  it('does not show "Back online" when the first result is online', async () => {
    const net = makeNet();
    net.hold = true;
    await mount(net, { initialStatus: 'offline' });
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();

    await release(net, true);
    await advance(0);
    expect(screen.queryByText('Back online')).toBeNull();
    expect(snackbar()).toBeNull();
    await advance(4000);
    expect(screen.queryByText('Back online')).toBeNull();
  });

  it('still shows "Back online" for a real outage after the hint resolved', async () => {
    const net = makeNet();
    await mount(net, { initialStatus: 'offline' });
    await goOffline(net);
    await goOnline(net);
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
  });

  it('shows "Back online" when the first real result is offline and a later one online', async () => {
    const net = makeNet({ reachable: false });
    await mount(net, { initialStatus: 'offline' });
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
    await goOnline(net);
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
  });
});

describe('A-M1: the native adapter hears NetInfo once', () => {
  function fakeNetInfo(initial: boolean | null) {
    let current = initial;
    const listeners = new Set<(s: { isConnected: boolean | null }) => void>();
    const netInfo: NetInfoLike = {
      fetch: () => Promise.resolve({ isConnected: current }),
      addEventListener(listener) {
        listeners.add(listener);
        // Like the real module: the current state is delivered right after subscribing.
        setTimeout(() => listener({ isConnected: current }), 0);
        return () => {
          listeners.delete(listener);
        };
      },
    };
    return {
      netInfo,
      emit(isConnected: boolean | null) {
        current = isConnected;
        listeners.forEach((l) => l({ isConnected }));
      },
    };
  }

  it('probes once at launch, not again for NetInfo’s own first emission', async () => {
    const net = makeNet();
    net.hold = true;
    const info = fakeNetInfo(true);
    await mount(net, { adapter: undefined, netInfo: info.netInfo });
    await advance(10);
    expect(net.fetchCalls).toBe(1);
    await release(net, true);
    expect(net.fetchCalls).toBe(1);
  });

  it('does not restart the probe for an emission that changes nothing', async () => {
    const net = makeNet();
    const info = fakeNetInfo(true);
    await mount(net, { adapter: undefined, netInfo: info.netInfo });
    await advance(10);
    const before = net.fetchCalls;
    await act(async () => {
      info.emit(true);
      info.emit(true);
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(net.fetchCalls).toBe(before);
  });

  it('still reacts to a real change', async () => {
    const net = makeNet();
    const info = fakeNetInfo(true);
    await mount(net, { adapter: undefined, netInfo: info.netInfo });
    await advance(10);
    await act(async () => {
      info.emit(false);
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
  });
});

describe('A-M9: "Continue offline" is derived, not reset in an effect', () => {
  function spyOnSnackbar() {
    const frames: string[] = [];
    function Spy(props: PieceRenderProps<OfflineTheme>) {
      frames.push(`${props.phase}:${String(props.visible)}`);
      return <Text {...props.rootProps}>{props.message}</Text>;
    }
    return { frames, Spy };
  }
  const continueOffline = () =>
    fireEvent.press(
      within(theFullScreen()).getByRole('button', { name: 'Continue offline' }),
    );

  it('never renders the snackbar on the first frame of the next outage', async () => {
    const { frames, Spy } = spyOnSnackbar();
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: { continueOffline: true }, slots: { snackbar: Spy } });
    await continueOffline();
    await goOnline(net);
    await advance(5000);
    frames.length = 0;

    await goOffline(net);
    expect(fullScreen()).not.toBeNull();
    expect(frames.filter((f) => f === 'offline:true')).toEqual([]);
  });

  it('brings the full-screen state back for an outage that began and ended between two renders', async () => {
    const { frames, Spy } = spyOnSnackbar();
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: { continueOffline: true }, slots: { snackbar: Spy } });
    await continueOffline();
    expect(fullScreen()).toBeNull();
    frames.length = 0;

    await act(async () => {
      net.up = true;
      net.interfaceListeners.forEach((l) => l(true));
      await jest.advanceTimersByTimeAsync(0);
      net.up = false;
      net.interfaceListeners.forEach((l) => l(false));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(fullScreen()).not.toBeNull();
    expect(frames.filter((f) => f === 'offline:true')).toEqual([]);
  });
});

describe('A-M12: onRestoreFocus', () => {
  it('is called when the full-screen state leaves, and not before', async () => {
    const onRestoreFocus = jest.fn();
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: true, onRestoreFocus });
    expect(onRestoreFocus).not.toHaveBeenCalled();
    await goOnline(net);
    expect(onRestoreFocus).toHaveBeenCalledTimes(1);
  });
});
