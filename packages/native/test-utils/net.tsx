/**
 * Test harness for the integration tests of the public component: a controllable fake platform
 * adapter and probe fetch, plus helpers that drive them under Jest fake timers.
 */
import { act, render, screen, type RenderResult } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import { Text } from 'react-native';
import type { PlatformAdapter, ProbeFetch } from '@rogeriodocarmo/offline-detector-core';
import { OfflineDetector, type OfflineDetectorProps } from '../src/offline-detector';

type Listener = (up: boolean) => void;

export function makeNet(initial: { up?: boolean; reachable?: boolean } = {}) {
  const net = {
    up: initial.up ?? true,
    reachable: initial.reachable ?? true,
    hold: false,
    fetchCalls: 0,
    held: [] as Array<(ok: boolean) => void>,
    interfaceListeners: new Set<Listener>(),
    foregroundListeners: new Set<() => void>(),
    adapter: undefined as unknown as PlatformAdapter,
    fetch: undefined as unknown as ProbeFetch,
  };
  net.adapter = {
    isInterfaceUp: () => net.up,
    subscribeInterface(listener) {
      net.interfaceListeners.add(listener);
      return () => {
        net.interfaceListeners.delete(listener);
      };
    },
    subscribeForeground(listener) {
      net.foregroundListeners.add(listener);
      return () => {
        net.foregroundListeners.delete(listener);
      };
    },
  };
  net.fetch = () => {
    net.fetchCalls++;
    if (net.hold) {
      return new Promise((resolve: (response: { ok: boolean }) => void) => {
        net.held.push((ok) => resolve({ ok }));
      });
    }
    return net.reachable
      ? Promise.resolve({ ok: true })
      : Promise.reject(new Error('unreachable'));
  };
  return net;
}
export type Net = ReturnType<typeof makeNet>;

export async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}
export async function goOffline(net: Net) {
  await act(async () => {
    net.up = false;
    net.interfaceListeners.forEach((l) => l(false));
    await jest.advanceTimersByTimeAsync(0);
  });
}
export async function goOnline(net: Net) {
  await act(async () => {
    net.up = true;
    net.reachable = true;
    net.interfaceListeners.forEach((l) => l(true));
    await jest.advanceTimersByTimeAsync(0);
  });
}
export async function returnToApp(net: Net) {
  await act(async () => {
    net.foregroundListeners.forEach((l) => l());
    await jest.advanceTimersByTimeAsync(0);
  });
}
/** Settles every probe request the fake fetch is holding. */
export async function release(net: Net, ok: boolean) {
  await act(async () => {
    net.held.splice(0).forEach((resolve) => resolve(ok));
    await jest.advanceTimersByTimeAsync(0);
  });
}

/** Asserts a value is present and narrows it, so tests need no non-null assertions. */
export function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('expected a value');
  return value;
}

export const snackbar = (): TestInstance | null =>
  screen.queryByTestId('offline-detector-snackbar');
export const theSnackbar = (): TestInstance => must(snackbar());
export const banner = (): TestInstance | null =>
  screen.queryByTestId('offline-detector-banner');
export const theBanner = (): TestInstance => must(banner());
export const indicator = (): TestInstance | null =>
  screen.queryByTestId('offline-detector-indicator');
export const theIndicator = (): TestInstance => must(indicator());
export const fullScreen = (): TestInstance | null =>
  screen.queryByTestId('offline-detector-full-screen');
export const theFullScreen = (): TestInstance => must(fullScreen());

export async function mount(
  net: Net,
  props: Partial<OfflineDetectorProps> = {},
): Promise<RenderResult> {
  const view = await render(
    <OfflineDetector adapter={net.adapter} fetch={net.fetch} motion="reduced" {...props}>
      {props.children ?? <Text>Host content</Text>}
    </OfflineDetector>,
  );
  await advance(0);
  return view;
}
