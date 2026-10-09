import { createWebProbeFetch } from './probe-fetch';

const signal = new AbortController().signal;

function fakeFetch(response: { ok: boolean; type: string }) {
  const calls: Array<{ url: string; init: Record<string, unknown> }> = [];
  const impl = (url: string, init: Record<string, unknown>) => {
    calls.push({ url, init });
    return Promise.resolve(response);
  };
  return { impl, calls };
}

describe('createWebProbeFetch', () => {
  it('forces no-cors and no-store while keeping method and signal', async () => {
    const { impl, calls } = fakeFetch({ ok: false, type: 'opaque' });
    await createWebProbeFetch(impl as never)('https://cp.cloudflare.com/generate_204', {
      method: 'HEAD',
      signal,
    });
    expect(calls).toEqual([
      {
        url: 'https://cp.cloudflare.com/generate_204',
        init: { method: 'HEAD', signal, mode: 'no-cors', cache: 'no-store' },
      },
    ]);
  });

  it('does not let the caller override mode or cache', async () => {
    const { impl, calls } = fakeFetch({ ok: true, type: 'basic' });
    await createWebProbeFetch(impl as never)('u', {
      method: 'GET',
      signal,
      mode: 'cors',
      cache: 'default',
    } as never);
    expect(calls[0]?.init).toMatchObject({ mode: 'no-cors', cache: 'no-store' });
  });

  it('reports an opaque response as success even though ok is false', async () => {
    const { impl } = fakeFetch({ ok: false, type: 'opaque' });
    const result = await createWebProbeFetch(impl as never)('u', {
      method: 'HEAD',
      signal,
    });
    expect(result).toEqual({ ok: true, type: 'opaque' });
  });

  it('passes a normal ok response through', async () => {
    const { impl } = fakeFetch({ ok: true, type: 'basic' });
    expect(
      await createWebProbeFetch(impl as never)('u', { method: 'GET', signal }),
    ).toEqual({
      ok: true,
      type: 'basic',
    });
  });

  it('keeps a non-ok, non-opaque response as a failure', async () => {
    const { impl } = fakeFetch({ ok: false, type: 'basic' });
    expect(
      await createWebProbeFetch(impl as never)('u', { method: 'GET', signal }),
    ).toEqual({
      ok: false,
      type: 'basic',
    });
  });

  it('lets a rejection propagate', async () => {
    const impl = () => Promise.reject(new TypeError('Failed to fetch'));
    await expect(
      createWebProbeFetch(impl as never)('u', { method: 'HEAD', signal }),
    ).rejects.toThrow('Failed to fetch');
  });

  it('uses the global fetch at call time when none is given', async () => {
    const original = globalThis.fetch;
    const spy = jest.fn().mockResolvedValue({ ok: true, type: 'basic' });
    globalThis.fetch = spy as never;
    try {
      const probe = createWebProbeFetch();
      await probe('https://x.test/', { method: 'HEAD', signal });
      expect(spy).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
