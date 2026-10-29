import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const workspace = parse(readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8')) as {
  overrides?: Record<string, string>;
};
const lockfile = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8');

// Each entry is the first patched release of a published advisory that Dependabot cannot fix in
// a pnpm lockfile on its own. node-forge and sprintf-js have no patched release, so they are
// deliberately absent: an override cannot fix what has no fix.
const EXPECTED: Record<string, string> = {
  'body-parser@1': '^1.20.9',
  'fast-uri': '^3.1.9',
  katex: '^0.18.2',
  'markdown-it': '^15.0.3',
  qs: '^6.16.1',
  'postcss-selector-parser': '^7.1.6',
  'serialize-javascript': '^7.1.3',
  'smol-toml': '^1.9.0',
  tinypool: '^2.1.2',
  uuid: '^11.1.1',
  'zod@4': '^4.6.6',
};

describe('pnpm overrides for vulnerable transitive dependencies', () => {
  it('pins exactly the patched ranges', () => {
    expect(workspace.overrides).toEqual(EXPECTED);
  });

  it('uses caret ranges only: an open-ended range resolves to the highest major', () => {
    for (const [name, range] of Object.entries(workspace.overrides ?? {})) {
      expect({ name, ok: /^\^\d+\.\d+\.\d+$/.test(range) }).toEqual({ name, ok: true });
    }
  });

  it.each([
    ['katex', '0.16.47'],
    ['markdown-it', '15.0.1'],
    ['qs', '6.15.1'],
    ['qs', '6.16.0'],
    ['serialize-javascript', '6.0.2'],
    ['smol-toml', '1.8.0'],
    ['tinypool', '1.1.1'],
    ['uuid', '7.0.3'],
    ['uuid', '8.3.2'],
    ['body-parser', '1.20.8'],
    ['fast-uri', '3.1.8'],
    ['serialize-javascript', '7.1.2'],
    ['zod', '4.6.5'],
  ])('the lockfile no longer resolves %s@%s', (name, version) => {
    expect(lockfile).not.toContain(`\n  ${name}@${version}`);
  });
});
