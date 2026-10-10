import { createWebProbeFetch } from './probe-fetch';

const signal = new AbortController().signal;

function fakeFetch(response: unknown) {
  const calls: Array<{ url: string; init: Record<string, unknown> }> = [];
  const impl = (url: string, init: Record<string, unknown>) => {
    calls.push({ url, init });
    return Promise.resolve(response);
  };
  return { impl, calls };
}

describe('createWebProbeFetch', () => {
  it('sends no cookies and no Referer, and never reads or stores the HTTP cache', async () => {
    const { impl, calls } = fakeFetch({ ok: false, type: 'opaque' });
    await createWebProbeFetch(impl as never)('https://cp.cloudflare.com/generate_204', {
      method: 'HEAD',
      signal,
      credentials: 'omit',
    });
    expect(calls).toEqual([
      {
        url: 'https://cp.cloudflare.com/generate_204',
        init: {
          method: 'HEAD',
          signal,
          mode: 'no-cors',
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        },
      },
    ]);
  });

  it('does not let the caller override mode, cache, credentials or referrer policy', async () => {
    const { impl, calls } = fakeFetch({ ok: true, type: 'basic' });
    await createWebProbeFetch(impl as never)('u', {
      method: 'GET',
      signal,
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      referrerPolicy: 'unsafe-url',
    } as never);
    expect(calls[0]?.init).toMatchObject({
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  });

  it('returns whatever fetch resolved with, unchanged', async () => {
    const response = { ok: false, type: 'opaque', status: 0 };
    const { impl } = fakeFetch(response);
    expect(
      await createWebProbeFetch(impl as never)('u', {
        method: 'HEAD',
        signal,
        credentials: 'omit',
      }),
    ).toBe(response);
  });

  it('lets a rejection propagate', async () => {
    const impl = () => Promise.reject(new TypeError('Failed to fetch'));
    await expect(
      createWebProbeFetch(impl as never)('u', {
        method: 'HEAD',
        signal,
        credentials: 'omit',
      }),
    ).rejects.toThrow('Failed to fetch');
  });

  it('uses the global fetch at call time when none is given', async () => {
    const original = globalThis.fetch;
    const spy = jest.fn().mockResolvedValue({ ok: true, type: 'basic' });
    globalThis.fetch = spy as never;
    try {
      const probe = createWebProbeFetch();
      await probe('https://x.test/', { method: 'HEAD', signal, credentials: 'omit' });
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
