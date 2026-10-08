import { createClock, createFetch, flush } from './testing/helpers';
import { probeAny } from './probe';

function setup(behave: Parameters<typeof createFetch>[0], timeoutMs = 5000) {
  const clock = createClock();
  const fetch = createFetch(behave);
  const run = (urls: string[], method = 'HEAD') =>
    probeAny(urls, {
      fetch,
      method,
      timeoutMs,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
  return { clock, fetch, run };
}

describe('probeAny', () => {
  it('succeeds on the first URL and stops there', async () => {
    const { fetch, run } = setup(() => 'ok');
    await expect(run(['https://a.test', 'https://b.test'])).resolves.toBe(true);
    expect(fetch.calls).toEqual(['https://a.test']);
  });

  it('falls back to the second URL in order when the first fails', async () => {
    const { fetch, run } = setup((url) => (url === 'https://a.test' ? 'fail' : 'ok'));
    await expect(
      run(['https://a.test', 'https://b.test', 'https://c.test']),
    ).resolves.toBe(true);
    expect(fetch.calls).toEqual(['https://a.test', 'https://b.test']);
  });

  it('succeeds on the last URL of the list', async () => {
    const { fetch, run } = setup((url) => (url === 'https://c.test' ? 'ok' : 'fail'));
    await expect(
      run(['https://a.test', 'https://b.test', 'https://c.test']),
    ).resolves.toBe(true);
    expect(fetch.calls).toEqual(['https://a.test', 'https://b.test', 'https://c.test']);
  });

  it('fails after trying every URL once when all fail', async () => {
    const { fetch, run } = setup(() => 'fail');
    await expect(run(['https://a.test', 'https://b.test'])).resolves.toBe(false);
    expect(fetch.calls).toEqual(['https://a.test', 'https://b.test']);
  });

  it('fails for an empty list without calling fetch', async () => {
    const { fetch, run } = setup(() => 'ok');
    await expect(run([])).resolves.toBe(false);
    expect(fetch.calls).toEqual([]);
  });

  it('treats a non-ok response as a failure', async () => {
    const { run } = setup(() => 'http-error');
    await expect(run(['https://a.test'])).resolves.toBe(false);
  });

  it('treats an opaque (no-cors) response as success', async () => {
    const { run } = setup(() => 'opaque');
    await expect(run(['https://a.test'])).resolves.toBe(true);
  });

  it('passes the method and an abort signal to fetch', async () => {
    const { fetch, run } = setup(() => 'ok');
    await run(['https://a.test'], 'GET');
    expect(fetch.inits).toHaveLength(1);
    expect(fetch.inits[0]?.method).toBe('GET');
    expect(fetch.inits[0]?.signal.aborted).toBe(false);
  });

  it('times out a hanging request at exactly timeoutMs and aborts it', async () => {
    const { clock, fetch, run } = setup(() => 'hang', 5000);
    let result: boolean | undefined;
    void run(['https://a.test']).then((value) => {
      result = value;
    });
    await clock.advance(4999);
    expect(result).toBeUndefined();
    await clock.advance(1);
    expect(result).toBe(false);
    expect(fetch.inits[0]?.signal.aborted).toBe(true);
  });

  it('moves to the next URL after a timeout', async () => {
    const { clock, fetch, run } = setup((url) =>
      url === 'https://a.test' ? 'hang' : 'ok',
    );
    let result: boolean | undefined;
    void run(['https://a.test', 'https://b.test']).then((value) => {
      result = value;
    });
    await flush();
    expect(fetch.calls).toEqual(['https://a.test']);
    await clock.advance(5000);
    expect(result).toBe(true);
    expect(fetch.calls).toEqual(['https://a.test', 'https://b.test']);
  });

  it('treats a fetch that throws synchronously as a failure and tries the next URL', async () => {
    const clock = createClock();
    const seen: string[] = [];
    const result = await probeAny(['https://a.test', 'https://b.test'], {
      fetch: (url) => {
        seen.push(url);
        if (url === 'https://a.test') throw new TypeError('no fetch here');
        return Promise.resolve({ ok: true });
      },
      method: 'HEAD',
      timeoutMs: 5000,
      setTimeout: clock.setTimeout,
      clearTimeout: clock.clearTimeout,
    });
    expect(result).toBe(true);
    expect(seen).toEqual(['https://a.test', 'https://b.test']);
    expect(clock.pending()).toBe(0);
  });

  it('clears every timeout timer it sets', async () => {
    const { clock, run } = setup((url) => (url === 'https://a.test' ? 'fail' : 'ok'));
    await run(['https://a.test', 'https://b.test']);
    expect(clock.delays).toEqual([5000, 5000]);
    expect(clock.pending()).toBe(0);
  });
});
