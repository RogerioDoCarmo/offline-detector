import { readdirSync, readFileSync } from 'node:fs';
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
      'node scripts/verify-pack.cjs',
      'pnpm typecheck',
      'pnpm typecheck:tests',
      'pnpm lint',
      'pnpm format:check',
      'pnpm lint:md',
      'pnpm test:ci',
      // The Sonar gate: reports whether the secret exists, runs no repository code.
      'if [ -n "${SONAR_TOKEN}" ]; then echo "present=true" >> "$GITHUB_OUTPUT"; fi\n',
    ]);
  });

  it('turns Turborepo, Next.js and Storybook telemetry off in every job', () => {
    expect(ci().env).toEqual({
      TURBO_TELEMETRY_DISABLED: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
    });
  });

  it('keeps the Sonar token out of the job environment, on the Sonar step only', () => {
    const job = ci().jobs.verify;
    expect(job.env).toBeUndefined();
    const sonar = job.steps.find((step: { name?: string }) => step.name === 'SonarCloud');
    expect(sonar.env).toEqual({ SONAR_TOKEN: '${{ secrets.SONAR_TOKEN }}' });
    // A step's env is invisible to its own `if`, so a gate step reports whether the secret exists.
    expect(sonar.if).toContain("steps.sonar.outputs.present == 'true'");
    expect(sonar.if).not.toContain('env.SONAR_TOKEN');
    const gate = job.steps.find((step: { id?: string }) => step.id === 'sonar');
    expect(gate.env).toEqual({ SONAR_TOKEN: '${{ secrets.SONAR_TOKEN }}' });
    expect(read('.github/workflows/ci.yml').match(/secrets\.SONAR_TOKEN/g)).toHaveLength(
      2,
    );
  });

  it('never puts a PR-derived value into a shell script directly', () => {
    const steps = ci().jobs.mutation.steps;
    const stryker = steps.find((step: { name?: string }) => step.name === 'Stryker');
    expect(stryker.run).toBe('pnpm mutation --mutate "$MUTATE"');
    expect(stryker.env).toEqual({ MUTATE: '${{ steps.scope.outputs.mutate }}' });
    const scope = steps.find((step: { id?: string }) => step.id === 'scope');
    expect(scope.run).not.toContain('${{');
    expect(scope.env).toEqual({ BASE: '${{ github.event.pull_request.base.sha }}' });
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

describe('every workflow', () => {
  const files = readdirSync(join(root, '.github/workflows')).filter((f) =>
    f.endsWith('.yml'),
  );

  it('is one of the seven this test expects', () => {
    expect(files).toEqual([
      'chromatic.yml',
      'ci.yml',
      'e2e.yml',
      'maestro.yml',
      'pages.yml',
      'release.yml',
      'storybook.yml',
    ]);
  });

  it.each(files)('%s switches Turborepo, Next.js and Storybook telemetry off', (file) => {
    const env = parse(read(`.github/workflows/${file}`)).env;
    expect(env).toMatchObject({
      TURBO_TELEMETRY_DISABLED: '1',
      NEXT_TELEMETRY_DISABLED: '1',
      STORYBOOK_DISABLE_TELEMETRY: '1',
    });
  });

  it('pins the third-party actions by the commit their version tag points at', () => {
    // Resolved with `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`, dereferencing annotated tags.
    const wanted: Record<string, string> = {
      'SonarSource/sonarqube-scan-action':
        'd209202bc7d53ff1cc128f7f907dac145c9d6ae9 # v8',
      'chromaui/action': '07791f8243f4cb2698bf4d00426baf4b2d1cb7e0 # v13',
      'reactivecircus/android-emulator-runner':
        'a421e43855164a8197daf9d8d40fe71c6996bb0d # v2',
    };
    const all = files.map((f) => read(`.github/workflows/${f}`)).join('\n');
    for (const [action, pin] of Object.entries(wanted)) {
      expect(all).toContain(`uses: ${action}@${pin}`);
    }
    expect(all).not.toMatch(/uses: (SonarSource|chromaui|reactivecircus)\/\S+@v\d/);
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
      '## Enable CodeQL default setup',
      '## Enable GitHub Pages',
      '## Create the npm-publish environment',
    ]) {
      expect(text).toContain(heading);
    }
  });
});
