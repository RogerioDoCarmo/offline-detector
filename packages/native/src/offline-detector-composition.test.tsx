/**
 * Integration tests for the public component, part 2: the full-screen state, slots, locales,
 * stacking and insets, and how the adapter is built. Same harness as offline-detector.test.tsx.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { I18nManager, Text, View } from 'react-native';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import { flatStyle, mockTiming } from '../test-utils/animated';
import {
  advance,
  banner,
  fullScreen,
  goOnline,
  goOffline,
  indicator,
  makeNet,
  mount,
  must,
  release,
  snackbar,
  theBanner,
  theFullScreen,
  theIndicator,
  theSnackbar,
} from '../test-utils/net';
import { OfflineDetector } from './offline-detector';
import { lightTheme, type OfflineTheme } from './theme';

const HIDDEN = { includeHiddenElements: true };

beforeEach(() => {
  jest.useFakeTimers();
  mockTiming();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('full-screen state', () => {
  it('is off by default and for fullScreen={false}', async () => {
    const net = makeNet({ up: false });
    const view = await mount(net);
    expect(fullScreen()).toBeNull();
    await view.unmount();
    await mount(makeNet({ up: false }), { fullScreen: false });
    expect(fullScreen()).toBeNull();
  });

  it('replaces the other pieces and hides the host content from assistive tech', async () => {
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: true });
    const view = within(theFullScreen());
    expect(view.getByRole('header')).toBeTruthy();
    expect(view.getByText('No internet')).toBeTruthy();
    expect(view.getByText('Check your connection and try again.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Continue offline' })).toBeNull();
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
    expect(screen.queryByText('Host content')).toBeNull();
    const host = screen.getByTestId('offline-detector-host', HIDDEN);
    expect(host.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(host.props.accessibilityElementsHidden).toBe(true);
    expect(within(host).getByText('Host content', HIDDEN)).toBeTruthy();
  });

  it('leaves the host content reachable while the state is off', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    const host = screen.getByTestId('offline-detector-host');
    expect(host.props.importantForAccessibility).toBe('auto');
    expect(host.props.accessibilityElementsHidden).toBe(false);
  });

  it('uses the reason-aware title with distinguishReason', async () => {
    const net = makeNet({ reachable: false });
    await mount(net, { fullScreen: true, distinguishReason: true });
    expect(within(theFullScreen()).getByText('Connected, but no internet')).toBeTruthy();
  });

  it('retries from the full-screen state and shows checking', async () => {
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: true });
    net.up = true;
    net.hold = true;
    await fireEvent.press(
      within(theFullScreen()).getByRole('button', { name: 'Try again' }),
    );
    expect(
      within(theFullScreen()).getByRole('button', { name: 'Checking…', disabled: true }),
    ).toBeTruthy();
    await release(net, true);
    expect(fullScreen()).toBeNull();
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
  });

  it('closes on recovery, restores the host and returns on the next offline transition', async () => {
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: true });
    await goOnline(net);
    expect(fullScreen()).toBeNull();
    expect(screen.getByText('Host content')).toBeTruthy();
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
    await advance(4000);
    await goOffline(net);
    expect(fullScreen()).not.toBeNull();
  });

  it('hides only the full-screen state with "Continue offline" until the next transition', async () => {
    const net = makeNet({ up: false });
    const onContinueOffline = jest.fn();
    await mount(net, { fullScreen: { continueOffline: true }, onContinueOffline });
    await fireEvent.press(
      within(theFullScreen()).getByRole('button', { name: 'Continue offline' }),
    );
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
    expect(fullScreen()).toBeNull();
    expect(screen.getByText('Host content')).toBeTruthy();
    expect(within(theBanner()).getByText('No internet')).toBeTruthy();
    await advance(60000);
    expect(fullScreen()).toBeNull();
    await goOnline(net);
    await advance(4000);
    await goOffline(net);
    expect(fullScreen()).not.toBeNull();
  });

  it('accepts a continue-offline press without a callback', async () => {
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: { continueOffline: true } });
    await fireEvent.press(
      within(theFullScreen()).getByRole('button', { name: 'Continue offline' }),
    );
    expect(fullScreen()).toBeNull();
  });

  it('has no continue action for fullScreen={{}}', async () => {
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: {} });
    expect(
      within(theFullScreen()).queryByRole('button', { name: 'Continue offline' }),
    ).toBeNull();
  });
});

describe('slots', () => {
  function capture() {
    const store: Record<string, PieceRenderProps<OfflineTheme>> = {};
    const seen = (name: string) => must(store[name]);
    const make = (name: string) =>
      function Slot(props: PieceRenderProps<OfflineTheme>) {
        store[name] = props;
        return <Text {...props.rootProps}>{`custom ${name}: ${props.message}`}</Text>;
      };
    return { seen, make };
  }

  it('replaces each piece entirely and passes the render props', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, {
      slots: {
        snackbar: make('snackbar'),
        banner: make('banner'),
        indicator: make('indicator'),
      },
    });
    expect(screen.getByText('custom snackbar: No internet')).toBeTruthy();
    expect(screen.getByText('custom banner: No internet')).toBeTruthy();
    expect(screen.getByText('custom indicator: No internet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();

    const props = seen('snackbar');
    expect(props.phase).toBe('offline');
    expect(props.visible).toBe(true);
    expect(props.state.status).toBe('offline');
    expect(props.state.reason).toBe('no-interface');
    expect(props.strings.retry).toBe('Retry');
    expect(props.theme.colorSurfaceInverse).toBe(lightTheme.colorSurfaceInverse);
    expect(typeof props.actions.retry).toBe('function');
    expect(typeof props.actions.dismiss).toBe('function');
    expect(props.actions.continueOffline).toBeUndefined();
    expect(props.rootProps).toEqual({
      testID: 'offline-detector-snackbar',
      accessibilityLiveRegion: 'polite',
    });
    expect(seen('banner').rootProps).toEqual({
      testID: 'offline-detector-banner',
      accessibilityLiveRegion: 'none',
    });
    expect(seen('indicator').rootProps).toEqual({
      testID: 'offline-detector-indicator',
      accessibilityLiveRegion: 'none',
    });
  });

  it('runs actions.retry through checkNow, with the checking phase', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, { slots: { snackbar: make('snackbar') } });
    net.up = true;
    net.hold = true;
    const before = net.fetchCalls;
    let result: Promise<unknown> | undefined;
    await act(async () => {
      result = seen('snackbar').actions.retry();
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(seen('snackbar').phase).toBe('checking');
    expect(net.fetchCalls).toBe(before + 1);
    await release(net, true);
    await expect(result).resolves.toMatchObject({ status: 'online' });
  });

  it('runs actions.dismiss through the dismissal state and onDismiss', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    const onDismiss = jest.fn();
    await mount(net, { slots: { banner: make('banner') }, onDismiss });
    await act(async () => {
      seen('banner').actions.dismiss?.();
    });
    await advance(150);
    expect(screen.queryByText('custom banner: No internet')).toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('banner');
  });

  it('omits actions.dismiss when the piece is not dismissible', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, {
      slots: { snackbar: make('snackbar'), banner: make('banner') },
      snackbar: { dismissible: false },
    });
    expect(seen('snackbar').actions.dismiss).toBeUndefined();
    expect(typeof seen('banner').actions.dismiss).toBe('function');
  });

  it('shows the recovery phase and message to a slot', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, { slots: { snackbar: make('snackbar') } });
    await goOnline(net);
    expect(screen.getByText('custom snackbar: Back online')).toBeTruthy();
    expect(seen('snackbar').phase).toBe('recovered');
  });

  it('keeps a slot mounted for the exit window with visible=false', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, { slots: { snackbar: make('snackbar') } });
    await act(async () => {
      seen('snackbar').actions.dismiss?.();
    });
    expect(screen.queryByText('custom snackbar: No internet')).toBeTruthy();
    expect(seen('snackbar').visible).toBe(false);
    await advance(150);
    expect(screen.queryByText('custom snackbar: No internet')).toBeNull();
  });

  it('replaces the full-screen state and hands it continueOffline', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    const onContinueOffline = jest.fn();
    await mount(net, {
      fullScreen: { continueOffline: true },
      onContinueOffline,
      slots: { fullScreen: make('fullScreen') },
    });
    expect(screen.getByText('custom fullScreen: No internet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(seen('fullScreen').actions.dismiss).toBeUndefined();
    expect(seen('fullScreen').rootProps).toEqual({
      testID: 'offline-detector-full-screen',
    });
    await act(async () => {
      seen('fullScreen').actions.continueOffline?.();
    });
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
    await advance(150);
    expect(screen.queryByText('custom fullScreen: No internet')).toBeNull();
  });

  it('hands a full-screen slot no continueOffline unless it opted in', async () => {
    const { seen, make } = capture();
    const net = makeNet({ up: false });
    await mount(net, { fullScreen: true, slots: { fullScreen: make('fullScreen') } });
    expect(seen('fullScreen').actions.continueOffline).toBeUndefined();
  });
});

describe('locales', () => {
  it('speaks pt-BR', async () => {
    const net = makeNet({ up: false });
    await mount(net, { locale: 'pt-BR' });
    expect(within(theSnackbar()).getByText('Sem internet')).toBeTruthy();
    expect(
      within(theSnackbar()).getByRole('button', { name: 'Tentar novamente' }),
    ).toBeTruthy();
    expect(within(theSnackbar()).getByRole('button', { name: 'Fechar' })).toBeTruthy();
    await goOnline(net);
    expect(within(theSnackbar()).getByText('Conexão restabelecida')).toBeTruthy();
  });

  it('speaks es', async () => {
    const net = makeNet({ up: false });
    await mount(net, { locale: 'es-MX', distinguishReason: true });
    expect(within(theSnackbar()).getByText('Sin conexión de red')).toBeTruthy();
    expect(
      within(theSnackbar()).getByRole('button', { name: 'Reintentar' }),
    ).toBeTruthy();
    await goOnline(net);
    expect(within(theSnackbar()).getByText('Conexión restablecida')).toBeTruthy();
  });

  it('merges string overrides over the locale', async () => {
    const net = makeNet({ up: false });
    await mount(net, { locale: 'es', strings: { offline: 'Fuera de línea' } });
    expect(within(theSnackbar()).getByText('Fuera de línea')).toBeTruthy();
  });

  it('follows the device locale when none is given', async () => {
    jest.spyOn(I18nManager, 'getConstants').mockReturnValue({
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'pt_BR',
    });
    const net = makeNet({ up: false });
    await mount(net);
    expect(within(theSnackbar()).getByText('Sem internet')).toBeTruthy();
  });

  it('falls back to English without a device locale', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    expect(within(theSnackbar()).getByText('No internet')).toBeTruthy();
  });
});

describe('insets, stacking and theme', () => {
  it('uses the default insets when none are passed', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    expect(flatStyle(theSnackbar().props.style).bottom).toBe(16);
  });

  it('applies the insets the host passes', async () => {
    const net = makeNet({ up: false });
    await mount(net, { insets: { bottom: 34, top: 47 } });
    expect(flatStyle(theSnackbar().props.style).bottom).toBe(16 + 34);
    expect(flatStyle(theIndicator().props.style).top).toBe(16 + 47);
  });

  it('merges theme overrides', async () => {
    const net = makeNet({ up: false });
    await mount(net, { theme: { colorSurfaceInverse: '#123456' } });
    let node = within(theSnackbar()).getByText('No internet').parent;
    while (node && flatStyle(node.props.style).backgroundColor === undefined) {
      node = node.parent;
    }
    expect(flatStyle(must(node).props.style).backgroundColor).toBe('#123456');
  });

  it('forces the dark scheme', async () => {
    let seen: OfflineTheme | undefined;
    function Slot(props: PieceRenderProps<OfflineTheme>) {
      seen = props.theme;
      return <View />;
    }
    const net = makeNet({ up: false });
    await mount(net, { colorScheme: 'dark', slots: { snackbar: Slot } });
    expect(must(seen).colorSurface).toBe('#1c1c1e');
  });

  it('sits the top indicator below the measured banner', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    await fireEvent(screen.getByTestId('offline-detector-banner-wrapper'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 60 } },
    });
    expect(flatStyle(theIndicator().props.style).top).toBe(16 + 60);
  });

  it('does not count the top inset twice when the banner already includes it', async () => {
    const net = makeNet({ up: false });
    await mount(net, { insets: { top: 47 } });
    await fireEvent(screen.getByTestId('offline-detector-banner-wrapper'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 100 } },
    });
    expect(flatStyle(theIndicator().props.style).top).toBe(16 + 47 + 53);
  });

  it('ignores a banner height that is smaller than the inset', async () => {
    const net = makeNet({ up: false });
    await mount(net, { insets: { top: 47 } });
    await fireEvent(screen.getByTestId('offline-detector-banner-wrapper'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 10 } },
    });
    expect(flatStyle(theIndicator().props.style).top).toBe(16 + 47);
  });

  it('lifts a bottom indicator above the snackbar', async () => {
    const net = makeNet({ up: false });
    await mount(net, { indicator: { position: 'bottom-end' } });
    expect(flatStyle(theIndicator().props.style).bottom).toBe(16 + 48 + 8);
    await fireEvent.press(within(theSnackbar()).getByRole('button', { name: 'Dismiss' }));
    expect(flatStyle(theIndicator().props.style).bottom).toBe(16);
  });

  it('puts a bottom banner after the host content', async () => {
    const net = makeNet({ up: false });
    await mount(net, { banner: { position: 'bottom' } });
    const root = screen.getByTestId('offline-detector-root');
    const order = root.children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? ''),
    );
    expect(order.indexOf('offline-detector-host')).toBeLessThan(
      order.indexOf('offline-detector-banner-wrapper'),
    );
  });

  it('puts the default banner before the host content', async () => {
    const net = makeNet({ up: false });
    await mount(net);
    const root = screen.getByTestId('offline-detector-root');
    const order = root.children.map((child) =>
      typeof child === 'string' ? child : (child.props.testID ?? ''),
    );
    expect(order.indexOf('offline-detector-banner-wrapper')).toBeLessThan(
      order.indexOf('offline-detector-host'),
    );
  });

  it('floats an overlay banner', async () => {
    const net = makeNet({ up: false });
    await mount(net, { banner: { overlay: true } });
    expect(flatStyle(theBanner().props.style).position).toBe('absolute');
  });
});

describe('motion', () => {
  it('follows the system reduced-motion setting with motion="auto"', async () => {
    const net = makeNet({ up: false });
    await mount(net, { motion: 'auto' });
    expect(snackbar()).not.toBeNull();
  });
});

describe('adapter and NetInfo', () => {
  type NetInfoListener = (state: { isConnected: boolean | null }) => void;
  function fakeNetInfo(isConnected: boolean | null) {
    const listeners = new Set<NetInfoListener>();
    return {
      listeners,
      connected: isConnected,
      fetch: jest.fn(function (this: { connected: boolean | null }) {
        return Promise.resolve({ isConnected: this.connected });
      }),
      addEventListener: jest.fn((listener: NetInfoListener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      }),
    };
  }

  it('forwards the netInfo prop to the native adapter', async () => {
    const netInfo = fakeNetInfo(false);
    const net = makeNet();
    await render(
      <OfflineDetector netInfo={netInfo} fetch={net.fetch} motion="reduced">
        <Text>Host content</Text>
      </OfflineDetector>,
    );
    await advance(0);
    expect(netInfo.fetch).toHaveBeenCalled();
    expect(within(theBanner()).getByText('No internet')).toBeTruthy();
    expect(netInfo.addEventListener).toHaveBeenCalledTimes(1);
    await act(async () => {
      netInfo.connected = true;
      netInfo.listeners.forEach((l) => l({ isConnected: true }));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(within(theSnackbar()).getByText('Back online')).toBeTruthy();
  });

  it('creates the adapter once per mount, not once per render', async () => {
    const netInfo = fakeNetInfo(true);
    const net = makeNet();
    const element = (label: string) => (
      <OfflineDetector netInfo={netInfo} fetch={net.fetch} motion="reduced">
        <Text>{label}</Text>
      </OfflineDetector>
    );
    const view = await render(element('one'));
    await advance(0);
    await view.rerender(element('two'));
    await view.rerender(element('three'));
    await advance(0);
    expect(netInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('degrades without NetInfo: the interface counts as up and the probe decides', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const net = makeNet({ reachable: false });
    await render(
      <OfflineDetector fetch={net.fetch} motion="reduced">
        <Text>Host content</Text>
      </OfflineDetector>,
    );
    await advance(0);
    expect(within(theBanner()).getByText('No internet')).toBeTruthy();
  });

  it('uses a passed adapter instead of building one', async () => {
    const netInfo = fakeNetInfo(true);
    const net = makeNet({ up: false });
    await mount(net, { netInfo });
    expect(netInfo.fetch).not.toHaveBeenCalled();
    expect(banner()).not.toBeNull();
  });
});
