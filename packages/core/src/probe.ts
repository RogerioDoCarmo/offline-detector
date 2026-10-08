import type { ClearTimeoutFn, ProbeFetch, SetTimeoutFn } from './types';

export interface ProbeDeps {
  fetch: ProbeFetch;
  method: string;
  timeoutMs: number;
  setTimeout: SetTimeoutFn;
  clearTimeout: ClearTimeoutFn;
}

function probeOne(url: string, deps: ProbeDeps): Promise<boolean> {
  return new Promise((resolve: (reachable: boolean) => void) => {
    const controller = new AbortController();
    const timer = deps.setTimeout(() => {
      controller.abort();
      resolve(false);
    }, deps.timeoutMs);
    const attempt = async (): Promise<boolean> => {
      try {
        const response = await deps.fetch(url, {
          method: deps.method,
          signal: controller.signal,
        });
        return response.ok || response.type === 'opaque';
      } catch {
        return false;
      }
    };
    void attempt().then((reachable) => {
      deps.clearTimeout(timer);
      resolve(reachable);
    });
  });
}

/** Tries each URL in order and stops at the first that answers. */
export async function probeAny(
  urls: readonly string[],
  deps: ProbeDeps,
): Promise<boolean> {
  for (const url of urls) {
    if (await probeOne(url, deps)) return true;
  }
  return false;
}
