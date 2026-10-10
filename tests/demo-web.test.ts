import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_OPTIONS,
  buildDetectorProps,
  mountKey,
  parseUrls,
} from '../apps/demo-web/lib/options';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('apps/demo-web/package.json'));

describe('apps/demo-web package', () => {
  it('is the private @offline-detector/demo-web workspace app', () => {
    expect(pkg.name).toBe('@offline-detector/demo-web');
    expect(pkg.private).toBe(true);
  });

  it('defines the scripts the root build and typecheck run', () => {
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts.dev).toBe('next dev');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
  });

  it('builds with Turbopack by default: no bundler flag in any script', () => {
    for (const script of Object.values(pkg.scripts) as string[]) {
      expect(script).not.toMatch(/--webpack|--turbo/);
    }
  });

  it('consumes the packages through the workspace, not through aliases', () => {
    expect(pkg.dependencies['@rogeriodocarmo/offline-detector-web']).toBe('workspace:*');
    expect(pkg.dependencies['@rogeriodocarmo/offline-detector-react']).toBe(
      'workspace:*',
    );
    expect(pkg.dependencies['@rogeriodocarmo/offline-detector-core']).toBe('workspace:*');
    expect(read('apps/demo-web/next.config.ts')).not.toMatch(/transpilePackages|alias/);
  });

  it('uses Next 16 and React 19', () => {
    expect(pkg.dependencies.next).toMatch(/^\^16\./);
    expect(pkg.dependencies.react).toMatch(/^\^19\./);
    expect(pkg.dependencies['react-dom']).toMatch(/^\^19\./);
  });

  it('loads no fonts or assets from the network at build time', () => {
    for (const file of ['app/layout.tsx', 'app/globals.css', 'app/page.tsx']) {
      const source = read(`apps/demo-web/${file}`);
      expect(source).not.toMatch(/next\/font\/google|https?:\/\/(fonts|cdn)/);
    }
  });

  it('keeps the export and the generated Next types out of Prettier', () => {
    const lines = read('.prettierignore').split('\n');
    expect(lines).toEqual(expect.arrayContaining(['out', 'next-env.d.ts']));
  });

  it('keeps generated output out of git', () => {
    const lines = read('apps/demo-web/.gitignore').split('\n');
    expect(lines).toEqual(expect.arrayContaining(['.next', 'out', 'next-env.d.ts']));
  });
});

describe('apps/demo-web next.config.ts', () => {
  const config = read('apps/demo-web/next.config.ts');

  it('exports a static site', () => {
    expect(config).toContain("output: 'export'");
  });

  it('serves under /offline-detector/demo', () => {
    expect(config).toContain("basePath: '/offline-detector/demo'");
  });

  it('writes <route>/index.html and skips the image optimiser', () => {
    expect(config).toContain('trailingSlash: true');
    expect(config).toContain('unoptimized: true');
  });
});

describe('apps/demo-web client boundary', () => {
  it('keeps the page a server component and the demo a client component', () => {
    expect(read('apps/demo-web/app/page.tsx')).not.toContain("'use client'");
    expect(read('apps/demo-web/components/demo.tsx').startsWith("'use client'")).toBe(
      true,
    );
  });
});

describe('playwright server for the exported demo', () => {
  it('keeps the single fixture server entry and gives it time for a cold demo build', () => {
    const config = read('playwright.config.ts');
    expect(config).toContain("command: 'node e2e/fixtures/serve.mjs'");
    expect(config).toContain('timeout: 300_000');
  });

  it('serves apps/demo-web/out under the Pages base path, building it when missing', () => {
    const serve = read('e2e/fixtures/serve.mjs');
    expect(serve).toContain("'apps/demo-web/out'");
    expect(serve).toContain("'/offline-detector/demo'");
    expect(serve).toContain('--filter=@offline-detector/demo-web');
  });

  it('has the spec and points it at the same server and base path', () => {
    expect(existsSync(join(root, 'e2e/demo-web.spec.ts'))).toBe(true);
    const helpers = read('e2e/demo-web-helpers.ts');
    expect(helpers).toContain('/offline-detector/demo/');
    expect(helpers).toContain('PLAYWRIGHT_BASE_URL');
  });
});

describe('parseUrls', () => {
  it('splits lines, trims and drops blanks', () => {
    expect(parseUrls(' https://a.test/x \n\n  https://b.test/y\n')).toEqual([
      'https://a.test/x',
      'https://b.test/y',
    ]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseUrls('  \n ')).toEqual([]);
  });
});

describe('buildDetectorProps', () => {
  it('passes only the always-on options for the defaults', () => {
    expect(buildDetectorProps(DEFAULT_OPTIONS)).toEqual({
      locale: 'en',
      distinguishReason: false,
      dismissible: true,
      colorScheme: 'auto',
      motion: 'auto',
      recoveryMs: 4000,
      probe: {
        urls: [
          'https://cp.cloudflare.com/generate_204',
          'https://www.gstatic.com/generate_204',
        ],
        intervalMs: 30000,
        timeoutMs: 5000,
        method: 'HEAD',
        mode: 'probe',
      },
    });
  });

  it('maps fullScreen on and continue-offline', () => {
    expect(buildDetectorProps({ ...DEFAULT_OPTIONS, fullScreen: 'on' }).fullScreen).toBe(
      true,
    );
    expect(
      buildDetectorProps({ ...DEFAULT_OPTIONS, fullScreen: 'continue' }).fullScreen,
    ).toEqual({ continueOffline: true });
  });

  it('maps per-piece options only when they are set', () => {
    const props = buildDetectorProps({
      ...DEFAULT_OPTIONS,
      snackbarDismissible: 'no',
      bannerDismissible: 'yes',
      bannerOverlay: true,
      indicatorDismissible: 'no',
      indicatorPosition: 'bottom-start',
      indicatorVariant: 'chip',
    });
    expect(props.snackbar).toEqual({ dismissible: false });
    expect(props.banner).toEqual({ dismissible: true, overlay: true });
    expect(props.indicator).toEqual({
      dismissible: false,
      position: 'bottom-start',
      variant: 'chip',
    });
  });

  it('overrides the Retry label only when one is typed', () => {
    expect(buildDetectorProps(DEFAULT_OPTIONS).strings).toBeUndefined();
    expect(
      buildDetectorProps({ ...DEFAULT_OPTIONS, retryLabel: 'Try once more' }).strings,
    ).toEqual({ retry: 'Try once more' });
  });

  it('omits the probe URL list when it is blank, so the core defaults apply', () => {
    const props = buildDetectorProps({ ...DEFAULT_OPTIONS, probeUrls: '' });
    expect(props.probe).toEqual({
      intervalMs: 30000,
      timeoutMs: 5000,
      method: 'HEAD',
      mode: 'probe',
    });
  });

  it('passes the initial status hint only when chosen', () => {
    expect(buildDetectorProps(DEFAULT_OPTIONS).initialStatus).toBeUndefined();
    expect(
      buildDetectorProps({ ...DEFAULT_OPTIONS, initialStatus: 'offline' }).initialStatus,
    ).toBe('offline');
  });
});

describe('mountKey', () => {
  it('changes with the options the detector reads once, and only those', () => {
    const base = mountKey(DEFAULT_OPTIONS);
    expect(mountKey({ ...DEFAULT_OPTIONS, probeIntervalMs: 1000 })).not.toBe(base);
    expect(mountKey({ ...DEFAULT_OPTIONS, initialStatus: 'offline' })).not.toBe(base);
    expect(mountKey({ ...DEFAULT_OPTIONS, realProbe: true })).not.toBe(base);
    expect(mountKey({ ...DEFAULT_OPTIONS, locale: 'es', dismissible: false })).toBe(base);
  });
});
