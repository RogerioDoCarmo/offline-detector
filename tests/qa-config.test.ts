import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setImmediate as nodeSetImmediate } from 'node:timers';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const pkg = () => JSON.parse(read('package.json'));
const ci = () => parse(read('.github/workflows/ci.yml'));

describe('root test type-check', () => {
  it('covers tests/ and e2e/ with node and jest types', () => {
    const tsconfig = JSON.parse(read('tsconfig.json'));
    expect(tsconfig.extends).toBe('./tsconfig.base.json');
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
    expect(tsconfig.compilerOptions.types).toEqual(['node', 'jest']);
    expect(tsconfig.include).toEqual(['tests', 'e2e', 'playwright.config.ts']);
  });

  it('declares @types/node and exposes the script', () => {
    expect(pkg().devDependencies['@types/node']).toBeDefined();
    expect(pkg().scripts['typecheck:tests']).toBe('tsc -p tsconfig.json');
  });
});

describe('sonarcloud', () => {
  const props = (): Record<string, string> =>
    Object.fromEntries(
      read('sonar-project.properties')
        .split('\n')
        .filter((line) => line.includes('=') && !line.startsWith('#'))
        .map((line) => [
          line.slice(0, line.indexOf('=')),
          line.slice(line.indexOf('=') + 1),
        ]),
    );

  it('names the project and organisation', () => {
    expect(props()['sonar.projectKey']).toBe('RogerioDoCarmo_offline-detector');
    expect(props()['sonar.organization']).toBe('rogeriodocarmo');
  });

  it('analyses package sources and demo apps, with tests told apart', () => {
    expect(props()['sonar.inclusions']).toBe('packages/*/src/**,apps/**');
    expect(props()['sonar.test.inclusions']).toBe('**/*.test.ts,**/*.test.tsx');
    expect(props()['sonar.javascript.lcov.reportPaths']).toBe('coverage/lcov.info');
  });

  it('keeps generated folders out of the analysis', () => {
    const exclusions = (props()['sonar.exclusions'] ?? '').split(',');
    for (const folder of [
      'node_modules',
      'dist',
      'coverage',
      '.stryker-tmp',
      'reports',
      'storybook-static',
      'playwright-report',
      '.superpowers',
    ]) {
      expect(exclusions).toContain(`**/${folder}/**`);
    }
  });

  it('runs a non-blocking scan in the verify job after the tests', () => {
    const steps = ci().jobs.verify.steps;
    const index = steps.findIndex((s: { uses?: string }) =>
      s.uses?.startsWith('SonarSource/sonarqube-scan-action'),
    );
    expect(steps[index].uses).toBe(
      'SonarSource/sonarqube-scan-action@d209202bc7d53ff1cc128f7f907dac145c9d6ae9',
    );
    expect(steps[index]['continue-on-error']).toBe(true);
    expect(steps[index].if).toBe(
      "github.actor != 'dependabot[bot]' && " +
        'github.event.pull_request.head.repo.fork != true && ' +
        "steps.sonar.outputs.present == 'true'",
    );
    // The secret reaches the scan step and the gate step before it, never the whole job.
    expect(steps[index - 2].run).toBe('pnpm test:ci');
    expect(steps[index].env).toEqual({ SONAR_TOKEN: '${{ secrets.SONAR_TOKEN }}' });
    expect(ci().jobs.verify.env).toBeUndefined();
    expect(steps[0].with).toEqual({ 'fetch-depth': 0 });
  });

  it('tells the owner how to create the project and the secret', () => {
    const text = read('docs/OWNER-ACTIONS.md');
    expect(text).toContain('## Set up SonarCloud');
    expect(text).toContain('Automatic Analysis');
    expect(text).toContain('SONAR_TOKEN');
  });
});

describe('stryker', () => {
  const config = () => JSON.parse(read('stryker.config.json'));

  it('uses a flat Jest config because Stryker cannot apply a multi-project one', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const flat = require('../jest.stryker.config.cjs');
    expect(flat.projects).toBeUndefined();
    expect(flat.testEnvironment).toBe('@stryker-mutator/jest-runner/jest-env/jsdom');
    const roots = flat.roots.map(
      (root: string) => root.replaceAll('\\', '/').split('/packages/')[1],
    );
    expect(roots).toEqual(['core/src', 'react/src']);
    // The SSR test opts into node with a docblock, which cannot report per-test coverage.
    expect(flat.testPathIgnorePatterns).toContain('ssr\\.test\\.tsx$');
  });

  it("declares the jsdom package that Stryker's jsdom environment wraps", () => {
    // Stryker's own environment requires jest-environment-jsdom from the root; without it the
    // dry run fails with MODULE_NOT_FOUND before a single mutant runs.
    expect(pkg().devDependencies['jest-environment-jsdom']).toMatch(/^\^30\./);
  });

  it("restores Node's setImmediate in the jsdom environment, which core's test helpers use", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const flat = require('../jest.stryker.config.cjs');
    expect(
      flat.setupFiles.map((file: string) => file.replaceAll('\\', '/').split('/').pop()),
    ).toEqual(['jest.stryker.setup.cjs']);
    const original = globalThis.setImmediate;
    // @ts-expect-error simulating the jsdom environment, where the global does not exist
    delete globalThis.setImmediate;
    try {
      expect(typeof globalThis.setImmediate).toBe('undefined');
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../jest.stryker.setup.cjs');
      });
      expect(globalThis.setImmediate).toBe(nodeSetImmediate);
    } finally {
      globalThis.setImmediate = original;
    }
  });

  it('runs Jest with per-test coverage analysis', () => {
    expect(config().testRunner).toBe('jest');
    expect(config().jest).toEqual({
      projectType: 'custom',
      configFile: 'jest.stryker.config.cjs',
    });
    expect(config().coverageAnalysis).toBe('perTest');
    expect(config().plugins).toEqual(['@stryker-mutator/jest-runner']);
    expect(config().concurrency).toBe(4);
  });

  it('mutates core and react source, never tests, stories or barrels', () => {
    expect(config().mutate).toEqual([
      'packages/core/src/**/*.ts',
      'packages/react/src/**/*.{ts,tsx}',
      '!**/*.test.{ts,tsx}',
      '!**/*.stories.{ts,tsx}',
      '!**/index.ts',
    ]);
  });

  it('breaks the build below 60 and aims for 80', () => {
    expect(config().thresholds).toEqual({ high: 80, low: 60, break: 60 });
  });

  it('keeps build output and caches out of the sandbox', () => {
    expect(config().ignorePatterns).toEqual([
      'dist',
      '.turbo',
      '.next',
      '.expo',
      'coverage',
      'reports',
      'storybook-static',
      'playwright-report',
      'test-results',
    ]);
    expect(config().tempDirName).toBe('.stryker-tmp');
  });

  it('exposes the mutation script', () => {
    expect(pkg().scripts.mutation).toBe('stryker run');
  });

  describe('CI job', () => {
    const job = () => ci().jobs.mutation;
    const step = (name: string) =>
      job().steps.find((s: { name?: string }) => s.name === name);

    it('runs on pull requests only, with full history', () => {
      expect(job().if).toBe("github.event_name == 'pull_request'");
      expect(job().steps[0].with).toEqual({ 'fetch-depth': 0 });
    });

    it('mutates only the sources the PR touches, mapping tests back to sources', () => {
      const script: string = step('Find the mutated source this PR touches').run;
      expect(script).toContain('git diff --name-only --diff-filter=ACMR');
      expect(script).toContain('"$BASE"');
      expect(step('Find the mutated source this PR touches').env).toEqual({
        BASE: '${{ github.event.pull_request.base.sha }}',
      });
      expect(script).toContain('packages/core/src packages/react/src');
      expect(script).toContain("sed -E 's/\\.test\\.(ts|tsx)$/.\\1/'");
    });

    it('passes the scope without a double dash and uploads the report', () => {
      const stryker = step('Stryker');
      expect(stryker.if).toBe("steps.scope.outputs.run == 'true'");
      expect(stryker.run).toBe('pnpm mutation --mutate "$MUTATE"');
      expect(stryker.env).toEqual({ MUTATE: '${{ steps.scope.outputs.mutate }}' });
      expect(step('Upload mutation report').with.path).toBe('reports/mutation/');
    });
  });
});

type PwConfig = {
  projects: Array<{ name: string }>;
  retries: number;
  workers?: number;
  forbidOnly: boolean;
  reporter: string[][];
  use: Record<string, unknown>;
  webServer: { reuseExistingServer: boolean };
};

describe('playwright config', () => {
  const load = (ci: boolean) => {
    const saved = { CI: process.env.CI, URL: process.env.PLAYWRIGHT_BASE_URL };
    if (ci) process.env.CI = '1';
    else delete process.env.CI;
    delete process.env.PLAYWRIGHT_BASE_URL;
    try {
      let config = {} as PwConfig;
      jest.isolateModules(() => {
        // Playwright refuses to be required from inside another runner, and only `defineConfig`
        // (an identity function) and `devices` (device presets) matter for these assertions.
        jest.doMock('@playwright/test', () => ({
          defineConfig: (c: unknown) => c,
          devices: new Proxy({}, { get: (_t, name) => ({ preset: name }) }),
        }));
        const loaded = jest.requireActual('../playwright.config') as {
          default: PwConfig;
        };
        config = loaded.default;
      });
      return config;
    } finally {
      if (saved.CI === undefined) delete process.env.CI;
      else process.env.CI = saved.CI;
      if (saved.URL !== undefined) process.env.PLAYWRIGHT_BASE_URL = saved.URL;
    }
  };

  it('runs the five browser projects', () => {
    expect(load(false).projects.map((p) => p.name)).toEqual([
      'chromium',
      'firefox',
      'webkit',
      'mobile-chrome',
      'mobile-safari',
    ]);
  });

  it('retries and parallelises only on CI, and forbids test.only there', () => {
    expect(load(true)).toMatchObject({ retries: 1, workers: 4, forbidOnly: true });
    expect(load(false)).toMatchObject({ retries: 0, forbidOnly: false });
    expect(load(false).workers).toBeUndefined();
  });

  it('reports to GitHub on CI only', () => {
    const names = (c: PwConfig) => c.reporter.map((r) => r[0]);
    expect(names(load(true))).toEqual(['list', 'html', 'github']);
    expect(names(load(false))).toEqual(['list', 'html']);
  });

  it('keeps evidence of failures only', () => {
    expect(load(false).use).toMatchObject({
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      baseURL: 'http://127.0.0.1:4173',
    });
  });

  it('serves the fixture site with a dependency-free node script', () => {
    expect(load(false).webServer).toMatchObject({
      command: 'node e2e/fixtures/serve.mjs',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
    });
    expect(load(true).webServer.reuseExistingServer).toBe(false);
  });

  it('exposes the e2e scripts', () => {
    expect(pkg().scripts['test:e2e']).toBe('playwright test');
    expect(pkg().scripts['test:e2e:chromium']).toBe('playwright test --project=chromium');
  });
});

describe('e2e workflow', () => {
  const e2e = () => parse(read('.github/workflows/e2e.yml'));
  // The matrix is `fromJSON(<PR event> && '<chromium only>' || '<full matrix>')`.
  const matrixes = () => {
    type Matrix = { include: Array<Record<string, string>> };
    const parts = /&& '(\{.*?\})' \|\| '(\{.*?\})'/.exec(e2e().jobs.e2e.strategy.matrix);
    return {
      pr: JSON.parse(parts?.[1] ?? '{}') as Matrix,
      full: JSON.parse(parts?.[2] ?? '{}') as Matrix,
    };
  };

  it('runs on PRs, pushes to main and develop, a 02:00 UTC cron and by hand', () => {
    expect(e2e().on.pull_request.branches).toEqual(['main', 'develop']);
    expect(e2e().on.push.branches).toEqual(['main', 'develop']);
    expect(e2e().on.schedule).toEqual([{ cron: '0 2 * * *' }]);
    expect(e2e().on).toHaveProperty('workflow_dispatch');
  });

  it('disables Turborepo telemetry and reads the repository only', () => {
    expect(e2e().env).toEqual({
      TURBO_TELEMETRY_DISABLED: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
    });
    expect(e2e().permissions).toEqual({ contents: 'read' });
  });

  it('runs chromium only on PRs and the whole matrix elsewhere', () => {
    const expression: string = e2e().jobs.e2e.strategy.matrix;
    expect(expression).toContain("github.event_name == 'pull_request'");
    expect(matrixes().pr.include).toEqual([{ project: 'chromium', browser: 'chromium' }]);
    expect(matrixes().full.include).toEqual([
      { project: 'chromium', browser: 'chromium' },
      { project: 'firefox', browser: 'firefox' },
      { project: 'webkit', browser: 'webkit' },
      { project: 'mobile-chrome', browser: 'chromium' },
      { project: 'mobile-safari', browser: 'webkit' },
    ]);
  });

  it('installs only the browser the project needs, with a cache', () => {
    const steps = e2e().jobs.e2e.steps;
    const cache = steps.find((s: { uses?: string }) =>
      s.uses?.startsWith('actions/cache'),
    );
    expect(cache.with.path).toBe('~/.cache/ms-playwright');
    expect(cache.with.key).toBe(
      "playwright-${{ runner.os }}-${{ matrix.browser }}-${{ hashFiles('pnpm-lock.yaml') }}",
    );
    const runs = steps.map((s: { run?: string }) => s.run).filter(Boolean);
    expect(runs).toContain(
      'pnpm exec playwright install --with-deps ${{ matrix.browser }}',
    );
    expect(runs).toContain('pnpm exec playwright install-deps ${{ matrix.browser }}');
    expect(runs).toContain('pnpm exec playwright test --project=${{ matrix.project }}');
  });

  it('uploads the report always and traces on failure', () => {
    const uploads = e2e().jobs.e2e.steps.filter((s: { uses?: string }) =>
      s.uses?.startsWith('actions/upload-artifact'),
    );
    expect(uploads.map((u: { with: { path: string } }) => u.with.path)).toEqual([
      'playwright-report/',
      'test-results/',
    ]);
    expect(uploads[0].if).toBe('always()');
    expect(uploads[1].if).toBe('failure()');
  });
});
