import { createAdapter, createFetch, flush, make } from '../tests/helpers';
import { createOfflineDetector } from './detector';

/** Delays of the scheduler's own timers (probe timeouts are 5000 ms in `make`). */
const scheduled = (delays: number[]) => delays.filter((d) => d !== 5000);

describe('start: scheduling while online', () => {
  it('checks immediately on start', async () => {
    const { detector, fetch } = make();
    detector.start();
    await flush();
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(detector.getState().status).toBe('online');
    detector.stop();
  });

  it('re-probes every intervalMs: not at 29999, yes at 30000', async () => {
    const { detector, fetch, clock } = make();
    detector.start();
    await flush();
    await clock.advance(29999);
    expect(fetch.calls).toHaveLength(1);
    await clock.advance(1);
    expect(fetch.calls).toHaveLength(2);
    await clock.advance(30000);
    expect(fetch.calls).toHaveLength(3);
    detector.stop();
  });

  it('defaults intervalMs to 30000', async () => {
    const { detector, clock } = make(() => 'ok', { probe: { urls: ['https://a.test'] } });
    detector.start();
    await flush();
    expect(scheduled(clock.delays)).toEqual([30000]);
    detector.stop();
  });

  it('honours a custom intervalMs', async () => {
    const { detector, clock } = make(() => 'ok', {
      probe: { urls: ['https://a.test'], intervalMs: 12345 },
    });
    detector.start();
    await flush();
    expect(scheduled(clock.delays)).toEqual([12345]);
    detector.stop();
  });
});

describe('start: backoff while offline', () => {
  it('retries after 1s, 2s, 4s, 8s, 16s, 30s, 30s', async () => {
    const { detector, clock } = make(() => 'fail');
    detector.start();
    await flush();
    for (let i = 0; i < 6; i++) {
      await clock.advance(scheduled(clock.delays).at(-1) ?? 0);
    }
    expect(scheduled(clock.delays)).toEqual([
      1000, 2000, 4000, 8000, 16000, 30000, 30000,
    ]);
    detector.stop();
  });

  it('does not retry at 999 ms but does at 1000 ms', async () => {
    const { detector, fetch, clock } = make(() => 'fail');
    detector.start();
    await flush();
    expect(fetch.calls).toHaveLength(2);
    await clock.advance(999);
    expect(fetch.calls).toHaveLength(2);
    await clock.advance(1);
    expect(fetch.calls).toHaveLength(4);
    detector.stop();
  });

  it('goes back to the base interval after recovering, then restarts at 1s', async () => {
    let healthy = false;
    const { detector, clock } = make(() => (healthy ? 'ok' : 'fail'));
    detector.start();
    await flush();
    await clock.advance(1000);
    await clock.advance(2000);
    expect(scheduled(clock.delays)).toEqual([1000, 2000, 4000]);
    healthy = true;
    await clock.advance(4000);
    expect(scheduled(clock.delays)).toEqual([1000, 2000, 4000, 30000]);
    healthy = false;
    await clock.advance(30000);
    expect(scheduled(clock.delays)).toEqual([1000, 2000, 4000, 30000, 1000]);
    detector.stop();
  });

  it('also backs off while the interface is down, without probing', async () => {
    const { detector, fetch, clock } = make(() => 'ok', {}, false);
    detector.start();
    await flush();
    await clock.advance(1000);
    expect(scheduled(clock.delays)).toEqual([1000, 2000]);
    expect(fetch.calls).toEqual([]);
    detector.stop();
  });
});

describe('default timers', () => {
  it('schedules with the real setTimeout and stop() cancels it', async () => {
    const spy = jest.spyOn(globalThis, 'setTimeout');
    const clearSpy = jest.spyOn(globalThis, 'clearTimeout');
    try {
      const detector = createOfflineDetector({
        adapter: createAdapter().adapter,
        probe: { urls: ['https://a.test'], intervalMs: 30000 },
        fetch: createFetch(() => 'ok'),
      });
      detector.start();
      await flush();
      const intervalCalls = spy.mock.calls.filter(([, ms]) => ms === 30000);
      expect(intervalCalls).toHaveLength(1);
      detector.stop();
      expect(clearSpy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      clearSpy.mockRestore();
    }
  });
});

describe('start: interface-only mode', () => {
  it('schedules no timers at all', async () => {
    const { detector, clock, fetch } = make(() => 'ok', {
      probe: { mode: 'interface-only' },
    });
    detector.start();
    await flush();
    expect(clock.delays).toEqual([]);
    expect(clock.pending()).toBe(0);
    expect(fetch.calls).toEqual([]);
    detector.stop();
  });
});

describe('stop: cancels the probe in flight', () => {
  it('aborts the pending fetch and clears its timeout timer', async () => {
    const { detector, fetch, clock } = make(() => 'hang');
    detector.start();
    await flush();
    expect(fetch.inits[0]?.signal.aborted).toBe(false);
    expect(clock.pending()).toBe(1);
    detector.stop();
    expect(fetch.inits[0]?.signal.aborted).toBe(true);
    expect(clock.pending()).toBe(0);
  });

  it('does not try the next URL after stop, and settles checking false', async () => {
    const { detector, fetch, clock } = make(() => 'hang');
    detector.start();
    await flush();
    const pending = detector.checkNow();
    detector.stop();
    await flush();
    expect((await pending).checking).toBe(false);
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(clock.pending()).toBe(0);
  });

  it('also cancels a probe that an interface event already overtook', async () => {
    const { detector, fetch, clock, adapter } = make(() => 'hang');
    detector.start();
    await flush();
    adapter.setUp(true);
    await flush();
    expect(fetch.inits).toHaveLength(2);
    expect(clock.pending()).toBe(2);
    detector.stop();
    expect(fetch.inits.map((init) => init.signal.aborted)).toEqual([true, true]);
    expect(clock.pending()).toBe(0);
  });

  it('a restart probes again with a fresh, un-aborted signal', async () => {
    const { detector, fetch } = make(() => 'hang');
    detector.start();
    await flush();
    detector.stop();
    detector.start();
    await flush();
    expect(fetch.inits).toHaveLength(2);
    expect(fetch.inits[1]?.signal.aborted).toBe(false);
    detector.stop();
  });
});

describe('adapter events', () => {
  it('goes offline immediately when the interface drops, without probing', async () => {
    const { detector, adapter, fetch, events } = make();
    detector.start();
    await flush();
    adapter.setUp(false);
    expect(detector.getState().status).toBe('offline');
    expect(detector.getState().reason).toBe('no-interface');
    expect(fetch.calls).toHaveLength(1);
    expect(events).toEqual([
      'change:unknown>online',
      'change:online>offline',
      'offline:no-interface',
    ]);
    detector.stop();
  });

  it('ignores a repeated interface-down event while already offline for that reason', async () => {
    const { detector, adapter, events } = make(() => 'ok', {}, false);
    detector.start();
    await flush();
    const before = detector.getState();
    adapter.setUp(false);
    expect(detector.getState()).toBe(before);
    expect(events).toEqual(['change:unknown>offline', 'offline:no-interface']);
    detector.stop();
  });

  it('checks right away when the interface comes back', async () => {
    const { detector, adapter, events } = make(() => 'ok', {}, false);
    detector.start();
    await flush();
    adapter.setUp(true);
    await flush();
    expect(detector.getState().status).toBe('online');
    expect(events).toEqual([
      'change:unknown>offline',
      'offline:no-interface',
      'change:offline>online',
      'online',
    ]);
    detector.stop();
  });

  it('discards a probe result that finishes after the interface dropped', async () => {
    const { detector, adapter, clock } = make((_u, call) => (call === 0 ? 'hang' : 'ok'));
    detector.start();
    await flush();
    adapter.setUp(false);
    await clock.advance(5000);
    expect(detector.getState().status).toBe('offline');
    expect(detector.getState().reason).toBe('no-interface');
    expect(detector.getState().checking).toBe(false);
    detector.stop();
  });

  it('starts a fresh probe when the interface comes back while an old one is in flight', async () => {
    const { detector, adapter, fetch } = make((_u, call) => (call === 0 ? 'hang' : 'ok'));
    detector.start();
    await flush();
    adapter.setUp(false);
    adapter.setUp(true);
    await flush();
    expect(fetch.calls).toEqual(['https://a.test', 'https://a.test']);
    expect(detector.getState().status).toBe('online');
    detector.stop();
  });

  it('re-checks immediately when the app returns to the foreground and recheckOnForeground is on', async () => {
    const { detector, adapter, fetch } = make(undefined, { recheckOnForeground: true });
    detector.start();
    await flush();
    adapter.foreground();
    await flush();
    expect(fetch.calls).toHaveLength(2);
    detector.stop();
  });

  it('ignores foreground returns by default: re-checking on return is the react hook opt-in', async () => {
    const { detector, adapter, fetch } = make();
    detector.start();
    await flush();
    adapter.foreground();
    await flush();
    expect(fetch.calls).toHaveLength(1);
    expect(adapter.subscribeForegroundCalls()).toBe(0);
    expect(adapter.foregroundListenerCount()).toBe(0);
    detector.stop();
  });

  it('shares an in-flight probe with a foreground return', async () => {
    const { detector, adapter, fetch } = make(undefined, { recheckOnForeground: true });
    detector.start();
    adapter.foreground();
    await flush();
    expect(fetch.calls).toHaveLength(1);
    detector.stop();
  });
});

describe('start and stop', () => {
  it('subscribes to the adapter once even if start is called twice', async () => {
    const { detector, adapter, fetch } = make(undefined, { recheckOnForeground: true });
    detector.start();
    detector.start();
    await flush();
    expect(adapter.subscribeInterfaceCalls()).toBe(1);
    expect(adapter.subscribeForegroundCalls()).toBe(1);
    expect(fetch.calls).toHaveLength(1);
    detector.stop();
  });

  it('stop unsubscribes from the adapter and clears the timer', async () => {
    const { detector, adapter, clock } = make(undefined, { recheckOnForeground: true });
    detector.start();
    await flush();
    expect(adapter.interfaceListenerCount()).toBe(1);
    expect(adapter.foregroundListenerCount()).toBe(1);
    expect(clock.pending()).toBe(1);
    detector.stop();
    expect(adapter.interfaceListenerCount()).toBe(0);
    expect(adapter.foregroundListenerCount()).toBe(0);
    expect(clock.pending()).toBe(0);
  });

  it('stop is safe to call when never started or called twice', () => {
    const { detector } = make();
    expect(() => {
      detector.stop();
      detector.stop();
    }).not.toThrow();
  });

  it('stops scheduling and reacting after stop', async () => {
    const { detector, adapter, fetch, clock } = make();
    detector.start();
    await flush();
    detector.stop();
    adapter.setUp(false);
    adapter.foreground();
    await clock.advance(120000);
    expect(fetch.calls).toHaveLength(1);
    expect(detector.getState().status).toBe('online');
  });

  it('stop during a probe freezes the state with checking false and schedules nothing', async () => {
    const { detector, clock } = make(() => 'hang');
    detector.start();
    await flush();
    expect(detector.getState().checking).toBe(true);
    detector.stop();
    expect(detector.getState().checking).toBe(false);
    await clock.advance(60000);
    expect(detector.getState()).toEqual({
      status: 'unknown',
      reason: null,
      checking: false,
      lastChecked: null,
      lastOnlineAt: null,
    });
    expect(clock.pending()).toBe(0);
  });

  it('repeated start/stop cycles never leave more than one timer or listener', async () => {
    const { detector, adapter, clock } = make();
    for (let i = 0; i < 5; i++) {
      detector.start();
      await flush();
      expect(clock.pending()).toBe(1);
      expect(adapter.interfaceListenerCount()).toBe(1);
      detector.stop();
      expect(clock.pending()).toBe(0);
      expect(adapter.interfaceListenerCount()).toBe(0);
    }
  });

  it('restarting resets the backoff to 1s', async () => {
    const { detector, clock } = make(() => 'fail');
    detector.start();
    await flush();
    await clock.advance(1000);
    detector.stop();
    detector.start();
    await flush();
    expect(scheduled(clock.delays)).toEqual([1000, 2000, 1000]);
    detector.stop();
  });

  it('a stale probe finishing after stop and restart does not add a second timer', async () => {
    const { detector, clock } = make((_u, call) => (call === 0 ? 'hang' : 'ok'));
    detector.start();
    await flush();
    detector.stop();
    detector.start();
    await flush();
    await clock.advance(5000);
    expect(clock.pending()).toBe(1);
    detector.stop();
  });
});
