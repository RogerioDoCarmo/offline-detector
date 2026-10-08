/**
 * Integration tests for the public component: the REAL react package and the REAL pieces, with a
 * fake platform adapter and a fake probe fetch (test-utils/net.tsx). Fake timers drive the
 * recovery window, the checking hold and the detector's own back-off.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-react';
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
  returnToApp,
  snackbar,
  theBanner,
  theIndicator,
  theSnackbar,
} from '../test-utils/net';
import { OfflineDetector } from './offline-detector';

beforeEach(() => {
  jest.useFakeTimers();
  mockTiming();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('launch', () => {
  it('shows nothing when the app launches online, and never "Back online"', async () => {
    const net = makeNet();
    await mount(net);
    expect(screen.getByText('Host content')).toBeTruthy();
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
    expect(fullScreen()).toBeNull();
    expect(screen.queryByText('Back online')).toBeNull();
    await advance(60000);
    expect(screen.queryByText('Back online')).toBeNull();
    expect(snackbar()).toBeNull();
  });

  it('shows nothing before the first check completes', async () => {
    const net = makeNet();
    net.hold = true;
    await mount(net);
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
  });

  it('renders without children', async () => {
    const net = makeNet();
    await render(<OfflineDetector adapter={net.adapter} fetch={net.fetch} />);
    await advance(0);
    expect(snackbar()).toBeNull();
  });
});

describe('offline', () => {
  it('shows the snackbar, banner and indicator with "No internet"', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
    expect(within(theSnackbar()).getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(within(theBanner()).getByText('No internet')).toBeTruthy();
    expect(
      within(theIndicator()).getByLabelText('Connection status: No internet'),
    ).toBeTruthy();
    expect(fullScreen()).toBeNull();
    expect(screen.getByText('Host content')).toBeTruthy();
  });

  it('shows the indicator as a chip with its label when asked', async () => {
    const net = makeNet({ up: false });
    await mount(net, { indicator: { variant: 'chip' } });
    expect(within(theIndicator()).getByText('No internet')).toBeTruthy();
  });

  it('collapses the indicator to its dot while the banner shows', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    expect(within(theIndicator()).queryByText('No internet')).toBeNull();
    await fireEvent.press(within(theBanner()).getByRole('button', { name: 'Dismiss' }));
    expect(within(theIndicator()).getByText('No internet')).toBeTruthy();
  });

  it('keeps the dot when the host asked for it, with or without a banner', async () => {
    const net = makeNet({ up: false });
    await mount(net, { indicator: { variant: 'dot' } });
    await fireEvent.press(within(theBanner()).getByRole('button', { name: 'Dismiss' }));
    expect(within(theIndicator()).queryByText('No internet')).toBeNull();
  });

  it('says "No internet" for both reasons by default', async () => {
    const net = makeNet({ reachable: false });
    const view = await mount(net);
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
    await view.unmount();
    const other = makeNet({ up: false });
    await mount(other);
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
  });

  it('names the reason with distinguishReason: no network connection', async () => {
    const net = makeNet({ up: false });
    await mount(net, { distinguishReason: true });
    expect(within(theSnackbar()).getByText('No network connection')).toBeTruthy();
    expect(within(theBanner()).getByText('No network connection')).toBeTruthy();
  });

  it('names the reason with distinguishReason: connected, but no internet', async () => {
    const net = makeNet({ reachable: false });
    await mount(net, { distinguishReason: true });
    expect(within(theSnackbar()).getByText('Connected, but no internet')).toBeTruthy();
    expect(within(theBanner()).getByText('Connected, but no internet')).toBeTruthy();
  });
});

describe('recovery', () => {
  it('shows "Back online" for exactly recoveryMs after a real transition', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    await goOnline(net);
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
    expect(within(theSnackbar()).queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(banner()).toBeNull();
    expect(
      within(theIndicator()).getByLabelText('Connection status: Online'),
    ).toBeTruthy();
    await advance(3999);
    expect(snackbar()).not.toBeNull();
    await advance(1);
    expect(snackbar()).toBeNull();
    expect(indicator()).toBeNull();
    expect(screen.queryByText('Back online')).toBeNull();
  });

  it('honours a custom recoveryMs', async () => {
    const net = makeNet({ up: false });
    await mount(net, { recoveryMs: 1500 });
    await goOnline(net);
    await advance(1499);
    expect(snackbar()).not.toBeNull();
    await advance(1);
    expect(snackbar()).toBeNull();
  });

  it('replaces the recovery message at once when the app goes offline again', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    await goOnline(net);
    await advance(1000);
    await goOffline(net);
    expect(screen.queryByText('Back online')).toBeNull();
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
  });

  it('shows nothing after the first result of a launch that began offline and stays online', async () => {
    const net = makeNet();
    await mount(net);
    await goOffline(net);
    expect(snackbar()).not.toBeNull();
    await goOnline(net);
    expect(banner()).toBeNull();
  });
});

describe('dismissal', () => {
  it('dismisses one piece, leaves the others and brings all back after a transition', async () => {
    const net = makeNet({ up: false });
    const onDismiss = jest.fn();
    await mount(net, { onDismiss });
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Dismiss' }));
    expect(snackbar()).toBeNull();
    expect(banner()).not.toBeNull();
    expect(indicator()).not.toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('snackbar');

    await fireEvent.press(within(theBanner()).getByRole('button', { name: 'Dismiss' }));
    expect(banner()).toBeNull();
    expect(onDismiss).toHaveBeenLastCalledWith('banner');
    expect(onDismiss).toHaveBeenCalledTimes(2);

    // The same offline period goes on: nothing comes back.
    net.reachable = false;
    await advance(60000);
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();

    await goOnline(net);
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
    await advance(4000);
    await goOffline(net);
    expect(snackbar()).not.toBeNull();
    expect(banner()).not.toBeNull();
    expect(indicator()).not.toBeNull();
  });

  it('dismisses the indicator through its accessibility action', async () => {
    const net = makeNet({ up: false });
    const onDismiss = jest.fn();
    await mount(net, { onDismiss });
    const body = screen.getByTestId('offline-detector-indicator-body');
    await fireEvent(body, 'accessibilityAction', {
      nativeEvent: { actionName: 'dismiss' },
    });
    expect(indicator()).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('indicator');
    expect(snackbar()).not.toBeNull();
  });

  it('offers no dismissal with dismissible={false}', async () => {
    const net = makeNet({ up: false });
    await mount(net, { dismissible: false });
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    const body = screen.getByTestId('offline-detector-indicator-body');
    expect(body.props.accessibilityActions).toBeUndefined();
  });

  it('lets a per-piece flag win over the global one', async () => {
    const net = makeNet({ up: false });
    await mount(net, { dismissible: false, banner: { dismissible: true } });
    expect(within(theBanner()).getByRole('button', { name: 'Dismiss' })).toBeTruthy();
    expect(within(theSnackbar()).queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });
});

describe('announcements', () => {
  it('gives the live region to the snackbar, then to the banner when it is gone', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    expect(
      screen.getByTestId('offline-detector-snackbar-message').props
        .accessibilityLiveRegion,
    ).toBe('polite');
    expect(
      screen.getByTestId('offline-detector-banner-message').props.accessibilityLiveRegion,
    ).toBeUndefined();
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Dismiss' }));
    expect(
      screen.getByTestId('offline-detector-banner-message').props.accessibilityLiveRegion,
    ).toBe('polite');
  });
});

describe('Retry and checking', () => {
  it('calls checkNow and shows the checking state at once', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    net.up = true;
    net.hold = true;
    const before = net.fetchCalls;
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    expect(
      within(theSnackbar()).getByRole('button', { name: 'Checking…', disabled: true }),
    ).toBeTruthy();
    expect(
      within(theIndicator()).getByLabelText('Connection status: Checking connection'),
    ).toBeTruthy();
    await advance(0);
    expect(net.fetchCalls).toBe(before + 1);
    await release(net, true);
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
  });

  it('keeps the checking state at least 400 ms, then returns to Retry', async () => {
    const net = makeNet({ reachable: false });
    await mount(net);
    net.hold = true;
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    await advance(100);
    net.hold = false;
    await release(net, false);
    expect(within(theSnackbar()).getByRole('button', { name: 'Checking…' })).toBeTruthy();
    await advance(300);
    expect(within(theSnackbar()).getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('swaps the banner icon for a static mark under reduced motion', async () => {
    const net = makeNet({ reachable: false });
    await mount(net, { motion: 'reduced' });
    net.hold = true;
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    expect(
      within(theBanner()).getByText('…', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(within(theBanner()).getByText('No internet')).toBeTruthy();
  });

  it('shows a background check only when the host asked for brief feedback', async () => {
    function Screen() {
      useRecheckOnReturn({ checkingFeedback: 'brief' });
      return <Text>Host content</Text>;
    }
    const net = makeNet({ reachable: false });
    await mount(net, { children: <Screen /> });
    net.hold = true;
    await returnToApp(net);
    await advance(149);
    expect(within(theSnackbar()).getByRole('button', { name: 'Retry' })).toBeTruthy();
    await advance(1);
    expect(within(theSnackbar()).getByRole('button', { name: 'Checking…' })).toBeTruthy();
    expect(
      within(theIndicator()).getByLabelText('Connection status: Checking connection'),
    ).toBeTruthy();
    net.hold = false;
    await release(net, false);
    await advance(400);
    expect(within(theSnackbar()).getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('shows nothing for a background check without brief feedback', async () => {
    function Screen() {
      useRecheckOnReturn();
      return <Text>Host content</Text>;
    }
    const net = makeNet({ reachable: false });
    await mount(net, { children: <Screen /> });
    net.hold = true;
    await returnToApp(net);
    await advance(1000);
    expect(within(theSnackbar()).getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Checking…' })).toBeNull();
  });

  it('shows nothing for a scheduled probe while offline', async () => {
    const net = makeNet({ reachable: false });
    await mount(net);
    net.hold = true;
    await advance(120000);
    expect(screen.queryByRole('button', { name: 'Checking…' })).toBeNull();
  });

  it('does not touch state after unmount when a Retry resolves late', async () => {
    const net = makeNet({ up: false });
    const view = await mount(net);
    net.up = true;
    net.hold = true;
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    await view.unmount();
    await act(async () => {
      net.held.splice(0).forEach((resolve) => resolve(true));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(snackbar()).toBeNull();
  });
});

describe('callbacks', () => {
  it('fires once per transition, not per probe', async () => {
    const net = makeNet();
    const onOffline = jest.fn();
    const onOnline = jest.fn();
    const onChange = jest.fn();
    await mount(net, { onOffline, onOnline, onChange });
    expect(onOffline).not.toHaveBeenCalled();
    expect(onOnline).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);

    await goOffline(net);
    net.reachable = false;
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    await advance(1000);
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Retry' }));
    await advance(1000);
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onOnline).not.toHaveBeenCalled();

    await goOnline(net);
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('reports errors thrown by a callback through onError', async () => {
    const net = makeNet({ up: false });
    const onError = jest.fn();
    const boom = new Error('boom');
    await mount(net, {
      onOffline: () => {
        throw boom;
      },
      onError,
    });
    expect(onError).toHaveBeenCalledWith(boom);
  });
});
