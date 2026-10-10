/* eslint-disable @typescript-eslint/no-require-imports -- jest.resetModules needs synchronous requires */
import type { NetInfoLike, AppStateLike } from './adapter';
import { createNativeAdapter } from './adapter';

type NetListener = (state: { isConnected: boolean | null }) => void;
type AppListener = (state: string) => void;

function fakeNetInfo(initial: boolean | null) {
  const listeners = new Set<NetListener>();
  const netInfo: NetInfoLike = {
    fetch: jest.fn(() => Promise.resolve({ isConnected: initial })),
    addEventListener: jest.fn((listener: NetListener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
  };
  return { netInfo, listeners };
}

function fakeAppState(currentState?: string) {
  const listeners = new Set<AppListener>();
  const remove = jest.fn();
  const appState: AppStateLike = {
    currentState,
    addEventListener: jest.fn((_type: 'change', listener: AppListener) => {
      listeners.add(listener);
      return {
        remove: () => {
          remove();
          listeners.delete(listener);
        },
      };
    }),
  };
  const emit = (state: string) => listeners.forEach((l) => l(state));
  return { appState, listeners, emit, remove };
}

describe('isInterfaceUp', () => {
  it.each([
    [true, true],
    [false, false],
    [null, true],
  ])('maps isConnected %p to %p', async (isConnected, expected) => {
    const { netInfo } = fakeNetInfo(isConnected);
    const adapter = createNativeAdapter({ netInfo, appState: fakeAppState().appState });
    await expect(adapter.isInterfaceUp()).resolves.toBe(expected);
  });
});

describe('subscribeInterface', () => {
  function subscribed(initial: boolean | null) {
    const net = fakeNetInfo(initial);
    const adapter = createNativeAdapter({
      netInfo: net.netInfo,
      appState: fakeAppState().appState,
    });
    const seen: boolean[] = [];
    adapter.subscribeInterface((up) => seen.push(up));
    const emit = (isConnected: boolean | null) =>
      net.listeners.forEach((l) => l({ isConnected }));
    return { adapter, seen, emit };
  }

  it('treats the first delivery (NetInfo sends the current state on subscribing) as a baseline', () => {
    const { seen, emit } = subscribed(true);
    emit(true);
    expect(seen).toEqual([]);
  });

  it('forwards changes as booleans, null counting as up', () => {
    const { seen, emit } = subscribed(true);
    emit(true);
    emit(false);
    emit(null);
    emit(false);
    expect(seen).toEqual([false, true, false]);
  });

  it('drops a repeat of the value it already reported', () => {
    const { seen, emit } = subscribed(true);
    emit(true);
    emit(false);
    emit(false);
    emit(true);
    emit(null);
    emit(true);
    expect(seen).toEqual([false, true]);
  });

  it('keeps a baseline that is offline silent, then reports the recovery', () => {
    const { seen, emit } = subscribed(false);
    emit(false);
    emit(false);
    emit(true);
    expect(seen).toEqual([true]);
  });

  it('forwards a first delivery that contradicts what a read already found', async () => {
    const { adapter, seen, emit } = subscribed(true);
    await adapter.isInterfaceUp();
    emit(false);
    expect(seen).toEqual([false]);
  });

  it('drops an event that repeats what a read already found', async () => {
    const { adapter, seen, emit } = subscribed(false);
    await adapter.isInterfaceUp();
    emit(false);
    expect(seen).toEqual([]);
  });

  it('keeps a separate baseline per subscription', () => {
    const net = fakeNetInfo(true);
    const adapter = createNativeAdapter({
      netInfo: net.netInfo,
      appState: fakeAppState().appState,
    });
    const first: boolean[] = [];
    const second: boolean[] = [];
    const stop = adapter.subscribeInterface((up) => first.push(up));
    net.listeners.forEach((l) => l({ isConnected: true }));
    stop();
    adapter.subscribeInterface((up) => second.push(up));
    net.listeners.forEach((l) => l({ isConnected: true }));
    expect(first).toEqual([]);
    expect(second).toEqual([]);
  });

  it('unsubscribes from NetInfo', () => {
    const { netInfo, listeners } = fakeNetInfo(true);
    const adapter = createNativeAdapter({ netInfo, appState: fakeAppState().appState });
    const unsubscribe = adapter.subscribeInterface(() => undefined);
    expect(listeners.size).toBe(1);
    unsubscribe();
    expect(listeners.size).toBe(0);
  });
});

describe('subscribeForeground', () => {
  function setup(currentState?: string) {
    const app = fakeAppState(currentState);
    const adapter = createNativeAdapter({
      netInfo: fakeNetInfo(true).netInfo,
      appState: app.appState,
    });
    const listener = jest.fn();
    const unsubscribe = adapter.subscribeForeground(listener);
    return { ...app, listener, unsubscribe };
  }

  it('fires on background to active', () => {
    const { emit, listener } = setup('active');
    emit('background');
    emit('active');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('fires on inactive to active', () => {
    const { emit, listener } = setup('active');
    emit('inactive');
    emit('active');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not fire when going to the background or inactive', () => {
    const { emit, listener } = setup('active');
    emit('inactive');
    emit('background');
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not fire for a repeated active', () => {
    const { emit, listener } = setup('active');
    emit('active');
    emit('active');
    expect(listener).not.toHaveBeenCalled();
  });

  it('fires once per return, not once per event', () => {
    const { emit, listener } = setup('active');
    emit('background');
    emit('active');
    emit('active');
    emit('inactive');
    emit('active');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('starts from the current app state when it is background', () => {
    const { emit, listener } = setup('background');
    emit('active');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('treats an unknown current state as active', () => {
    const { emit, listener } = setup(undefined);
    emit('active');
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes the AppState subscription on unsubscribe', () => {
    const { unsubscribe, remove, listeners } = setup('active');
    expect(listeners.size).toBe(1);
    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });

  it('subscribes to the change event', () => {
    const { appState } = setup('active');
    expect(appState.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});

describe('without NetInfo', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    jest.resetModules();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
    jest.dontMock('@react-native-community/netinfo');
  });

  function load(): typeof import('./adapter') {
    return require('./adapter');
  }

  it('reports the interface up and never calls the listener', async () => {
    const { createNativeAdapter: create } = load();
    const adapter = create({ netInfo: null, appState: fakeAppState().appState });
    expect(adapter.isInterfaceUp()).toBe(true);
    const listener = jest.fn();
    const unsubscribe = adapter.subscribeInterface(listener);
    unsubscribe();
    expect(listener).not.toHaveBeenCalled();
  });

  it('warns exactly once in development, across adapters', () => {
    const { createNativeAdapter: create } = load();
    create({ netInfo: null, appState: fakeAppState().appState });
    create({ netInfo: null, appState: fakeAppState().appState });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      '[offline-detector] No NetInfo module was passed. The network interface is assumed to be up ' +
        'and only the reachability probe decides. Install @react-native-community/netinfo and pass ' +
        'it as the `netInfo` option for instant offline detection.',
    );
  });

  it('does not warn when NetInfo is injected', () => {
    const { createNativeAdapter: create } = load();
    create({ netInfo: fakeNetInfo(true).netInfo, appState: fakeAppState().appState });
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn outside development', () => {
    const globals = globalThis as { __DEV__?: boolean };
    const previous = globals.__DEV__;
    globals.__DEV__ = false;
    try {
      const { createNativeAdapter: create } = load();
      create({ netInfo: null, appState: fakeAppState().appState });
      expect(warn).not.toHaveBeenCalled();
    } finally {
      globals.__DEV__ = previous;
    }
  });

  it('degrades when no netInfo is passed, with the same single warning', () => {
    const { createNativeAdapter: create } = load();
    const adapter = create({ appState: fakeAppState().appState });
    expect(adapter.isInterfaceUp()).toBe(true);
    create();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('never loads the optional module itself', () => {
    const factory = jest.fn(() => fakeNetInfo(false).netInfo);
    jest.doMock('@react-native-community/netinfo', factory);
    const { createNativeAdapter: create } = load();
    const adapter = create({ appState: fakeAppState().appState });
    expect(adapter.isInterfaceUp()).toBe(true);
    expect(factory).not.toHaveBeenCalled();
  });
});

describe('the package source', () => {
  it('has no require call and no import of the optional module', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const adapterSource = readFileSync(join(__dirname, 'adapter.ts'), 'utf8');
    expect(adapterSource).not.toMatch(/require\s*\(/);
    expect(adapterSource).not.toMatch(/from\s+['"]@react-native-community\/netinfo['"]/);
  });
});

describe('default AppState', () => {
  it('falls back to the react-native AppState', () => {
    const adapter = createNativeAdapter({ netInfo: fakeNetInfo(true).netInfo });
    const unsubscribe = adapter.subscribeForeground(() => undefined);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
