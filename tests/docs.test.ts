import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const exists = (path: string): boolean => existsSync(join(root, path));

const LOCALES = ['en', 'pt-BR', 'es'] as const;
const DEMO_URL = 'https://rogeriodocarmo.github.io/offline-detector/demo/';
const PROBE_URLS = [
  'https://cp.cloudflare.com/generate_204',
  'https://www.gstatic.com/generate_204',
];

const DOC_IDS = [
  'intro',
  'install',
  'web-quick-start',
  'native-quick-start',
  'recheck-on-return',
  'dismissal',
  'slots',
  'theming',
  'accessibility',
  'i18n',
  'ssr',
  'faq',
  'privacy',
  'reference/core',
  'reference/react',
  'reference/web',
  'reference/native',
];

const docPath = (locale: string, id: string): string =>
  locale === 'en'
    ? `apps/docs/docs/${id}.md`
    : `apps/docs/i18n/${locale}/docusaurus-plugin-content-docs/current/${id}.md`;

describe('docusaurus config', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = () => require('../apps/docs/docusaurus.config.ts').default;

  it('is published under the owner Pages URL and repository path', () => {
    expect(config().url).toBe('https://rogeriodocarmo.github.io');
    expect(config().baseUrl).toBe('/offline-detector/');
    expect(config().organizationName).toBe('RogerioDoCarmo');
    expect(config().projectName).toBe('offline-detector');
    expect(config().trailingSlash).toBe(true);
  });

  it('has English as default with Brazilian Portuguese and Spanish', () => {
    expect(config().i18n.defaultLocale).toBe('en');
    expect(config().i18n.locales).toEqual(['en', 'pt-BR', 'es']);
  });

  it('fails the build on broken links, anchors and markdown links', () => {
    expect(config().onBrokenLinks).toBe('throw');
    expect(config().onBrokenAnchors).toBe('throw');
    expect(config().onBrokenMarkdownLinks).toBeUndefined();
    expect(config().markdown.hooks.onBrokenMarkdownLinks).toBe('throw');
    expect(config().markdown.format).toBe('detect');
  });

  it('has no search service, analytics, remote scripts or remote stylesheets', () => {
    const source = read('apps/docs/docusaurus.config.ts');
    expect(source).not.toMatch(/algolia/i);
    expect(source).not.toMatch(/gtag|googleAnalytics|plausible/i);
    expect(source).not.toMatch(/fonts\.googleapis|fonts\.gstatic|cdn\./);
    expect(config().scripts).toBeUndefined();
    expect(config().stylesheets).toBeUndefined();
    expect(config().clientModules).toBeUndefined();
  });

  it('serves the docs under /docs/ and links to the live demo', () => {
    const preset = config().presets[0][1];
    expect(preset.docs.routeBasePath).toBe('docs');
    expect(preset.blog).toBe(false);
    const items = config().themeConfig.navbar.items;
    expect(items.some((i: { href?: string }) => i.href === DEMO_URL)).toBe(true);
    expect(items.some((i: { type?: string }) => i.type === 'localeDropdown')).toBe(true);
  });

  it('declares labels and directions for the three locales', () => {
    expect(config().i18n.localeConfigs).toEqual({
      en: { label: 'English', htmlLang: 'en', direction: 'ltr' },
      'pt-BR': { label: 'Português (Brasil)', htmlLang: 'pt-BR', direction: 'ltr' },
      es: { label: 'Español', htmlLang: 'es', direction: 'ltr' },
    });
  });
});

describe('docs workspace package', () => {
  const pkg = () => JSON.parse(read('apps/docs/package.json'));

  it('is the private @offline-detector/docs package with the contract scripts', () => {
    expect(pkg().name).toBe('@offline-detector/docs');
    expect(pkg().private).toBe(true);
    expect(pkg().scripts.build).toBe('docusaurus build');
    expect(pkg().scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg().scripts.dev).toBe('docusaurus start');
  });

  it('pins Docusaurus 3.10.2 across every @docusaurus package', () => {
    const all = { ...pkg().dependencies, ...pkg().devDependencies };
    const versions = Object.entries(all)
      .filter(([name]) => name.startsWith('@docusaurus/'))
      .map(([, version]) => version);
    expect(versions.length).toBeGreaterThanOrEqual(5);
    expect(new Set(versions)).toEqual(new Set(['3.10.2']));
  });
});

describe('pages and translations', () => {
  it('has every page in English, pt-BR and es', () => {
    for (const locale of LOCALES) {
      for (const id of DOC_IDS) {
        expect({ locale, id, exists: exists(docPath(locale, id)) }).toEqual({
          locale,
          id,
          exists: true,
        });
      }
    }
  });

  it('has no translated page without an English original', () => {
    const list = (dir: string): string[] =>
      readdirSync(join(root, dir), { recursive: true })
        .map(String)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\\/g, '/').replace(/\.md$/, ''))
        .sort();
    const expected = [...DOC_IDS].sort();
    expect(list('apps/docs/docs')).toEqual(expected);
    expect(list('apps/docs/i18n/pt-BR/docusaurus-plugin-content-docs/current')).toEqual(
      expected,
    );
    expect(list('apps/docs/i18n/es/docusaurus-plugin-content-docs/current')).toEqual(
      expected,
    );
  });

  it('keeps the same headings count and code blocks in every translation', () => {
    const shape = (text: string) => ({
      h2: (text.match(/^## /gm) ?? []).length,
      h3: (text.match(/^### /gm) ?? []).length,
      fences: (text.match(/^```/gm) ?? []).length,
    });
    for (const id of DOC_IDS) {
      const en = shape(read(docPath('en', id)));
      expect({ id, ...shape(read(docPath('pt-BR', id))) }).toEqual({ id, ...en });
      expect({ id, ...shape(read(docPath('es', id))) }).toEqual({ id, ...en });
    }
  });

  it('translates the UI strings of the theme, navbar, footer and sidebar', () => {
    for (const locale of ['pt-BR', 'es']) {
      for (const file of [
        'code.json',
        'docusaurus-theme-classic/navbar.json',
        'docusaurus-theme-classic/footer.json',
        'docusaurus-plugin-content-docs/current.json',
      ]) {
        expect({
          locale,
          file,
          exists: exists(`apps/docs/i18n/${locale}/${file}`),
        }).toEqual({
          locale,
          file,
          exists: true,
        });
      }
    }
  });

  it('actually translates: the intro differs from English and uses locale words', () => {
    expect(read(docPath('pt-BR', 'intro'))).toContain('Sem internet');
    expect(read(docPath('pt-BR', 'intro'))).not.toBe(read(docPath('en', 'intro')));
    expect(read(docPath('es', 'intro'))).toContain('Sin internet');
    expect(read(docPath('es', 'intro'))).not.toBe(read(docPath('en', 'intro')));
  });

  it('links the live demo from the intro and both quick starts, in every locale', () => {
    for (const locale of LOCALES) {
      for (const id of ['intro', 'web-quick-start', 'native-quick-start']) {
        expect({ locale, id, has: read(docPath(locale, id)).includes(DEMO_URL) }).toEqual(
          {
            locale,
            id,
            has: true,
          },
        );
      }
    }
  });

  it('documents the default probe URLs and the self-hosting and interface-only options', () => {
    for (const locale of LOCALES) {
      const privacy = read(docPath(locale, 'privacy'));
      for (const url of PROBE_URLS) expect(privacy).toContain(url);
      expect(privacy).toContain("mode: 'interface-only'");
      expect(privacy).toContain('204');
      expect(privacy).toContain('Access-Control-Allow-Origin');
    }
  });

  it('names useRecheckOnReturn with both feedback modes and the dismissible flag', () => {
    for (const locale of LOCALES) {
      const recheck = read(docPath(locale, 'recheck-on-return'));
      expect(recheck).toContain('useRecheckOnReturn');
      expect(recheck).toContain("'brief'");
      expect(recheck).toContain("'none'");
      expect(read(docPath(locale, 'dismissal'))).toContain('dismissible');
    }
  });
});

/** Names exported by a package entry point, values and types, read from its index.ts. */
function exportedNames(pkg: string): string[] {
  const source = read(`packages/${pkg}/src/index.ts`);
  const names: Set<string> = new Set();
  for (const match of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of (match[1] ?? '').split(',')) {
      const name = part
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (name) names.add(name);
    }
  }
  for (const match of source.matchAll(/export\s+const\s+(\w+)/g)) {
    if (match[1]) names.add(match[1]);
  }
  return [...names].sort();
}

/** Names listed in the `{#export-index}` section of a reference page. */
function documentedNames(path: string): string[] {
  const lines = read(path).split('\n');
  const start = lines.findIndex((l) => l.includes('{#export-index}'));
  if (start === -1) return [];
  const names: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('#')) break;
    const match = /^- `([^`]+)`/.exec(line);
    if (match?.[1]) names.push(match[1]);
  }
  return names.sort();
}

describe('reference pages match the real exports', () => {
  it('extracts the export lists it compares against (guards the extractor)', () => {
    expect(exportedNames('core')).toEqual(
      expect.arrayContaining(['createOfflineDetector', 'DEFAULT_PROBE_URLS', 'isOnline']),
    );
    expect(exportedNames('react')).toEqual(
      expect.arrayContaining(['useRecheckOnReturn', 'STRINGS', 'OfflineStrings']),
    );
    expect(exportedNames('web')).toEqual(
      expect.arrayContaining(['OfflineDetector', 'createWebAdapter', 'SWIPE_RULES']),
    );
    expect(exportedNames('native')).toEqual(
      expect.arrayContaining(['createNativeAdapter', 'lightTheme', 'FullScreen']),
    );
    expect(exportedNames('core')).toHaveLength(17);
    expect(exportedNames('react')).toHaveLength(24);
    expect(exportedNames('web')).toHaveLength(33);
    expect(exportedNames('native')).toHaveLength(31);
  });

  for (const pkg of ['core', 'react', 'web', 'native']) {
    for (const locale of LOCALES) {
      it(`${pkg} export index (${locale}) equals the real exports`, () => {
        expect(documentedNames(docPath(locale, `reference/${pkg}`))).toEqual(
          exportedNames(pkg),
        );
      });
    }
  }

  it('documents every prop of the web and native OfflineDetector in the reference', () => {
    const webProps = [
      'adapter',
      'fetch',
      'probe',
      'onOffline',
      'onOnline',
      'onChange',
      'onError',
      'initialStatus',
      'locale',
      'strings',
      'distinguishReason',
      'fullScreen',
      'dismissible',
      'onDismiss',
      'snackbar',
      'banner',
      'indicator',
      'motion',
      'colorScheme',
      'recoveryMs',
      'slots',
    ];
    const nativeProps = ['netInfo', 'onContinueOffline', 'theme', 'insets'];
    for (const locale of LOCALES) {
      const web = read(docPath(locale, 'reference/web'));
      for (const prop of webProps) expect(web).toContain(`| \`${prop}\``);
      const native = read(docPath(locale, 'reference/native'));
      for (const prop of [...webProps.filter((p) => p !== 'adapter'), ...nativeProps]) {
        expect(native).toContain(`\`${prop}\``);
      }
      expect(native).toContain('| `adapter`');
    }
  });

  it('documents every --od-* token and every OfflineTheme key on the theming page', () => {
    const css = [...read('packages/web/src/tokens.ts').matchAll(/--od-[a-z0-9-]+/g)].map(
      (m) => m[0],
    );
    const tokens = [...new Set(css)].filter((t) => t !== '--od-');
    expect(tokens).toHaveLength(65);
    const themeBlock = /export type OfflineTheme = \{([\s\S]*?)\n\};/.exec(
      read('packages/native/src/theme.ts'),
    )?.[1];
    const keys = [...(themeBlock ?? '').matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(40);
    for (const locale of LOCALES) {
      const theming = read(docPath(locale, 'theming'));
      for (const token of tokens) expect(theming).toContain(`\`${token}\``);
      for (const key of keys) expect(theming).toContain(`\`${key}\``);
    }
  });
});

describe('brand layer contrast', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const contrast = require('../apps/docs/scripts/contrast.cjs');

  it('computes the WCAG ratio of black on white as 21 and a colour on itself as 1', () => {
    expect(contrast.ratio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast.ratio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('keeps every text pairing at or above AA, with these exact ratios', () => {
    const rows = contrast
      .table()
      .map(
        (r: {
          mode: string;
          foreground: string;
          background: string;
          ratio: number;
          pass: boolean;
        }) => [r.mode, r.foreground, r.background, r.ratio, r.pass],
      );
    expect(rows).toEqual([
      ['light', 'ink', 'paper', 15.85, true],
      ['light', 'muted', 'paper', 6.57, true],
      ['light', 'signal', 'paper', 6.44, true],
      ['light', 'signal', 'paperRaised', 5.88, true],
      ['light', 'ink', 'paperRaised', 14.49, true],
      ['light', 'muted', 'paperRaised', 6, true],
      ['light', 'onSignal', 'signal', 6.44, true],
      ['light', 'lost', 'paper', 6.25, true],
      ['dark', 'ink', 'canvas', 17.03, true],
      ['dark', 'muted', 'canvas', 8.47, true],
      ['dark', 'signal', 'canvas', 11.69, true],
      ['dark', 'signal', 'canvasRaised', 10.68, true],
      ['dark', 'ink', 'canvasRaised', 15.55, true],
      ['dark', 'muted', 'canvasRaised', 7.73, true],
      ['dark', 'onSignal', 'signal', 11.69, true],
      ['dark', 'lost', 'canvas', 6.77, true],
    ]);
  });

  it('uses exactly the brand colours from DESIGN.md in the stylesheet', () => {
    const css = read('apps/docs/src/css/custom.css').toLowerCase();
    for (const hex of [
      '#0e1116',
      '#f2f3f5',
      '#2ee6a6',
      '#ff6b5e',
      '#fafaf7',
      '#00694a',
    ]) {
      expect(css).toContain(hex);
    }
    for (const mode of Object.values(contrast.PALETTE) as Array<Record<string, string>>) {
      for (const hex of Object.values(mode)) expect(css).toContain(hex);
    }
  });

  it('honours reduced motion and fetches no fonts', () => {
    const css = read('apps/docs/src/css/custom.css');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).not.toMatch(/@import|url\(http|@font-face/);
  });
});

describe('assemble-site script', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { assemble } = require('../apps/docs/scripts/assemble-site.cjs');
  let dir: string;

  const make = (rel: string, content: string): string => {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
    return full;
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'od-site-'));
    make('docs-build/index.html', 'docs');
    make('docs-build/pt-BR/index.html', 'docs pt');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('puts docs at the root, the demo under /demo/ and the policy at /privacy-policy.html', () => {
    make('demo-out/index.html', 'demo');
    const policy = make('policy.html', 'policy');
    const result = assemble({
      docs: join(dir, 'docs-build'),
      demo: join(dir, 'demo-out'),
      policy,
      out: join(dir, 'site'),
    });
    expect(result).toEqual({ demo: true, policy: true });
    expect(readFileSync(join(dir, 'site/index.html'), 'utf8')).toBe('docs');
    expect(readFileSync(join(dir, 'site/pt-BR/index.html'), 'utf8')).toBe('docs pt');
    expect(readFileSync(join(dir, 'site/demo/index.html'), 'utf8')).toBe('demo');
    expect(readFileSync(join(dir, 'site/privacy-policy.html'), 'utf8')).toBe('policy');
    expect(existsSync(join(dir, 'site/.nojekyll'))).toBe(true);
  });

  it('tolerates a missing demo and a missing privacy policy', () => {
    const result = assemble({
      docs: join(dir, 'docs-build'),
      demo: join(dir, 'does-not-exist'),
      policy: join(dir, 'nope.html'),
      out: join(dir, 'site'),
    });
    expect(result).toEqual({ demo: false, policy: false });
    expect(existsSync(join(dir, 'site/index.html'))).toBe(true);
    expect(existsSync(join(dir, 'site/demo'))).toBe(false);
    expect(existsSync(join(dir, 'site/privacy-policy.html'))).toBe(false);
  });

  it('refuses to assemble when the docs build is missing', () => {
    expect(() =>
      assemble({
        docs: join(dir, 'missing'),
        demo: '',
        policy: '',
        out: join(dir, 'site'),
      }),
    ).toThrow('docs build not found');
  });

  it('runs from the command line with the same behaviour', () => {
    execFileSync(
      process.execPath,
      [
        join(root, 'apps/docs/scripts/assemble-site.cjs'),
        '--docs',
        join(dir, 'docs-build'),
        '--demo',
        join(dir, 'none'),
        '--policy',
        join(dir, 'none.html'),
        '--out',
        join(dir, 'cli-site'),
      ],
      { stdio: 'pipe' },
    );
    expect(readFileSync(join(dir, 'cli-site/index.html'), 'utf8')).toBe('docs');
  });
});

describe('pages workflow', () => {
  const wf = () => parse(read('.github/workflows/pages.yml'));
  type Step = {
    uses?: string;
    run?: string;
    if?: string;
    with?: Record<string, unknown>;
  };

  it('builds on push to main, on pull requests and on manual dispatch only', () => {
    expect(Object.keys(wf().on).sort()).toEqual([
      'pull_request',
      'push',
      'workflow_dispatch',
    ]);
    expect(wf().on.push.branches).toEqual(['main']);
    expect(wf().on.pull_request.branches).toEqual(['main', 'develop']);
  });

  it('has read-only permissions by default and uses no secrets', () => {
    expect(wf().permissions).toEqual({ contents: 'read' });
    expect(read('.github/workflows/pages.yml')).not.toContain('secrets.');
  });

  it('deploys only on push or dispatch to main, with the minimum Pages permissions', () => {
    const deploy = wf().jobs.deploy;
    expect(deploy.needs).toBe('build');
    expect(deploy.if).toBe(
      "github.event_name != 'pull_request' && github.ref == 'refs/heads/main'",
    );
    expect(deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(deploy.environment).toEqual({
      name: 'github-pages',
      url: '${{ steps.deployment.outputs.page_url }}',
    });
    expect(deploy.steps.map((s: Step) => s.uses)).toEqual(['actions/deploy-pages@v4']);
    expect(deploy.steps[0].id).toBe('deployment');
  });

  it('keeps the build job free of write permissions and of Pages setup on pull requests', () => {
    const build = wf().jobs.build;
    expect(build.permissions).toBeUndefined();
    const steps: Step[] = build.steps;
    const pagesSteps = steps.filter((s) =>
      /configure-pages|upload-pages-artifact/.test(s.uses ?? ''),
    );
    expect(pagesSteps.map((s) => s.uses)).toEqual([
      'actions/configure-pages@v5',
      'actions/upload-pages-artifact@v4',
    ]);
    for (const step of pagesSteps)
      expect(step.if).toBe("github.event_name != 'pull_request'");
    expect(pagesSteps[1]?.with).toEqual({ path: 'site' });
  });

  it('builds the docs, then the demo only when apps/demo-web exists, then assembles', () => {
    const steps: Step[] = wf().jobs.build.steps;
    const runs = steps.filter((s) => s.run).map((s) => [s.run, s.if]);
    expect(runs).toEqual([
      ['pnpm install --frozen-lockfile', undefined],
      ['pnpm turbo run build --filter=@offline-detector/docs', undefined],
      [
        'pnpm turbo run build --filter=./apps/demo-web',
        "hashFiles('apps/demo-web/package.json') != ''",
      ],
      [
        'node apps/docs/scripts/assemble-site.cjs --docs apps/docs/build --demo apps/demo-web/out --policy docs/privacy-policy.html --out site',
        undefined,
      ],
    ]);
  });

  it('uses the repo node and pnpm setup and turns Turborepo telemetry off', () => {
    expect(wf().env).toEqual({
      TURBO_TELEMETRY_DISABLED: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
    });
    const node = wf().jobs.build.steps.find((s: Step) =>
      s.uses?.startsWith('actions/setup-node'),
    );
    expect(node.with).toEqual({ 'node-version-file': '.nvmrc', cache: 'pnpm' });
  });

  it('does not cancel an in-flight deployment', () => {
    expect(wf().concurrency).toEqual({
      group: 'pages-${{ github.ref }}',
      'cancel-in-progress': false,
    });
  });
});

describe('owner actions: GitHub Pages', () => {
  const section = (): string => {
    const text = read('docs/OWNER-ACTIONS.md');
    const start = text.indexOf('## Enable GitHub Pages');
    const end = text.indexOf('\n## ', start + 1);
    return text.slice(start, end === -1 ? undefined : end);
  };

  it('tells the owner to use GitHub Actions as the source, not the /docs folder', () => {
    expect(section()).toContain('build_type=workflow');
    expect(section()).toContain('GitHub Actions');
    expect(section()).not.toContain('source[path]=/docs');
  });

  it('verifies by bytes against the local build and says Pages is not enabled by agents', () => {
    expect(section()).toContain('apps/docs/build');
    expect(section()).toContain('wc -c');
    expect(section()).toContain('--jq .status');
    expect(section()).toContain('built');
  });
});

describe('docs README', () => {
  it('says the translations still need a native-speaker review', () => {
    const readme = read('apps/docs/README.md');
    expect(readme).toContain('native-speaker review');
    expect(readme).toContain('pt-BR');
    expect(readme).toContain('es');
  });
});

describe('the web reference is honest about banner.position', () => {
  it('says the option is accepted and not yet applied', () => {
    const text = read('apps/docs/docs/reference/web.md').replace(/\s+/g, ' ');
    expect(text).toContain('`banner.position` is accepted and not yet applied');
  });
});

describe('slots and accessibility pages do not promise a fallback announcer that does not exist', () => {
  const flatText = (path: string): string => read(path).replace(/\s+/g, ' ');
  const expected = {
    en: {
      slots: [
        'Spread `rootProps` on your root.',
        'There is no fallback:',
        'a screen reader hears nothing for it',
        'call `AccessibilityInfo.announceForAccessibility(message)` itself',
      ],
      accessibility: [
        'snackbar, banner, indicator. If none of them is enabled, nothing is announced',
        'There is no hidden fallback announcer.',
      ],
      banned: /announcer/gi,
    },
    'pt-BR': {
      slots: [
        'Espalhe `rootProps` na sua raiz.',
        'Não há alternativa:',
        'um leitor de tela não fala nada para ele',
        'chamar `AccessibilityInfo.announceForAccessibility(message)` por conta própria',
      ],
      accessibility: [
        'snackbar, banner, indicador. Se nenhum deles estiver ativado, nada é anunciado',
        'Não existe anunciador oculto de reserva.',
      ],
      banned: /anunciador/gi,
    },
    es: {
      slots: [
        'Esparce `rootProps` en tu raíz.',
        'No hay alternativa:',
        'un lector de pantalla no lee nada para él',
        'llamar a `AccessibilityInfo.announceForAccessibility(message)` por su cuenta',
      ],
      accessibility: [
        'snackbar, banner, indicador. Si ninguno está activado, no se anuncia nada',
        'No existe un anunciador oculto de reserva.',
      ],
      banned: /anunciador/gi,
    },
  } as const;

  it.each(LOCALES)(
    '%s: slots.md says what a slot must do and that nothing catches it',
    (locale) => {
      const text = flatText(docPath(locale, 'slots'));
      for (const phrase of expected[locale].slots) expect(text).toContain(phrase);
      expect(text).not.toMatch(expected[locale].banned);
    },
  );

  it.each(LOCALES)(
    '%s: accessibility.md says that with no visible piece nothing is announced',
    (locale) => {
      const text = flatText(docPath(locale, 'accessibility'));
      for (const phrase of expected[locale].accessibility) expect(text).toContain(phrase);
      // The one place the word may remain is the sentence that denies the fallback exists.
      expect(text.match(expected[locale].banned)).toHaveLength(1);
    },
  );
});
