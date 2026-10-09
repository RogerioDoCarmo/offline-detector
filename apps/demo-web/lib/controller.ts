import type { PlatformAdapter, ProbeFetch } from '@rogeriodocarmo/offline-detector-core';
import { createWebAdapter } from '@rogeriodocarmo/offline-detector-web';

/**
 * What the Simulate control makes the demo believe:
 * - `online`: the stub probe answers ok.
 * - `no-internet`: the interface is up but the stub probe fails ("Connected, but no internet").
 * - `no-interface`: the adapter reports the network interface as down.
 */
export type Simulation = 'online' | 'no-internet' | 'no-interface';

export interface DemoController {
  /** The web adapter, plus a simulated "interface down" on top of the real browser signal. */
  adapter: PlatformAdapter;
  /** A probe transport that never touches the network. */
  fetch: ProbeFetch;
  simulation(): Simulation;
  simulate(mode: Simulation): void;
  setLatency(ms: number): void;
  /** The mounted detector registers its `checkNow` here. Returns the unregister function. */
  attach(recheck: () => Promise<unknown>): () => void;
  /** Called with a short line for every stub probe. */
  onProbe: (line: string) => void;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('aborted'));
      },
      { once: true },
    );
  });
}

export function createDemoController(initialLatencyMs: number): DemoController {
  const base = createWebAdapter();
  const listeners = new Set<(up: boolean) => void>();
  let mode: Simulation = 'online';
  let latency = initialLatencyMs;
  let recheck: (() => Promise<unknown>) | null = null;

  const interfaceUp = () => base.isInterfaceUp() && mode !== 'no-interface';

  const controller: DemoController = {
    adapter: {
      ...base,
      isInterfaceUp: interfaceUp,
      subscribeInterface(listener) {
        const unsubscribeBase = base.subscribeInterface((up) =>
          listener(up && interfaceUp()),
        );
        listeners.add(listener);
        return () => {
          unsubscribeBase();
          listeners.delete(listener);
        };
      },
    },

    fetch: async (url, { signal }) => {
      await wait(latency, signal);
      // Like a real request: any response means reachable, only a failed request means not.
      const ok = mode !== 'no-internet';
      controller.onProbe(`stub probe ${ok ? 'answered' : 'failed'}: ${url}`);
      if (!ok) throw new TypeError('Failed to fetch');
      return { ok };
    },

    simulation: () => mode,

    simulate(next) {
      const previous = mode;
      mode = next;
      if (next === 'no-interface' || previous === 'no-interface') {
        for (const listener of listeners) listener(interfaceUp());
      }
      // An interface event already starts a check; the other switches need an explicit one.
      if (next !== 'no-interface' && previous !== 'no-interface') void recheck?.();
    },

    setLatency(ms) {
      latency = ms;
    },

    attach(next) {
      recheck = next;
      return () => {
        if (recheck === next) recheck = null;
      };
    },

    onProbe: () => {},
  };

  return controller;
}
