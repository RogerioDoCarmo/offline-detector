import type { ProbeFetch } from '@rogeriodocarmo/offline-detector-core';

type FetchLike = (
  url: string,
  init: {
    method: string;
    signal: AbortSignal;
    mode: 'no-cors';
    cache: 'no-store';
    credentials: 'omit';
    referrerPolicy: 'no-referrer';
  },
) => Promise<unknown>;

/**
 * A probe `fetch` for browsers. `no-cors` lets the probe reach hosts that send no CORS headers
 * (the default targets do not), which yields an opaque response; any completed response means
 * reachable, so the result is returned unchanged and the caller ignores it. `no-store` stops the
 * HTTP cache answering for the network; `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`
 * mean the probe sends no cookies and no `Referer`, even to a same-origin endpoint.
 */
export function createWebProbeFetch(fetchImpl?: FetchLike): ProbeFetch {
  const probe = async (url: string, init: { method: string; signal: AbortSignal }) => {
    const doFetch = fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    return doFetch(url, {
      ...init,
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  };
  // `ProbeFetch` resolves to `unknown` once the core contract lands; the cast keeps this file
  // compiling against either shape.
  return probe as unknown as ProbeFetch;
}
