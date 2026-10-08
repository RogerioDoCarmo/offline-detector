import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

describe('workspace', () => {
  it('declares packages/* and apps/* as workspaces', () => {
    expect(parse(read('pnpm-workspace.yaml')).packages).toEqual(['packages/*', 'apps/*']);
  });

  it('is a private root pinned to pnpm 10', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.private).toBe(true);
    expect(pkg.packageManager).toMatch(/^pnpm@10\./);
  });

  it('commits the lockfile so CI can install with --frozen-lockfile', () => {
    expect(existsSync(join(root, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('pins node 24.15.0 like morse_app', () => {
    expect(read('.nvmrc').trim()).toBe('24.15.0');
  });

  it('is MIT licensed to the owner for 2026', () => {
    const license = read('LICENSE');
    expect(license).toContain('MIT License');
    expect(license).toContain('Copyright (c) 2026 Rogério do Carmo');
  });

  it('ignores build output, caches and local env files', () => {
    const lines = read('.gitignore').split('\n');
    for (const entry of [
      'node_modules',
      'dist',
      'coverage',
      '.stryker-tmp',
      '.turbo',
      '.next',
      'storybook-static',
      '.superpowers',
      '.env*.local',
    ]) {
      expect(lines).toContain(entry);
    }
  });

  it('forces LF line endings so Windows checkouts do not break Prettier or hooks', () => {
    expect(read('.gitattributes')).toContain('* text=auto eol=lf');
  });

  it('tells agents to use Git Flow and never rebase', () => {
    const claude = read('CLAUDE.md');
    expect(claude).toMatch(/never rebase/i);
    expect(claude).toContain('develop');
    expect(claude).toContain('docs/superpowers/specs/2026-10-07-offline-detector-design.md');
  });

  it('has a strict TypeScript base config', () => {
    const base = JSON.parse(read('tsconfig.base.json'));
    expect(base.compilerOptions.strict).toBe(true);
    expect(base.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(base.compilerOptions.moduleResolution).toBe('Bundler');
  });
});
