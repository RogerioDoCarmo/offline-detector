import type { ClearTimeoutFn, ProbeFetch, SetTimeoutFn } from './types';

export interface ProbeDeps {
  fetch: ProbeFetch;
  method: string;
  timeoutMs: number;
  setTimeout: SetTimeoutFn;
  clearTimeout: ClearTimeoutFn;
  /** Aborting it cancels the request in flight, clears its timer and ends the probe. */
  signal?: AbortSignal;
}

function probeOne(url: string, deps: ProbeDeps): Promise<boolean> {
  return new Promise((resolve: (reachable: boolean) => void) => {
    const controller = new AbortController();
    const finish = (reachable: boolean): void => {
      deps.clearTimeout(timer);
      deps.signal?.removeEventListener('abort', onStop);
      resolve(reachable);
    };
    const onStop = (): void => {
      controller.abort();
      finish(false);
    };
    const timer = deps.setTimeout(() => {
      controller.abort();
      finish(false);
    }, deps.timeoutMs);
    deps.signal?.addEventListener('abort', onStop, { once: true });
    const attempt = async (): Promise<boolean> => {
      try {
        // Any completed response, whatever its status, means the network is reachable.
        await deps.fetch(url, {
          method: deps.method,
          signal: controller.signal,
          credentials: 'omit',
        });
        return true;
      } catch {
        return false;
      }
    };
    void attempt().then(finish);
  });
}

/** Tries each URL in order and stops at the first that answers. */
export async function probeAny(
  urls: readonly string[],
  deps: ProbeDeps,
): Promise<boolean> {
  for (const url of urls) {
    if (deps.signal?.aborted === true) return false;
    if (await probeOne(url, deps)) return true;
  }
  return false;
}
