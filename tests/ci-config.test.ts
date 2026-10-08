import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');

describe('ci workflow', () => {
  const ci = () => parse(read('.github/workflows/ci.yml'));

  it('runs on pushes and PRs to main and develop', () => {
    expect(ci().on.push.branches).toEqual(['main', 'develop']);
    expect(ci().on.pull_request.branches).toEqual(['main', 'develop']);
  });

  it('has read-only permissions by default', () => {
    expect(ci().permissions).toEqual({ contents: 'read' });
  });

  it('runs every quality gate in the verify job, in order', () => {
    const runs = ci()
      .jobs.verify.steps.map((step: { run?: string }) => step.run)
      .filter(Boolean);
    expect(runs).toEqual([
      'pnpm install --frozen-lockfile',
      'pnpm build',
      'pnpm typecheck',
      'pnpm typecheck:tests',
      'pnpm lint',
      'pnpm format:check',
      'pnpm lint:md',
      'pnpm test:ci',
    ]);
  });

  it('turns Turborepo telemetry off in every job', () => {
    expect(ci().env).toEqual({ TURBO_TELEMETRY_DISABLED: '1' });
  });

  it('installs pnpm from the packageManager field and node from .nvmrc', () => {
    const steps = ci().jobs.verify.steps;
    const node = steps.find((step: { uses?: string }) =>
      step.uses?.startsWith('actions/setup-node'),
    );
    expect(node.with).toEqual({ 'node-version-file': '.nvmrc', cache: 'pnpm' });
  });

  it('cancels superseded runs of the same ref', () => {
    expect(ci().concurrency).toEqual({
      group: 'ci-${{ github.ref }}',
      'cancel-in-progress': true,
    });
  });
});

describe('dependabot', () => {
  const config = () => parse(read('.github/dependabot.yml'));

  it('updates npm and github-actions weekly into develop', () => {
    const byEcosystem = Object.fromEntries(
      config().updates.map((u: { 'package-ecosystem': string }) => [
        u['package-ecosystem'],
        u,
      ]),
    );
    expect(Object.keys(byEcosystem).sort()).toEqual(['github-actions', 'npm']);
    for (const update of Object.values(byEcosystem) as Array<Record<string, unknown>>) {
      expect(update['target-branch']).toBe('develop');
      expect(update.schedule).toEqual({ interval: 'weekly' });
    }
  });

  it('never bumps the Expo and React Native family one package at a time', () => {
    const npm = config().updates.find(
      (u: { 'package-ecosystem': string }) => u['package-ecosystem'] === 'npm',
    );
    const ignored = npm.ignore.map(
      (rule: { 'dependency-name': string }) => rule['dependency-name'],
    );
    expect(ignored).toEqual(
      expect.arrayContaining([
        'expo',
        'expo-*',
        'react',
        'react-dom',
        'react-native',
        'react-native-*',
        '@react-native/*',
        '@react-native-community/netinfo',
        '@types/react',
        '@types/react-native',
      ]),
    );
  });
});

describe('changesets', () => {
  const config = () => JSON.parse(read('.changeset/config.json'));

  it('publishes publicly and versions against develop', () => {
    expect(config().access).toBe('public');
    expect(config().baseBranch).toBe('develop');
    expect(config().updateInternalDependencies).toBe('patch');
  });

  it('exposes the changeset script', () => {
    expect(JSON.parse(read('package.json')).scripts.changeset).toBe('changeset');
  });
});

describe('owner actions', () => {
  it('lists every outward-facing step that needs the owner go-ahead', () => {
    const text = read('docs/OWNER-ACTIONS.md');
    for (const heading of [
      '## Create the GitHub repository',
      '## Enable CodeQL default setup',
      '## Enable GitHub Pages',
      '## Create the npm-publish environment',
    ]) {
      expect(text).toContain(heading);
    }
  });
});
