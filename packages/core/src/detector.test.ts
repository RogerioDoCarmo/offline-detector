import { createAdapter, createClock, createFetch, flush, make } from '../tests/helpers';
import { createOfflineDetector } from './detector';
import type { OfflineState } from './types';

const URLS = ['https://a.test', 'https://b.test'];

describe('createOfflineDetector: initial state', () => {
  it('starts unknown, idle and without timestamps', () => {
    const { detector, fetch } = make();
    expect(detector.getState()).toEqual({
      status: 'unknown',
      reason: null,
      checking: false,
      lastChecked: null,
      lastOnlineAt: null,
    });
    expect(fetch.calls).toEqual([]);
  });
});

describe('createOfflineDetector: configuration', () => {
  it('throws when probe mode has an empty URL list', () => {
    expect(() => make(() => 'ok', { probe: { urls: [] } })).toThrow(
      'offline-detector: probe.urls must contain at least one URL',
    );
  });

  it('allows an empty URL list in interface-only mode', () => {
    expect(() =>
      make(() => 'ok', { probe: { urls: [], mode: 'interface-only' } }),
    ).not.toThrow();
  });

  it('uses the Cloudflare and gstatic generate_204 URLs by default', async () => {
    const adapter = createAdapter();
    const fetch = createFetch(() => 'fail');
    const clock = createClock();
    const detector = createOfflineDetector({
      adapter: adapter.adapter,
      fetch,
      now: clock.now,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    await detector.checkNow();
    expect(fetch.calls).toEqual([
      'https://cp.cloudflare.com/generate_204',
      'https://www.gstatic.com/generate_204',
    ]);
    expect(fetch.inits[0]?.method).toBe('HEAD');
    expect(clock.delays).toEqual([5000, 5000]);
  });

  it('throws when probe mode has no fetch and the platform has none', () => {
    const original = globalThis.fetch;
    // @ts-expect-error simulating a runtime without fetch
    delete globalThis.fetch;
    try {
      expect(() =>
        createOfflineDetector({
          adapter: createAdapter().adapter,
          probe: { urls: URLS },
        }),
      ).toThrow('offline-detector: no fetch available; pass options.fetch');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('falls back to the global fetch, Date.now and timers when none are injected', async () => {
    const original = globalThis.fetch;
    const seen: string[] = [];
    const credentials: unknown[] = [];
    globalThis.fetch = ((url: string, init: { credentials?: unknown }) => {
      seen.push(url);
      credentials.push(init.credentials);
      return Promise.resolve({ ok: true, type: 'basic' });
    }) as unknown as typeof fetch;
    try {
      const detector = createOfflineDetector({
        adapter: createAdapter().adapter,
        probe: { urls: ['https://global.test'] },
      });
      const state = await detector.checkNow();
      expect(seen).toEqual(['https://global.test']);
      expect(credentials).toEqual(['omit']);
      expect(state.status).toBe('online');
      expect(state.lastChecked).toBeGreaterThan(1_700_000_000_000);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('does not require fetch in interface-only mode', async () => {
    const original = globalThis.fetch;
    // @ts-expect-error simulating a runtime without fetch
    delete globalThis.fetch;
    try {
      const detector = createOfflineDetector({
        adapter: createAdapter().adapter,
        probe: { mode: 'interface-only' },
      });
      expect((await detector.checkNow()).status).toBe('online');
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('createOfflineDetector: detection', () => {
  it('is offline with reason no-interface, without probing, when the interface is down', async () => {
    const { detector, fetch, clock } = make(() => 'ok', {}, false);
    const state = await detector.checkNow();
    expect(state).toEqual({
      status: 'offline',
      reason: 'no-interface',
      checking: false,
      lastChecked: clock.now(),
      lastOnlineAt: null,
    });
    expect(fetch.calls).toEqual([]);
  });

  it('is offline with reason no-internet when the interface is up but every probe fails', async () => {
    const { detector, fetch } = make(() => 'fail');
    const state = await detector.checkNow();
    expect(state.status).toBe('offline');
    expect(state.reason).toBe('no-internet');
    expect(state.lastOnlineAt).toBeNull();
    expect(fetch.calls).toEqual(URLS);
  });

  it('is online when the first probe succeeds and records both timestamps', async () => {
    const { detector, fetch, clock } = make();
    const now = clock.now();
    const state = await detector.checkNow();
    expect(state).toEqual({
      status: 'online',
      reason: null,
      checking: false,
      lastChecked: now,
      lastOnlineAt: now,
    });
    expect(fetch.calls).toEqual(['https://a.test']);
  });

  it('is online when only the fallback URL answers', async () => {
    const { detector, fetch } = make((url) => (url === 'https://a.test' ? 'fail' : 'ok'));
    expect((await detector.checkNow()).status).toBe('online');
    expect(fetch.calls).toEqual(URLS);
  });

  it('never calls fetch in interface-only mode', async () => {
    const { detector, fetch } = make(() => 'fail', { probe: { mode: 'interface-only' } });
    const state = await detector.checkNow();
    expect(state.status).toBe('online');
    expect(fetch.calls).toEqual([]);
  });

  it('interface-only mode is still offline when the interface is down', async () => {
    const { detector } = make(() => 'ok', { probe: { mode: 'interface-only' } }, false);
    const state = await detector.checkNow();
    expect(state.status).toBe('offline');
    expect(state.reason).toBe('no-interface');
  });

  it('keeps lastOnlineAt from the last online result while offline', async () => {
    const { detector, clock, adapter } = make();
    const first = clock.now();
    await detector.checkNow();
    clock.tick(5000);
    adapter.setUpSilently(false);
    const state = await detector.checkNow();
    expect(state.lastChecked).toBe(first + 5000);
    expect(state.lastOnlineAt).toBe(first);
  });

  it('treats a rejecting isInterfaceUp as up and lets the probe decide', async () => {
    const adapter = createAdapter();
    const failing = {
      ...adapter.adapter,
      isInterfaceUp: () => Promise.reject(new Error('x')),
    };
    const { detector, fetch } = make(() => 'ok', { adapter: failing });
    expect((await detector.checkNow()).status).toBe('online');
    expect(fetch.calls).toEqual(['https://a.test']);
  });

  it('supports an async isInterfaceUp', async () => {
    const adapter = createAdapter();
    const asyncAdapter = {
      ...adapter.adapter,
      isInterfaceUp: () => Promise.resolve(false),
    };
    const { detector } = make(() => 'ok', { adapter: asyncAdapter });
    expect((await detector.checkNow()).reason).toBe('no-interface');
  });
});

describe('createOfflineDetector: checkNow', () => {
  it('sets checking true while in flight and false after', async () => {
    const { detector } = make(() => 'hang');
    const pending = detector.checkNow();
    expect(detector.getState().checking).toBe(true);
    await flush();
    expect(detector.getState().checking).toBe(true);
    void pending;
  });

  it('clears checking once the probe resolves', async () => {
    const { detector } = make();
    const pending = detector.checkNow();
    expect(detector.getState().checking).toBe(true);
    await pending;
    expect(detector.getState().checking).toBe(false);
  });

  it('shares one in-flight probe between concurrent calls', async () => {
    const { detector, fetch } = make();
    const [a, b, c] = await Promise.all([
      detector.checkNow(),
      detector.checkNow(),
      detector.checkNow(),
    ]);
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('runs a new probe once the previous one has finished', async () => {
    const { detector, fetch } = make();
    await detector.checkNow();
    await detector.checkNow();
    expect(fetch.calls).toEqual(['https://a.test', 'https://a.test']);
  });

  it('a probe that times out reports no-internet after exactly timeoutMs per URL', async () => {
    const { detector, clock } = make(() => 'hang');
    let state: OfflineState | undefined;
    void detector.checkNow().then((s) => {
      state = s;
    });
    await clock.advance(9999);
    expect(state).toBeUndefined();
    await clock.advance(1);
    expect(state?.reason).toBe('no-internet');
  });
});

describe('createOfflineDetector: an overtaken checkNow', () => {
  /** A started detector with one check already settled, so events reach it. */
  async function started() {
    const h = make();
    h.detector.start();
    await flush();
    return h;
  }

  it('resolves with the overtaking run result when an up event arrives mid-check', async () => {
    const { detector, adapter } = await started();
    const overtaken = detector.checkNow();
    adapter.setUp(true);
    const state = await overtaken;
    expect(state.checking).toBe(false);
    expect(state.status).toBe('online');
    expect(state).toBe(detector.getState());
    detector.stop();
  });

  it('resolves with the settled offline state when a down event overtakes it', async () => {
    const { detector, adapter } = await started();
    const overtaken = detector.checkNow();
    adapter.setUp(false);
    const state = await overtaken;
    expect(state).toMatchObject({
      status: 'offline',
      reason: 'no-interface',
      checking: false,
    });
    detector.stop();
  });

  it('resolves with the settled state when stop() overtakes it', async () => {
    const { detector } = await started();
    const overtaken = detector.checkNow();
    detector.stop();
    expect((await overtaken).checking).toBe(false);
  });

  it('follows a chain of overtaking events to the last run', async () => {
    const { detector, adapter, fetch } = await started();
    const first = detector.checkNow();
    adapter.setUp(true);
    adapter.setUp(true);
    const state = await first;
    expect(state.checking).toBe(false);
    expect(state.status).toBe('online');
    expect(fetch.calls).toEqual(['https://a.test', 'https://a.test']);
    detector.stop();
  });
});

describe('createOfflineDetector: reachable means any completed response', () => {
  it.each(['http-error', 'opaque', 'empty'] as const)(
    'is online when the fetch resolves with a %s response',
    async (behavior) => {
      const { detector } = make(() => behavior);
      expect((await detector.checkNow()).status).toBe('online');
    },
  );

  it('is offline with no-internet only when every request is rejected', async () => {
    const { detector } = make(() => 'fail');
    expect(await detector.checkNow()).toMatchObject({
      status: 'offline',
      reason: 'no-internet',
    });
  });

  it('sends the method, an abort signal and no credentials', async () => {
    const { detector, fetch } = make();
    await detector.checkNow();
    expect(fetch.inits).toEqual([
      { method: 'HEAD', signal: expect.any(AbortSignal), credentials: 'omit' },
    ]);
  });
});

describe('createOfflineDetector: subscribers', () => {
  it('notifies subscribers with the new and previous state, checking included', async () => {
    const { detector } = make();
    const seen: string[] = [];
    detector.subscribe((s, p) =>
      seen.push(`${p.status}/${p.checking}>${s.status}/${s.checking}`),
    );
    await detector.checkNow();
    expect(seen).toEqual(['unknown/false>unknown/true', 'unknown/true>online/false']);
  });

  it('stops notifying after unsubscribe', async () => {
    const { detector } = make();
    const seen: string[] = [];
    const unsubscribe = detector.subscribe((s) => seen.push(s.status));
    unsubscribe();
    await detector.checkNow();
    expect(seen).toEqual([]);
  });

  it('does not notify when nothing changed', async () => {
    const { detector } = make(() => 'hang');
    const seen: string[] = [];
    void detector.checkNow();
    detector.subscribe((s) => seen.push(s.status));
    void detector.checkNow();
    expect(seen).toEqual([]);
  });

  it('reports listener exceptions to onError and keeps notifying the others', async () => {
    const errors: unknown[] = [];
    const { detector } = make(() => 'ok', { onError: (e) => errors.push(e) });
    const seen: string[] = [];
    detector.subscribe(() => {
      throw new Error('boom');
    });
    detector.subscribe((s) => seen.push(s.status));
    await detector.checkNow();
    expect(seen).toEqual(['unknown', 'online']);
    expect(errors).toHaveLength(2);
    expect((errors[0] as Error).message).toBe('boom');
  });

  it('swallows listener exceptions when no onError is given', async () => {
    const { detector } = make();
    detector.subscribe(() => {
      throw new Error('boom');
    });
    await expect(detector.checkNow()).resolves.toMatchObject({ status: 'online' });
  });
});

describe('createOfflineDetector: a throwing onError', () => {
  const boom = () => {
    throw new Error('onError exploded');
  };

  it('does not make checkNow reject, and the state still lands', async () => {
    const { detector } = make(() => 'ok', { onError: boom });
    detector.subscribe(() => {
      throw new Error('listener');
    });
    await expect(detector.checkNow()).resolves.toMatchObject({ status: 'online' });
  });

  it('keeps detecting: the next scheduled probe still runs', async () => {
    const { detector, clock, fetch } = make(() => 'ok', { onError: boom });
    detector.subscribe(() => {
      throw new Error('listener');
    });
    detector.start();
    await flush();
    expect(fetch.calls).toHaveLength(1);
    await clock.advance(30000);
    expect(fetch.calls).toHaveLength(2);
    detector.stop();
  });

  it('leaves no unhandled rejection from the fire-and-forget checks', async () => {
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => rejections.push(reason);
    process.on('unhandledRejection', onRejection);
    try {
      const { detector, adapter } = make(() => 'ok', { onError: boom });
      detector.subscribe(() => {
        throw new Error('listener');
      });
      detector.start();
      adapter.setUp(true);
      await flush();
      await flush();
      expect(rejections).toEqual([]);
      detector.stop();
    } finally {
      process.off('unhandledRejection', onRejection);
    }
  });
});

describe('createOfflineDetector: callbacks fire only on real transitions', () => {
  it('first result online: onChange fires, onOnline does not, onOffline does not', async () => {
    const { detector, events } = make();
    await detector.checkNow();
    expect(events).toEqual(['change:unknown>online']);
  });

  it('first result offline: onChange and onOffline fire', async () => {
    const { detector, events } = make(() => 'fail');
    await detector.checkNow();
    expect(events).toEqual(['change:unknown>offline', 'offline:no-internet']);
  });

  it('online to offline to online fires each callback once per transition', async () => {
    let up = true;
    const { detector, events } = make(() => (up ? 'ok' : 'fail'));
    await detector.checkNow();
    up = false;
    await detector.checkNow();
    up = true;
    await detector.checkNow();
    expect(events).toEqual([
      'change:unknown>online',
      'change:online>offline',
      'offline:no-internet',
      'change:offline>online',
      'online',
    ]);
  });

  it('repeated identical results fire nothing more', async () => {
    const { detector, events } = make(() => 'fail');
    await detector.checkNow();
    await detector.checkNow();
    await detector.checkNow();
    expect(events).toEqual(['change:unknown>offline', 'offline:no-internet']);
  });

  it('no-interface to no-internet is not a transition', async () => {
    const { detector, events, adapter } = make(() => 'fail', {}, false);
    await detector.checkNow();
    adapter.setUpSilently(true);
    const state = await detector.checkNow();
    expect(state.reason).toBe('no-internet');
    expect(events).toEqual(['change:unknown>offline', 'offline:no-interface']);
  });

  it('reports callback exceptions to onError', async () => {
    const errors: unknown[] = [];
    const { detector } = make(() => 'ok', {
      onChange: () => {
        throw new Error('cb');
      },
      onError: (e) => errors.push(e),
    });
    await detector.checkNow();
    expect((errors[0] as Error).message).toBe('cb');
  });

  it('passes the new and previous state to onChange', async () => {
    const calls: [OfflineState, OfflineState][] = [];
    const { detector } = make(() => 'fail', { onChange: (s, p) => calls.push([s, p]) });
    await detector.checkNow();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0].status).toBe('offline');
    expect(calls[0]?.[1].status).toBe('unknown');
  });

  it('works with no callbacks configured', async () => {
    const detector = createOfflineDetector({
      adapter: createAdapter().adapter,
      probe: { mode: 'interface-only' },
    });
    await expect(detector.checkNow()).resolves.toMatchObject({ status: 'online' });
  });
});
