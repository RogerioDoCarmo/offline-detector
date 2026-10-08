import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const pkg = () => JSON.parse(read('package.json'));

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
