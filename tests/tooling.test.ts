import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

describe('tooling', () => {
  it('uses the same Prettier style as morse_app', () => {
    expect(JSON.parse(read('.prettierrc'))).toEqual({
      semi: true,
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 90,
      tabWidth: 2,
      arrowParens: 'always',
    });
  });

  it('installs git hooks on every fresh clone', () => {
    expect(JSON.parse(read('package.json')).scripts.prepare).toBe('husky');
  });

  it('runs lint-staged before each commit', () => {
    expect(read('.husky/pre-commit').trim()).toBe('pnpm lint-staged');
  });

  it('runs typecheck and tests before each push', () => {
    expect(read('.husky/pre-push').trim()).toBe('pnpm typecheck && pnpm test --silent');
  });

  it('lints and formats staged files', () => {
    expect(JSON.parse(read('.lintstagedrc.json'))).toEqual({
      '*.{ts,tsx,js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
      '*.{json,md,yml,yaml,css,html}': ['prettier --write'],
    });
  });

  it('wraps markdown prose at 100 but exempts tables and code blocks', () => {
    const text = read('.markdownlint.jsonc');
    expect(text).toContain(
      '"MD013": { "line_length": 100, "tables": false, "code_blocks": false }',
    );
    expect(text).toContain('"MD024": { "siblings_only": true }');
  });

  it('keeps generated folders out of lint and format', () => {
    for (const file of ['.prettierignore', '.markdownlintignore']) {
      const lines = read(file).split('\n');
      expect(lines).toContain('node_modules');
      expect(lines).toContain('CHANGELOG.md');
    }
    expect(read('eslint.config.js')).toContain("'**/dist/**'");
  });
});
