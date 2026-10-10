import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const pkg = () => JSON.parse(read('apps/storybook-web/package.json'));
const workflow = (name: string) => parse(read(`.github/workflows/${name}`));

/** Every file under `dir` (relative to the repo root) that matches `keep`. */
function files(dir: string, keep: (path: string) => boolean): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      if (entry === 'node_modules' || entry === 'storybook-static') continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (keep(full)) out.push(relative(root, full).replace(/\\/g, '/'));
    }
  };
  walk(join(root, dir));
  return out;
}

describe('storybook-web package', () => {
  it('is the private @offline-detector/storybook-web app', () => {
    expect(pkg().name).toBe('@offline-detector/storybook-web');
    expect(pkg().private).toBe(true);
    expect(pkg().type).toBe('module');
  });

  it('defines build, typecheck, dev and the story test script', () => {
    expect(pkg().scripts.build).toBe('storybook build');
    expect(pkg().scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg().scripts.dev).toBe('storybook dev -p 6006 --no-open');
    expect(pkg().scripts['test:stories']).toBe('vitest run --project=storybook');
  });

  it('consumes the published packages through the workspace', () => {
    expect(pkg().dependencies).toEqual({
      '@rogeriodocarmo/offline-detector-core': 'workspace:*',
      '@rogeriodocarmo/offline-detector-react': 'workspace:*',
      '@rogeriodocarmo/offline-detector-web': 'workspace:*',
    });
  });

  it('runs Storybook 10 with matching addon versions', () => {
    const dev = pkg().devDependencies;
    for (const name of [
      'storybook',
      '@storybook/react-vite',
      '@storybook/addon-a11y',
      '@storybook/addon-vitest',
    ]) {
      expect(dev[name]).toMatch(/^\^10\./);
    }
    expect(dev['@vitest/browser-playwright']).toBeDefined();
    expect(dev.playwright).toBeDefined();
  });
});

describe('storybook-web configuration', () => {
  it('uses the react-vite framework with the a11y and vitest addons', () => {
    const main = read('apps/storybook-web/.storybook/main.ts');
    expect(main).toContain("name: '@storybook/react-vite'");
    expect(main).toContain("'@storybook/addon-a11y'");
    expect(main).toContain("'@storybook/addon-vitest'");
    expect(main).toContain("'../src/**/*.stories.@(ts|tsx)'");
    expect(main).toContain('disableTelemetry: true');
  });

  it('fails stories on accessibility violations', () => {
    expect(read('apps/storybook-web/.storybook/preview.tsx')).toContain("test: 'error'");
  });

  it('exposes locale, colour scheme, direction and motion in the toolbar', () => {
    const preview = read('apps/storybook-web/.storybook/preview.tsx');
    for (const name of ['locale', 'scheme', 'direction', 'motion']) {
      expect(preview).toContain(`${name}: {`);
    }
    for (const value of [
      "'en'",
      "'pt-BR'",
      "'es'",
      "'light'",
      "'dark'",
      "'rtl'",
      "'reduced'",
    ]) {
      expect(preview).toContain(value);
    }
    expect(preview).toContain('data-od-theme');
  });

  it('runs the story tests in a browser through Playwright', () => {
    const vitest = read('apps/storybook-web/vitest.config.ts');
    expect(vitest).toContain('storybookTest');
    expect(vitest).toContain("name: 'storybook'");
    expect(vitest).toContain('@vitest/browser-playwright');
  });

  it('loads no remote font or stylesheet', () => {
    for (const path of files('apps/storybook-web', (p) => /\.(tsx?|html|css)$/.test(p))) {
      expect(read(path)).not.toMatch(/https?:\/\/(fonts\.|cdn\.)/);
    }
  });

  it('covers every piece and the detector states with stories', () => {
    const stories = files('apps/storybook-web/src', (p) => p.endsWith('.stories.tsx'))
      .map((p) => p.split('/').pop())
      .sort();
    expect(stories).toEqual([
      'Banner.stories.tsx',
      'FullScreen.stories.tsx',
      'Indicator.stories.tsx',
      'OfflineDetector.stories.tsx',
      'Snackbar.stories.tsx',
    ]);
    const detector = read('apps/storybook-web/src/OfflineDetector.stories.tsx');
    for (const name of [
      'Online',
      'Offline',
      'Recovering',
      'Checking',
      'FullScreen',
      'Dismissed',
    ]) {
      expect(detector).toContain(`export const ${name}:`);
    }
  });

  it('imports the packages by their published names, never from src or dist', () => {
    const sources = files(
      'apps/storybook-web',
      (p) => /\.(ts|tsx)$/.test(p) && !p.endsWith('.d.ts'),
    );
    expect(sources.length).toBeGreaterThan(5);
    for (const path of sources) {
      const text = read(path);
      expect(text).not.toMatch(/(from|import)\s*\(?\s*['"][^'"]*packages\//);
      expect(text).not.toMatch(
        /['"]@rogeriodocarmo\/offline-detector-[a-z]+\/(src|dist)[/'"]/,
      );
      expect(text).not.toMatch(/['"][^'"]*\/(src|dist)\/[^'"]*offline-detector/);
    }
  });

  it('keeps the story tests off the network', () => {
    const fakes = read('apps/storybook-web/.storybook/fakes.ts');
    expect(fakes).toContain('createFakeAdapter');
    expect(fakes).toContain('createFakeFetch');
    for (const path of files('apps/storybook-web/src', (p) =>
      p.endsWith('.stories.tsx'),
    )) {
      expect(read(path)).not.toMatch(/https?:\/\/(?!a\.test)/);
    }
  });
});

describe('storybook workflow', () => {
  const wf = () => workflow('storybook.yml');
  const steps = () => wf().jobs.storybook.steps as Array<Record<string, string>>;

  it('runs on every pull request and on pushes to main and develop', () => {
    expect(wf().on.pull_request.branches).toEqual(['main', 'develop']);
    expect(wf().on.push.branches).toEqual(['main', 'develop']);
    expect(wf().on.workflow_dispatch).toBeUndefined();
  });

  it('is read-only and uses no secrets', () => {
    expect(wf().permissions).toEqual({ contents: 'read' });
    expect(read('.github/workflows/storybook.yml')).not.toContain('secrets.');
  });

  it('builds the packages, builds Storybook and runs the story tests', () => {
    const runs = steps().map((s) => s.run);
    expect(runs).toContain('pnpm install --frozen-lockfile');
    expect(runs).toContain('pnpm build');
    expect(runs).toContain('pnpm --filter @offline-detector/storybook-web test:stories');
    expect(runs.join('\n')).toContain('playwright install --with-deps chromium');
  });

  it('never talks to Chromatic', () => {
    expect(read('.github/workflows/storybook.yml').toLowerCase()).not.toContain(
      'chromatic',
    );
  });
});

describe('chromatic workflow', () => {
  const text = () => read('.github/workflows/chromatic.yml');
  const wf = () => workflow('chromatic.yml');

  it('is manual only', () => {
    expect(Object.keys(wf().on)).toEqual(['workflow_dispatch']);
    expect(text()).not.toMatch(/pull_request|push:|schedule:|workflow_run/);
  });

  it('requires the confirm_paid_snapshot input', () => {
    const input = wf().on.workflow_dispatch.inputs.confirm_paid_snapshot;
    expect(input.required).toBe(true);
    expect(input.type).toBe('string');
    expect(input.default).toBe('no');
  });

  it('fails fast in a guard job that has no checkout and no secret', () => {
    const guard = wf().jobs.guard;
    expect(guard.steps).toHaveLength(1);
    expect(guard.steps[0].name).toBe('Refuse without confirmation');
    expect(guard.steps[0].env).toEqual({
      CONFIRM: '${{ inputs.confirm_paid_snapshot }}',
    });
    expect(guard.steps[0].run).toContain('"$CONFIRM" != "yes"');
    expect(guard.steps[0].run).toContain('exit 1');
    expect(JSON.stringify(guard)).not.toContain('secrets.');
  });

  it('runs the snapshot job only after the guard', () => {
    expect(Object.keys(wf().jobs)).toEqual(['guard', 'chromatic']);
    expect(wf().jobs.chromatic.needs).toBe('guard');
  });

  it('uses the project token in the snapshot step only', () => {
    const steps = wf().jobs.chromatic.steps as Array<Record<string, unknown>>;
    expect(text().match(/CHROMATIC_PROJECT_TOKEN/g)).toHaveLength(1);
    const snapshot = steps.find((s) => String(s.uses).startsWith('chromaui/action'));
    expect(snapshot).toBeDefined();
    expect(JSON.stringify(snapshot)).toContain('secrets.CHROMATIC_PROJECT_TOKEN');
  });
});
