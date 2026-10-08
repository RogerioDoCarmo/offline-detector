import fc from 'fast-check';
import { flush, make } from '../tests/helpers';
import type { OfflineState } from './types';

const TIMEOUT_MS = 7777; // unusual on purpose, so probe timeouts can be told from retries
const NAMED_OPS = ['down', 'up', 'foreground', 'check', 'netOn', 'netOff'] as const;
const opArb = fc.oneof(fc.constantFrom(...NAMED_OPS), fc.integer({ min: 0, max: 70000 }));
const scriptArb = fc.array(opArb, { maxLength: 40 });
const RUNS = { numRuns: 60 };

function rig(extra: Parameters<typeof make>[1] = {}) {
  let net = true;
  const h = make(() => (net ? 'ok' : 'fail'), {
    probe: { urls: ['https://a.test'], timeoutMs: TIMEOUT_MS, intervalMs: 30000 },
    recheckOnForeground: true,
    ...extra,
  });
  const play = async (op: (typeof NAMED_OPS)[number] | number): Promise<void> => {
    if (typeof op === 'number') await h.clock.advance(op);
    else if (op === 'down') h.adapter.setUp(false);
    else if (op === 'up') h.adapter.setUp(true);
    else if (op === 'foreground') h.adapter.foreground();
    else if (op === 'check') void h.detector.checkNow();
    else net = op === 'netOn';
    await flush();
    h.clock.tick(1); // time only moves forward
  };
  const retries = () => h.clock.delays.filter((d) => d !== TIMEOUT_MS);
  return { ...h, play, retries };
}

describe('detector properties', () => {
  it('callbacks fire exactly once per real status change, never otherwise', async () => {
    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        let changes = 0;
        let toOffline = 0;
        let toOnline = 0;
        let onChange = 0;
        let onOffline = 0;
        let onOnline = 0;
        const r = rig({
          onChange: (s, p) => {
            onChange++;
            expect(s.status).not.toBe(p.status);
          },
          onOffline: (s) => {
            onOffline++;
            expect(s.status).toBe('offline');
          },
          onOnline: (s) => {
            onOnline++;
            expect(s.status).toBe('online');
          },
        });
        r.detector.subscribe((s, p) => {
          if (s.status === p.status) return;
          changes++;
          if (s.status === 'offline') toOffline++;
          if (s.status === 'online' && p.status === 'offline') toOnline++;
        });
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
        expect(onChange).toBe(changes);
        expect(onOffline).toBe(toOffline);
        expect(onOnline).toBe(toOnline);
      }),
      RUNS,
    );
  });

  it('retry delays stay within 1000..30000 and only ever take known values', async () => {
    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        const r = rig();
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
        for (const delay of r.retries()) {
          expect([1000, 2000, 4000, 8000, 16000, 30000]).toContain(delay);
        }
      }),
      RUNS,
    );
  });

  it('backoff delays never decrease while the network stays down', async () => {
    const downOps = fc.array(
      fc.oneof(
        fc.constantFrom('down', 'up', 'foreground', 'check'),
        fc.integer({ min: 0, max: 70000 }),
      ),
      { maxLength: 40 },
    );
    await fc.assert(
      fc.asyncProperty(downOps, async (script) => {
        const r = rig();
        await r.play('netOff');
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
        const delays = r.retries();
        for (let i = 1; i < delays.length; i++) {
          expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1] as number);
        }
        for (const delay of delays) expect(delay).toBeLessThanOrEqual(30000);
      }),
      RUNS,
    );
  });

  it('lastOnlineAt is never after lastChecked', async () => {
    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        const r = rig();
        const check = (s: OfflineState) => {
          if (s.lastOnlineAt !== null && s.lastChecked !== null) {
            expect(s.lastOnlineAt).toBeLessThanOrEqual(s.lastChecked);
          }
          expect(s.lastOnlineAt === null).toBe(
            s.lastChecked === null || s.lastOnlineAt === null,
          );
        };
        r.detector.subscribe(check);
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
        check(r.detector.getState());
      }),
      RUNS,
    );
  });

  it('reason is non-null exactly when offline', async () => {
    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        const r = rig();
        r.detector.subscribe((s) => {
          expect(s.reason !== null).toBe(s.status === 'offline');
        });
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
      }),
      RUNS,
    );
  });

  it('any number of concurrent checkNow calls cause exactly one probe', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 25 }),
        fc.boolean(),
        async (n, healthy) => {
          const r = rig();
          await r.play(healthy ? 'netOn' : 'netOff');
          const results = await Promise.all(
            Array.from({ length: n }, () => r.detector.checkNow()),
          );
          expect(r.fetch.calls).toEqual(['https://a.test']);
          for (const result of results) expect(result).toBe(results[0]);
        },
      ),
      RUNS,
    );
  });

  it('interface-only mode never calls fetch', async () => {
    await fc.assert(
      fc.asyncProperty(scriptArb, async (script) => {
        const r = rig({ probe: { mode: 'interface-only' } });
        r.detector.start();
        for (const op of script) await r.play(op);
        r.detector.stop();
        expect(r.fetch.calls).toEqual([]);
        expect(r.clock.delays).toEqual([]);
      }),
      RUNS,
    );
  });

  it('start/stop cycles never leak timers or adapter listeners', async () => {
    const lifecycleOps = fc.array(
      fc.oneof(
        fc.constantFrom('start', 'stop', 'down', 'up', 'foreground'),
        fc.integer({ min: 0, max: 40000 }),
      ),
      { maxLength: 40 },
    );
    await fc.assert(
      fc.asyncProperty(lifecycleOps, async (script) => {
        const r = rig();
        let running = false;
        for (const op of script) {
          if (op === 'start') {
            r.detector.start();
            running = true;
          } else if (op === 'stop') {
            r.detector.stop();
            running = false;
          } else if (op === 'down') r.adapter.setUp(false);
          else if (op === 'up') r.adapter.setUp(true);
          else if (op === 'foreground') r.adapter.foreground();
          else await r.clock.advance(op);
          await flush();
          expect(r.clock.pending()).toBeLessThanOrEqual(1);
          expect(r.adapter.interfaceListenerCount()).toBe(running ? 1 : 0);
          expect(r.adapter.foregroundListenerCount()).toBe(running ? 1 : 0);
        }
        r.detector.stop();
        expect(r.clock.pending()).toBe(0);
      }),
      RUNS,
    );
  });
});
