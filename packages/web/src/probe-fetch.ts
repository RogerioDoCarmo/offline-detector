import type { ProbeFetch } from '@rogeriodocarmo/offline-detector-core';

type FetchLike = (
  url: string,
  init: { method: string; signal: AbortSignal; mode: 'no-cors'; cache: 'no-store' },
) => Promise<{ ok: boolean; type?: string }>;

/**
 * A probe `fetch` for browsers. `no-cors` lets the probe reach hosts that send no CORS headers
 * (the default targets do not), which yields an opaque response; an opaque response proves the
 * request completed, so it is reported as success. `no-store` stops the HTTP cache answering for
 * the network.
 */
export function createWebProbeFetch(fetchImpl?: FetchLike): ProbeFetch {
  return async (url, init) => {
    const doFetch = fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    const response = await doFetch(url, { ...init, mode: 'no-cors', cache: 'no-store' });
    return { ok: response.ok || response.type === 'opaque', type: response.type };
  };
}
