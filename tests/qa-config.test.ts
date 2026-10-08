import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    expect(steps[index].uses).toBe('SonarSource/sonarqube-scan-action@v8');
    expect(steps[index]['continue-on-error']).toBe(true);
    expect(steps[index].if).toBe(
      "github.actor != 'dependabot[bot]' && " +
        'github.event.pull_request.head.repo.fork != true && ' +
        "env.SONAR_TOKEN != ''",
    );
    expect(steps[index - 1].run).toBe('pnpm test:ci');
    expect(ci().jobs.verify.env).toEqual({ SONAR_TOKEN: '${{ secrets.SONAR_TOKEN }}' });
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

  it('runs Jest with per-test coverage analysis', () => {
    expect(config().testRunner).toBe('jest');
    expect(config().jest).toEqual({
      projectType: 'custom',
      configFile: 'jest.config.js',
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
      expect(script).toContain('github.event.pull_request.base.sha');
      expect(script).toContain('packages/core/src packages/react/src');
      expect(script).toContain("sed -E 's/\\.test\\.(ts|tsx)$/.\\1/'");
    });

    it('passes the scope without a double dash and uploads the report', () => {
      const stryker = step('Stryker');
      expect(stryker.if).toBe("steps.scope.outputs.run == 'true'");
      expect(stryker.run).toBe(
        'pnpm mutation --mutate "${{ steps.scope.outputs.mutate }}"',
      );
      expect(step('Upload mutation report').with.path).toBe('reports/mutation/');
    });
  });
});
