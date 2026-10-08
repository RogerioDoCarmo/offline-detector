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
