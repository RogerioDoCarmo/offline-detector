import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const names = ['core', 'react', 'web', 'native'] as const;

// Every string leaf of an `exports` map is a file the package promises to ship.
const leaves = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : Object.values(value as Record<string, unknown>).flatMap(leaves);

// In CI the build runs first, so a missing file is a failure. Locally the tests can run before
// any build, so they only check packages that have been built.
const strict = Boolean(process.env.CI);

describe.each(names)('built output of package %s', (name) => {
  const dir = join(root, 'packages', name);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const built = existsSync(join(dir, 'dist'));
  const run = strict || built ? it : it.skip;

  run('contains every file the exports map names', () => {
    const promised = leaves(manifest.exports);
    expect(promised.sort()).toEqual([
      './dist/index.cjs',
      './dist/index.d.cts',
      './dist/index.d.ts',
      './dist/index.js',
    ]);
    for (const file of promised) {
      expect({ file, exists: existsSync(join(dir, file)) }).toEqual({
        file,
        exists: true,
      });
    }
  });

  run(
    'is compiled with the automatic JSX runtime, so consumers need no React in scope',
    () => {
      // The classic runtime emits `React.createElement` with no React import, which throws
      // "React is not defined" in any consumer of the published bundle.
      for (const file of ['dist/index.js', 'dist/index.cjs']) {
        const code = readFileSync(join(dir, file), 'utf8');
        expect({
          file,
          usesClassicRuntime: /\bReact\.createElement\b/.test(code),
        }).toEqual({
          file,
          usesClassicRuntime: false,
        });
      }
    },
  );

  run('contains the legacy entry fields too', () => {
    for (const field of ['main', 'module', 'types'] as const) {
      const file = manifest[field] as string;
      expect({ field, exists: existsSync(join(dir, file)) }).toEqual({
        field,
        exists: true,
      });
    }
  });
});
