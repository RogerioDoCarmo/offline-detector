import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const names = ['core', 'react', 'web', 'native'] as const;

describe.each(names)('package %s', (name) => {
  const dir = `packages/${name}`;
  const manifest = () => JSON.parse(read(`${dir}/package.json`));

  it('is published under the owner scope', () => {
    expect(manifest().name).toBe(`@rogeriodocarmo/offline-detector-${name}`);
  });

  it('is public MIT, and leaves provenance to npm trusted publishing', () => {
    // npm generates provenance automatically for trusted publishing from a public repository. Setting
    // publishConfig.provenance would make the owner's first publish from a laptop fail.
    expect(manifest().license).toBe('MIT');
    expect(manifest().publishConfig).toEqual({ access: 'public' });
  });

  it('ships ESM, CJS and types through a dual exports map', () => {
    expect(manifest().type).toBe('module');
    expect(manifest().exports).toEqual({
      '.': {
        import: { types: './dist/index.d.ts', default: './dist/index.js' },
        require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
      },
    });
    expect(manifest().types).toBe('./dist/index.d.ts');
    expect(manifest().files).toEqual(['dist']);
    expect(manifest().sideEffects).toBe(false);
  });

  it('depends only on the workspace packages below it, and declares its peers', () => {
    const wanted = {
      core: { dependencies: undefined, peerDependencies: undefined },
      react: {
        dependencies: { '@rogeriodocarmo/offline-detector-core': 'workspace:*' },
        peerDependencies: { react: '^18.0.0 || ^19.0.0' },
      },
      web: {
        dependencies: {
          '@rogeriodocarmo/offline-detector-core': 'workspace:*',
          '@rogeriodocarmo/offline-detector-react': 'workspace:*',
        },
        peerDependencies: {
          react: '^18.0.0 || ^19.0.0',
          'react-dom': '^18.0.0 || ^19.0.0',
        },
      },
      native: {
        dependencies: {
          '@rogeriodocarmo/offline-detector-core': 'workspace:*',
          '@rogeriodocarmo/offline-detector-react': 'workspace:*',
        },
        peerDependencies: {
          react: '^18.0.0 || ^19.0.0',
          'react-native': '>=0.73.0',
          '@react-native-community/netinfo': '>=11.0.0',
        },
      },
    }[name];
    expect(manifest().dependencies).toEqual(wanted.dependencies);
    expect(manifest().peerDependencies).toEqual(wanted.peerDependencies);
  });

  it('marks NetInfo as an optional peer on native only', () => {
    expect(manifest().peerDependenciesMeta).toEqual(
      name === 'native'
        ? { '@react-native-community/netinfo': { optional: true } }
        : undefined,
    );
  });

  it('builds and typechecks through the workspace scripts', () => {
    expect(manifest().scripts).toEqual({
      build: 'rslib build',
      typecheck: 'tsc --noEmit',
    });
  });

  it('excludes tests from the declaration build', () => {
    const build = JSON.parse(read(`${dir}/tsconfig.build.json`));
    expect(build.exclude).toEqual(['src/**/*.test.ts', 'src/**/*.test.tsx']);
    // TypeScript 6 (TS5011) refuses to emit declarations without an explicit rootDir.
    expect(build.compilerOptions).toEqual({ types: [], rootDir: './src' });
    expect(read(`${dir}/rslib.config.ts`)).toContain(
      "tsconfigPath: 'tsconfig.build.json'",
    );
  });

  it('has an entry that exports its own package name', () => {
    expect(existsSync(join(root, `${dir}/src/index.ts`))).toBe(true);
    expect(read(`${dir}/src/index.ts`)).toContain(
      `export const packageName = '@rogeriodocarmo/offline-detector-${name}';`,
    );
  });
});

describe('turbo', () => {
  const turbo = () => JSON.parse(read('turbo.json'));

  it('builds dependencies first and caches dist', () => {
    expect(turbo().tasks.build).toEqual({
      dependsOn: ['^build'],
      // dist: packages and the Expo export; .next and out: Next.js; build: Docusaurus.
      outputs: [
        'dist/**',
        '.next/**',
        '!.next/cache/**',
        'out/**',
        'build/**',
        'storybook-static/**',
      ],
    });
  });

  it('typechecks after dependencies are built', () => {
    expect(turbo().tasks.typecheck).toEqual({ dependsOn: ['^build'] });
  });

  it('does not let turbo write agent instruction files into the repo', () => {
    expect(turbo().agentGuidance).toBe(false);
  });

  it('never caches the dev task', () => {
    expect(turbo().tasks.dev).toEqual({ cache: false, persistent: true });
  });
});
