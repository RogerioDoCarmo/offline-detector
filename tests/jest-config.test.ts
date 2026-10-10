import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const names = ['core', 'react', 'web', 'native'] as const;

describe('jest layout', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rootConfig = () => require('../jest.config.js');

  it('runs one project for repo meta-tests and one per package', () => {
    const projects = rootConfig().projects;
    expect(projects).toHaveLength(2);
    expect(projects[1]).toBe('packages/*/jest.config.cjs');
    expect(projects[0].displayName).toBe('repo');
  });

  it('keeps the 80% coverage gate at the root', () => {
    expect(rootConfig().coverageThreshold).toEqual({
      global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    });
  });

  it('uses relative globs only, so a dot-folder in the checkout path cannot break matching', () => {
    // Jest 30 on Windows mangles absolute <rootDir> globs when the path contains ".claude".
    const text = read('jest.config.js') + read('jest.base.js');
    expect(text).not.toContain('<rootDir>');
  });

  it.each(names)('package %s owns its jest config and test location', (name) => {
    expect(existsSync(join(root, `packages/${name}/jest.config.cjs`))).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(`../packages/${name}/jest.config.cjs`);
    expect(config.displayName).toBe(name);
    expect(config.testMatch).toEqual(['**/src/**/*.test.{ts,tsx}']);
    expect(config.rootDir).toBe(join(root, 'packages', name));
    expect(config.collectCoverageFrom).toEqual([
      'src/**/*.{ts,tsx}',
      '!**/*.test.{ts,tsx}',
      '!**/*.d.ts',
      '!**/*.stories.{ts,tsx}',
    ]);
  });
});

describe('tests do not depend on build output', () => {
  // CI jobs that do not build (mutation, E2E) failed with "Cannot find module" because workspace
  // packages resolved each other through dist. Tests resolve them from source instead; the
  // built-output tests in dist-exports.test.ts cover dist separately.
  const sourceOf = (name: string) =>
    new RegExp(`packages[\\\\/]${name}[\\\\/]src[\\\\/]index\\.ts$`);

  it.each([...names, 'stryker'])(
    'the %s project maps core and react to their source',
    (name) => {
      const path =
        name === 'stryker'
          ? '../jest.stryker.config.cjs'
          : `../packages/${name}/jest.config.cjs`;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mapper = require(path).moduleNameMapper;
      expect(mapper['^@rogeriodocarmo/offline-detector-core$']).toMatch(sourceOf('core'));
      expect(mapper['^@rogeriodocarmo/offline-detector-react$']).toMatch(
        sourceOf('react'),
      );
    },
  );

  it('bundles the E2E fixture from source too', () => {
    const build = read('e2e/web-ui-fixture/build.mjs');
    expect(build).toContain("'@rogeriodocarmo/offline-detector-core'");
    expect(build).toContain("'../../packages/core/src/index.ts'");
  });
});

describe('worktree hygiene', () => {
  it('git-ignores agent worktrees and keeps linters out of them', () => {
    expect(read('.gitignore').split('\n')).toContain('.claude/worktrees');
    expect(read('eslint.config.js')).toContain("'**/.claude/**'");
    const lintMd: string = JSON.parse(read('package.json')).scripts['lint:md'];
    expect(lintMd).toContain('"#.claude"');
  });
});
