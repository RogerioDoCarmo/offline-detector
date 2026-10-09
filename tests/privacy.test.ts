import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createOfflineDetector } from '../packages/core/src';
import { createWebProbeFetch } from '../packages/web/src/probe-fetch';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
// Whitespace is collapsed so a sentence wrapped across lines still matches as one phrase.
const flat = (text: string): string => text.replace(/\s+/g, ' ');
const html = () => flat(read('docs/privacy-policy.html'));
const md = () => flat(read('PRIVACY.md'));
// Code formatting is not part of the sentence: `Referer` and <code>Referer</code> read the same.
const plain = (text: string): string => text.replace(/<\/?code>/g, '').replace(/`/g, '');

// The numbers and addresses below are read from the source, so the policy cannot drift from what
// the packages actually do: changing a default fails this file until the policy is updated too.
const constant = (file: string, name: string): number => {
  const match = new RegExp(`${name}\\s*(?::[^=]+)?=\\s*(\\d+)`).exec(read(file));
  if (!match?.[1]) throw new Error(`constant ${name} not found in ${file}`);
  return Number(match[1]);
};
const defaultProbeUrls = (): string[] => {
  const block = /DEFAULT_PROBE_URLS[^=]*=\s*\[([\s\S]*?)\]/.exec(
    read('packages/core/src/detector.ts'),
  );
  return [...(block?.[1] ?? '').matchAll(/'(https:\/\/[^']+)'/g)].map((m) => m[1] ?? '');
};

const SECTIONS = [
  '1. Who we are',
  '2. Information we collect',
  '3. The connectivity check',
  '4. Native apps and NetInfo',
  '5. Device language and data kept on the device',
  '6. Documentation site and demo',
  '7. Data sharing and selling',
  '8. Data retention and security',
  "9. Children's privacy",
  '10. If you build an app with these packages',
  '11. Changes to this policy',
  '12. Contact',
];

describe('privacy policy files', () => {
  it('ships the hosted page and the repository copy, both in this repo', () => {
    expect(existsSync(join(root, 'docs/privacy-policy.html'))).toBe(true);
    expect(existsSync(join(root, 'PRIVACY.md'))).toBe(true);
  });

  it('names the hosted URL and is linked from the README', () => {
    expect(md()).toContain(
      'https://rogeriodocarmo.github.io/offline-detector/privacy-policy.html',
    );
    expect(read('README.md')).toContain('(PRIVACY.md)');
  });

  it('is published into the Pages site at /privacy-policy.html', () => {
    expect(read('.github/workflows/pages.yml')).toContain(
      '--policy docs/privacy-policy.html',
    );
  });

  it('carries the same twelve numbered sections in both copies, in the same order', () => {
    // Raw files, not the flattened text: the markdown headings are found by line.
    const fromHtml = [
      ...read('docs/privacy-policy.html').matchAll(/<h2>([^<]+)<\/h2>/g),
    ].map((m) => m[1]);
    const fromMd = [...read('PRIVACY.md').matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(fromHtml).toEqual(SECTIONS);
    expect(fromMd).toEqual(SECTIONS);
  });

  it('has the same last-updated date in both copies', () => {
    expect(html()).toContain('Last updated: 9 October 2026');
    expect(md()).toContain('Last updated: 9 October 2026');
  });

  it('gives the contact address in both copies', () => {
    expect(html()).toContain('contact@rogeriodocarmo.com');
    expect(md()).toContain('contact@rogeriodocarmo.com');
  });
});

describe('privacy policy matches the code', () => {
  it('lists exactly the default probe addresses the core package uses', () => {
    expect(defaultProbeUrls()).toEqual([
      'https://cp.cloudflare.com/generate_204',
      'https://www.gstatic.com/generate_204',
    ]);
    for (const text of [html(), md()]) {
      for (const url of defaultProbeUrls()) expect(text).toContain(url);
    }
  });

  it('states the real timeout, interval and backoff', () => {
    expect(constant('packages/core/src/detector.ts', 'DEFAULT_TIMEOUT_MS')).toBe(5000);
    expect(constant('packages/core/src/detector.ts', 'DEFAULT_INTERVAL_MS')).toBe(30000);
    expect(constant('packages/core/src/backoff.ts', 'BACKOFF_BASE_MS')).toBe(1000);
    expect(constant('packages/core/src/backoff.ts', 'BACKOFF_CAP_MS')).toBe(30000);
    expect(read('packages/core/src/detector.ts')).toContain(
      "probeOptions.method ?? 'HEAD'",
    );
    for (const text of [html(), md()]) {
      expect(text).toContain('HEAD');
      expect(text).toContain('every 30 seconds');
      expect(text).toContain('times out after 5 seconds');
      expect(text).toContain('1, 2, 4, 8 and 16 seconds');
    }
  });

  it('says how to switch the check off and how to point it at your own server', () => {
    for (const text of [html(), md()]) {
      expect(text).toContain('interface-only');
      expect(text).toContain('your own server');
    }
  });

  it("discloses NetInfo's own reachability requests, which the package neither sees nor controls", () => {
    for (const text of [html(), md()]) {
      expect(text).toContain('https://clients3.google.com/generate_204');
      expect(text).toContain('every 5 seconds');
      expect(text).toContain('every 60 seconds');
      expect(text).toContain('configure()');
    }
  });

  it('discloses the local-only data: device locale, in-memory state, and the docs site storage', () => {
    for (const text of [html(), md()]) {
      expect(text).toContain('I18nManager');
      expect(text).toContain('in memory');
      expect(text).toContain("browser's local storage");
      expect(text).toContain('no cookies');
    }
  });

  // Every non-test source file of every package, comments removed so prose cannot trigger a hit.
  const sourceFiles = (): string[] => {
    const walk = (dir: string): string[] =>
      readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) return walk(path);
        return /\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name)
          ? [path]
          : [];
      });
    return ['core', 'react', 'web', 'native'].flatMap((name) =>
      walk(`packages/${name}/src`),
    );
  };
  const code = (path: string): string =>
    read(path)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('scans every package source file, not a fixed list of names', () => {
    const files = sourceFiles();
    expect(files.length).toBeGreaterThan(40);
    expect(files).toContain('packages/core/src/probe.ts');
    expect(files).toContain('packages/web/src/offline-detector.tsx');
    expect(files).toContain('packages/native/src/use-swipe-dismiss.ts');
    expect(files.some((file) => /\.test\./.test(file))).toBe(false);
  });

  it('claims no analytics only where the code has none', () => {
    // If any package source starts using storage or analytics APIs, the policy needs a new section.
    const forbidden =
      /localStorage|sessionStorage|AsyncStorage|document\.cookie|indexedDB|sendBeacon|XMLHttpRequest|WebSocket|EventSource|navigator\.language/;
    for (const path of sourceFiles()) {
      expect({ path, hit: forbidden.test(code(path)) }).toEqual({ path, hit: false });
    }
  });

  it('makes a network request from the probe code only', () => {
    // Anything else that calls fetch( is a data flow the policy has not described. NetInfo's own
    // fetch() in the native adapter asks the OS for the interface state; it is not an HTTP request.
    const callers = sourceFiles().filter((path) => /\bfetch\s*\(/.test(code(path)));
    expect(callers).toEqual([
      'packages/core/src/detector.ts',
      'packages/core/src/probe.ts',
      'packages/native/src/adapter.ts',
    ]);
  });

  it('says what the request carries and what counts as reachable, in both copies', () => {
    for (const text of [html(), md()].map(plain)) {
      expect(text).toContain('The packages send no cookies');
      expect(text).toContain('credentials are omitted');
      expect(text).toContain('even a same-origin address you configure receives none');
      expect(text).toContain('no Referer header');
      expect(text).toContain('the referrer policy is no-referrer');
      expect(text).toContain('any completed HTTP response');
      expect(text).toContain('whatever its status');
      expect(text).toContain('Only a request that fails');
    }
  });
});

describe('privacy page furniture (copied from the mirror_app template)', () => {
  it('keeps the template layout, dark mode handling, short-version box and footer', () => {
    const page = html();
    expect(page).toContain('<!doctype html>');
    expect(page).toContain('color-scheme: light dark;');
    expect(page).toContain('@media (prefers-color-scheme: dark)');
    expect(page).toContain('max-width: 720px;');
    expect(page).toContain('border-bottom: 4px solid var(--accent);');
    expect(page).toContain('<p class="lede">');
    expect(page).toContain('<strong>Short version:</strong>');
    expect(page).toContain('<footer>');
    expect(page).toContain('--bg: #ffffff;');
    expect(page).toContain('--card: #f6f8fb;');
    expect(page).toContain('--bg: #0e1116;');
    expect(page).toContain('--card: #161b22;');
  });

  it("changes only the accent: the project's brand green, AA on both backgrounds", () => {
    const accents = [...html().matchAll(/--accent:\s*(#[0-9a-f]{6});/g)].map((m) => m[1]);
    // light mode, then dark mode (contrast 6.7:1 on white and 11.7:1 on #0e1116)
    expect(accents).toEqual(['#00694a', '#2ee6a6']);
  });

  it('loads nothing from anywhere: no scripts, links, images, frames, imports or remote urls', () => {
    const page = html();
    for (const forbidden of [
      '<script',
      '<link',
      '<img',
      '<iframe',
      'src=',
      '@import',
      'url(',
    ]) {
      expect({ forbidden, found: page.includes(forbidden) }).toEqual({
        forbidden,
        found: false,
      });
    }
  });
});

describe('the docs privacy page tells the same story as the policy, in every locale', () => {
  const pages = {
    en: ['apps/docs/docs/privacy.md', "browser's local storage"],
    'pt-BR': [
      'apps/docs/i18n/pt-BR/docusaurus-plugin-content-docs/current/privacy.md',
      'armazenamento local do navegador',
    ],
    es: [
      'apps/docs/i18n/es/docusaurus-plugin-content-docs/current/privacy.md',
      'almacenamiento local del navegador',
    ],
  } as const;

  it.each(Object.keys(pages))("%s discloses NetInfo's own requests", (locale) => {
    const page = flat(read(pages[locale as keyof typeof pages][0]));
    expect(page).toContain('NetInfo');
    expect(page).toContain('https://clients3.google.com/generate_204');
    expect(page).toContain('configure()');
    expect(page).toContain('5');
    expect(page).toContain('60');
  });

  it.each(Object.keys(pages))(
    '%s says what the probe sends and what counts as reachable',
    (locale) => {
      const page = plain(flat(read(pages[locale as keyof typeof pages][0])));
      const expected = {
        en: [
          "The probe sends no cookies (credentials: 'omit', so even a same-origin endpoint receives none) and no Referer header (referrerPolicy: 'no-referrer')",
          'A probe counts as reachable when any HTTP response completes, whatever its status',
          'Only a request that fails',
        ],
        'pt-BR': [
          "A sonda não envia cookies (credentials: 'omit', então nem um endpoint de mesma origem recebe algum) nem o cabeçalho Referer (referrerPolicy: 'no-referrer')",
          'Uma sonda conta como alcançável quando qualquer resposta HTTP é concluída, qualquer que seja o status',
          'Só uma requisição que falha',
        ],
        es: [
          "La sonda no envía cookies (credentials: 'omit', así que ni siquiera un endpoint del mismo origen recibe alguna) ni la cabecera Referer (referrerPolicy: 'no-referrer')",
          'Una sonda cuenta como alcanzable cuando se completa cualquier respuesta HTTP, sea cual sea su estado',
          'Solo una petición que falla',
        ],
      }[locale as 'en' | 'pt-BR' | 'es'];
      for (const phrase of expected) expect(page).toContain(phrase);
      // The old rule, an `ok` or opaque response, is gone from every locale.
      expect(page).not.toMatch(/\bok\b.{0,12}(opaque|opaca)/);
    },
  );

  it.each(Object.keys(pages))(
    '%s says the docs site keeps preferences in local storage',
    (locale) => {
      const [path, phrase] = pages[locale as keyof typeof pages];
      expect(flat(read(path))).toContain(phrase);
    },
  );

  it.each(Object.keys(pages))(
    '%s scopes the no-storage claim to the packages',
    (locale) => {
      // The docs site itself keeps a theme preference locally, so the claim must say "the packages".
      const scoped = {
        en: 'the packages set no cookie and write nothing to storage',
        'pt-BR': 'os pacotes não definem cookie nem gravam nada em armazenamento',
        es: 'los paquetes no definen cookies ni escriben nada en el almacenamiento',
      }[locale as 'en' | 'pt-BR' | 'es'];
      expect(flat(read(pages[locale as keyof typeof pages][0]))).toContain(scoped);
    },
  );
});

// These call the real functions and look at what they hand to fetch, because grepping the source
// for a string proved nothing: `credentials: 'omit'` also appears in a type and in a comment, so
// removing the real line left a source-grep test green.
describe('what the packages actually put on the wire matches the policy', () => {
  const fakeAdapter = {
    isInterfaceUp: () => true,
    subscribeInterface: () => () => undefined,
    subscribeForeground: () => () => undefined,
  };
  const detectorWith = (fetch: (url: string, init: unknown) => Promise<unknown>) =>
    createOfflineDetector({
      adapter: fakeAdapter,
      fetch: fetch as never,
      probe: { urls: ['https://a.test/204'] },
    });

  it('core asks without cookies, with the HEAD method and an abort signal', async () => {
    const inits: unknown[] = [];
    await detectorWith((_url, init) => {
      inits.push(init);
      return Promise.resolve({});
    }).checkNow();
    expect(inits).toHaveLength(1);
    expect(inits[0]).toMatchObject({ method: 'HEAD', credentials: 'omit' });
    expect((inits[0] as { signal: unknown }).signal).toBeInstanceOf(AbortSignal);
  });

  it('the web probe adds no-cors, no cache, no cookies and no Referer, whatever the caller sends', async () => {
    const received: Array<Record<string, unknown>> = [];
    const probe = createWebProbeFetch(((_url: string, init: Record<string, unknown>) => {
      received.push(init);
      return Promise.resolve({});
    }) as never);
    // The caller asks for nothing special; the privacy settings must come from the probe itself.
    await probe('https://a.test/204', {
      method: 'HEAD',
      signal: new AbortController().signal,
    } as never);
    expect(received[0]).toMatchObject({
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  });

  it('counts a response of any status as reachable, never reading a status or a body', async () => {
    for (const response of [
      { ok: false, status: 503 },
      { ok: false, status: 404 },
      {},
      null,
    ]) {
      const state = await detectorWith(() => Promise.resolve(response)).checkNow();
      expect({ response, status: state.status }).toEqual({ response, status: 'online' });
    }
  });

  it('counts a failed request as unreachable', async () => {
    const state = await detectorWith(() =>
      Promise.reject(new TypeError('Failed to fetch')),
    ).checkNow();
    expect(state.status).toBe('offline');
    expect(state.reason).toBe('no-internet');
  });
});
