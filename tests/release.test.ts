/* eslint-disable @typescript-eslint/no-require-imports */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const { checkTag } = require('../scripts/check-release-tag.cjs');
const { checkPacked } = require('../scripts/verify-pack.cjs');

const root = join(__dirname, '..');
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const flat = (text: string): string => text.replace(/\s+/g, ' ');
const NAMES = ['core', 'react', 'web', 'native'] as const;
const scoped = (name: string): string => `@rogeriodocarmo/offline-detector-${name}`;

describe('versions and the first changeset', () => {
  it('versions the four packages together, as one fixed group', () => {
    const config = JSON.parse(read('.changeset/config.json'));
    expect(config.fixed).toEqual([NAMES.map(scoped)]);
    expect(config.access).toBe('public');
    expect(config.baseBranch).toBe('develop');
  });

  const pending = (): string[] =>
    readdirSync(join(root, '.changeset')).filter(
      (file) => file.endsWith('.md') && file !== 'README.md',
    );
  const versions = (): string[] =>
    NAMES.map((name) => JSON.parse(read(`packages/${name}/package.json`)).version);

  it('lets every pending changeset name only the four packages', () => {
    // Later PRs add changesets and `changeset version` deletes them, so the list is not fixed.
    for (const file of pending()) {
      const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(read(`.changeset/${file}`));
      expect({ file, hasFrontmatter: front !== null }).toEqual({
        file,
        hasFrontmatter: true,
      });
      const lines = (front?.[1] ?? '').split(/\r?\n/).filter(Boolean);
      const named = lines.map(
        (line) => /^'([^']+)':\s*(major|minor|patch)$/.exec(line)?.[1],
      );
      expect({ file, lines: lines.length > 0 }).toEqual({ file, lines: true });
      for (const name of named) {
        expect({ file, name, known: NAMES.map(scoped).includes(name ?? '') }).toEqual({
          file,
          name,
          known: true,
        });
      }
    }
  });

  it('requires the first-release changeset only while the packages are at 0.0.0', () => {
    if (versions().every((version) => version === '0.0.0')) {
      expect(pending()).toContain('initial-release.md');
      const text = read('.changeset/initial-release.md');
      for (const name of NAMES) expect(text).toContain(`'${scoped(name)}': minor`);
    } else {
      // `changeset version` consumed it; it must not come back.
      expect(pending()).not.toContain('initial-release.md');
    }
  });

  it.each(NAMES)('ships the license text inside the %s package', (name) => {
    expect(read(`packages/${name}/LICENSE`)).toBe(read('LICENSE'));
  });
});

describe('checkTag', () => {
  const same = { [scoped('core')]: '0.1.0', [scoped('react')]: '0.1.0' };

  it('accepts a tag equal to every package version', () => {
    expect(checkTag('v0.1.0', same)).toEqual([]);
  });

  it('names each package that disagrees with the tag', () => {
    expect(checkTag('v0.1.1', same)).toEqual([
      `${scoped('core')} is at 0.1.0 but the tag says 0.1.1.`,
      `${scoped('react')} is at 0.1.0 but the tag says 0.1.1.`,
    ]);
    expect(checkTag('v0.1.0', { ...same, [scoped('web')]: '0.0.9' })).toEqual([
      `${scoped('web')} is at 0.0.9 but the tag says 0.1.0.`,
    ]);
  });

  it('refuses pre-release tags, tags without the v, and anything else that is not semver', () => {
    for (const tag of [
      'v0.1.0-rc1',
      'v0.1.0+x',
      'v0.1.0+rc.1',
      '0.1.0',
      'v1.2',
      'release-1',
      'v1.2.3.4',
      '',
    ]) {
      const problems: string[] = checkTag(tag, same);
      expect({ tag, count: problems.length }).toEqual({ tag, count: 1 });
      expect(problems[0]).toContain('must look like v1.2.3');
    }
  });

  it('fails when there is nothing to publish instead of passing vacuously', () => {
    expect(checkTag('v0.1.0', {})).toEqual(['No publishable packages were found.']);
  });
});

describe('checkPacked', () => {
  const required = [
    'package.json',
    'README.md',
    'LICENSE',
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
  ];
  const manifest = () => ({
    name: scoped('react'),
    version: '0.1.0',
    license: 'MIT',
    repository: { url: 'git+https://github.com/RogerioDoCarmo/offline-detector.git' },
    publishConfig: { access: 'public' },
    exports: {
      '.': {
        import: { types: './dist/index.d.ts', default: './dist/index.js' },
        require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
      },
    },
    dependencies: { [scoped('core')]: '0.1.0' },
    peerDependencies: { react: '^18.0.0 || ^19.0.0' },
  });
  const pack = (over: Record<string, unknown> = {}) => ({
    manifest: manifest(),
    files: [...required],
    bytes: 12345,
    ...over,
  });

  it('accepts a correct tarball', () => {
    expect(checkPacked(pack())).toEqual([]);
  });

  it('rejects a workspace: dependency that pnpm failed to rewrite', () => {
    const m = manifest();
    m.dependencies[scoped('core')] = 'workspace:*';
    const problems: string[] = checkPacked(pack({ manifest: m }));
    expect(problems.some((p) => p.includes('workspace:'))).toBe(true);
  });

  it('requires sibling dependencies to be pinned to the package version', () => {
    const m = manifest();
    m.dependencies[scoped('core')] = '0.0.0';
    expect(checkPacked(pack({ manifest: m }))).toEqual([
      `${scoped('core')} must be pinned to 0.1.0 but is 0.0.0.`,
    ]);
  });

  it('rejects source, tests and stories that leaked into the tarball', () => {
    for (const leaked of [
      'src/index.ts',
      'dist/index.test.d.ts',
      'tests/helpers.ts',
      'x.stories.tsx',
    ]) {
      const problems: string[] = checkPacked(pack({ files: [...required, leaked] }));
      expect({ leaked, flagged: problems.some((p) => p.includes(leaked)) }).toEqual({
        leaked,
        flagged: true,
      });
    }
  });

  it.each(['LICENSE', 'README.md', 'dist/index.cjs'])(
    'requires %s to be present',
    (file) => {
      const problems: string[] = checkPacked(
        pack({ files: required.filter((f) => f !== file) }),
      );
      expect(problems.some((p) => p.includes(`missing ${file}`))).toBe(true);
    },
  );

  it('requires every file named by exports to be in the tarball', () => {
    const files = required.filter((f) => f !== 'dist/index.d.cts');
    const problems: string[] = checkPacked(pack({ files }));
    expect(problems).toContain(
      'exports names ./dist/index.d.cts but it is not in the tarball.',
    );
  });

  it('rejects a tarball larger than 300 KB', () => {
    expect(checkPacked(pack({ bytes: 300_001 }))).toEqual([
      'The tarball is 300001 bytes, larger than the 300000 byte limit.',
    ]);
    expect(checkPacked(pack({ bytes: 300_000 }))).toEqual([]);
  });

  it('checks the license, the access level and the repository', () => {
    const m = manifest();
    m.license = 'ISC';
    m.publishConfig.access = 'restricted';
    // @ts-expect-error simulating a missing field
    delete m.repository;
    const problems: string[] = checkPacked(pack({ manifest: m }));
    expect(problems).toEqual([
      'license must be MIT.',
      'publishConfig.access must be public.',
      'repository.url must point at github.com/RogerioDoCarmo/offline-detector.',
    ]);
  });
});

describe('verify-pack.cjs given a directory of tarballs', () => {
  // `changeset pack --out-dir <dir>` writes <dir>/packages/*.tgz and <dir>/publish-plan.json.
  const run = (extra: string[]) => {
    const stage = mkdtempSync(join(tmpdir(), 'od-vp-test-'));
    try {
      const pkg = join(stage, 'package');
      mkdirSync(join(pkg, 'dist'), { recursive: true });
      for (const file of [
        'README.md',
        'LICENSE',
        'dist/index.js',
        'dist/index.cjs',
        'dist/index.d.ts',
        'dist/index.d.cts',
        ...extra,
      ]) {
        mkdirSync(dirname(join(pkg, file)), { recursive: true });
        writeFileSync(join(pkg, file), 'x');
      }
      writeFileSync(
        join(pkg, 'package.json'),
        JSON.stringify({
          name: scoped('react'),
          version: '0.1.0',
          license: 'MIT',
          repository: {
            url: 'git+https://github.com/RogerioDoCarmo/offline-detector.git',
          },
          publishConfig: { access: 'public' },
          exports: {
            '.': {
              import: { types: './dist/index.d.ts', default: './dist/index.js' },
              require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
            },
          },
        }),
      );
      mkdirSync(join(stage, 'out', 'packages'), { recursive: true });
      // Relative paths, run from the stage: GNU tar reads C:\x as host:file.
      execFileSync(
        'tar',
        ['-czf', 'out/packages/rogeriodocarmo-react-0.1.0.tgz', 'package'],
        {
          cwd: stage,
        },
      );
      return spawnSync(
        process.execPath,
        [join(root, 'scripts/verify-pack.cjs'), join(stage, 'out')],
        {
          encoding: 'utf8',
        },
      );
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  };

  it('checks the tarballs it is given instead of packing the workspace', () => {
    const result = run([]);
    expect(result.stdout).toContain('rogeriodocarmo/offline-detector-react@0.1.0');
    expect(result.stdout).toContain('7 files');
    expect(result.status).toBe(0);
  });

  it('fails when a given tarball ships source', () => {
    const result = run(['src/index.ts']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/index.ts must not be in the tarball.');
  });

  it('fails when the directory holds no tarballs, instead of passing vacuously', () => {
    const empty = mkdtempSync(join(tmpdir(), 'od-vp-empty-'));
    try {
      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts/verify-pack.cjs'), empty],
        {
          encoding: 'utf8',
        },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('No tarballs found');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  // After the manual first publish every version is already on npm, so `changeset pack` writes an
  // empty `packages/` directory and a plan with nothing to publish. That is a valid state.
  const runWithPlan = (plan: unknown) => {
    const out = mkdtempSync(join(tmpdir(), 'od-vp-plan-'));
    try {
      mkdirSync(join(out, 'packages'), { recursive: true });
      if (plan !== undefined) {
        writeFileSync(join(out, 'publish-plan.json'), JSON.stringify(plan));
      }
      return spawnSync(process.execPath, [join(root, 'scripts/verify-pack.cjs'), out], {
        encoding: 'utf8',
      });
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  };

  it('passes with a notice when the plan has nothing to publish', () => {
    const result = runWithPlan({ version: 1, plan: [] });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Nothing to publish');
  });

  it('passes when the plan holds only tag-only releases', () => {
    const result = runWithPlan({
      version: 1,
      plan: [[{ kind: 'tag-only', name: scoped('react'), version: '0.1.0' }]],
    });
    expect(result.status).toBe(0);
  });

  it('fails when the plan expects a publish but no tarball exists', () => {
    const result = runWithPlan({
      version: 1,
      plan: [[{ kind: 'publish', name: scoped('react'), version: '0.1.0' }]],
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('No tarballs found');
  });

  it('fails when the plan file is unreadable', () => {
    expect(runWithPlan(undefined).status).toBe(1);
    const out = mkdtempSync(join(tmpdir(), 'od-vp-bad-'));
    try {
      writeFileSync(join(out, 'publish-plan.json'), '{not json');
      const result = spawnSync(
        process.execPath,
        [join(root, 'scripts/verify-pack.cjs'), out],
        { encoding: 'utf8' },
      );
      expect(result.status).toBe(1);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

describe('release.yml', () => {
  const text = () => read('.github/workflows/release.yml');
  const wf = () => parse(text());
  const stepsOf = (job: string): string => flat(JSON.stringify(wf().jobs[job].steps));

  it('runs only when a version tag is pushed', () => {
    expect(Object.keys(wf().on)).toEqual(['push']);
    expect(wf().on.push).toEqual({ tags: ['v*.*.*'] });
  });

  it('is read-only by default, queued rather than cancelled, and has three ordered jobs', () => {
    expect(wf().permissions).toEqual({ contents: 'read' });
    expect(wf().concurrency).toEqual({ group: 'release', 'cancel-in-progress': false });
    expect(Object.keys(wf().jobs)).toEqual(['verify', 'publish', 'github-release']);
    expect(wf().jobs.publish.needs).toBe('verify');
    expect(wf().jobs['github-release'].needs).toEqual(['verify', 'publish']);
  });

  const stepsList = (job: string): Array<Record<string, unknown>> => wf().jobs[job].steps;
  const indexOfStep = (job: string, needle: string): number =>
    stepsList(job).findIndex((step) =>
      `${step.run ?? ''}\n${step.uses ?? ''}`.includes(needle),
    );
  const PACK_DIR = '${{ runner.temp }}/release-pack';

  it('verifies before anything is published: tag object, branch, version, build and pack', () => {
    const verify = stepsOf('verify');
    expect(verify).toContain('git fetch --force --tags origin');
    expect(verify).toContain('git cat-file -t');
    expect(verify).toContain('lightweight tag');
    expect(verify).toContain('git merge-base --is-ancestor');
    expect(verify).toContain('origin/main');
    expect(verify).toContain('node scripts/check-release-tag.cjs');
    expect(verify).toContain('pnpm typecheck:tests');
    expect(verify).toContain('pnpm test:ci');
    // verify holds no OIDC token: it installs and builds the whole dev toolchain.
    expect(wf().jobs.verify.permissions).toEqual({ contents: 'read', actions: 'read' });
    expect(verify).not.toContain('id-token');
  });

  it('packs the tarballs once, in verify, checks those same files and uploads them', () => {
    const steps = stepsList('verify');
    const pack = indexOfStep('verify', `pnpm changeset pack --out-dir "${PACK_DIR}"`);
    const check = indexOfStep('verify', `node scripts/verify-pack.cjs "${PACK_DIR}"`);
    const upload = indexOfStep('verify', 'actions/upload-artifact@');
    expect(pack).toBeGreaterThan(indexOfStep('verify', 'pnpm build'));
    expect(pack).toBeGreaterThan(
      indexOfStep('verify', 'node scripts/check-release-tag.cjs'),
    );
    expect(check).toBe(pack + 1);
    expect(upload).toBe(check + 1);
    expect(steps[upload]?.with).toEqual({
      name: 'release-packages',
      path: PACK_DIR,
      'if-no-files-found': 'error',
      'retention-days': 1,
    });
  });

  it('checks that the npm-publish environment requires a reviewer, before the checkout', () => {
    // A job that names a missing environment makes GitHub create it with no reviewers, so a tag
    // pushed before the owner set it up would publish without approval. This is the first step.
    const first = stepsList('verify')[0] as Record<
      string,
      string | Record<string, string>
    >;
    expect(first.env).toEqual({ GH_TOKEN: '${{ github.token }}' });
    const script = String(first.run);
    expect(script).toContain('repos/${GITHUB_REPOSITORY}/environments/npm-publish');
    expect(script).toContain('select(.type=="required_reviewers")');
    expect(script).toContain('exit 1');
    expect(indexOfStep('verify', 'environments/npm-publish')).toBe(0);
    expect(indexOfStep('verify', 'actions/checkout@')).toBe(1);
  });

  it('publishes only after the owner approves the protected environment, with OIDC', () => {
    const publish = wf().jobs.publish;
    expect(publish.environment).toBe('npm-publish');
    expect(publish.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
    const steps = stepsOf('publish');
    expect(steps).toContain('"registry-url":"https://registry.npmjs.org"');
    expect(steps).toContain('"package-manager-cache":false');
    expect(steps).toContain('11.5.1');
  });

  it('publishes the tarballs verify produced and builds nothing while holding id-token', () => {
    const steps = stepsList('publish');
    const download = indexOfStep('publish', 'actions/download-artifact@');
    const publish = indexOfStep('publish', 'pnpm changeset publish');
    expect(steps[download]?.with).toEqual({ name: 'release-packages', path: PACK_DIR });
    expect(steps[publish]?.run).toBe(
      `pnpm changeset publish --from-pack-dir "${PACK_DIR}" --no-git-tag`,
    );
    expect(publish).toBeGreaterThan(download);
    expect(publish).toBe(steps.length - 1);
    // Only the changeset CLI is installed: root package, frozen lockfile, no lifecycle scripts.
    expect(stepsOf('publish')).toContain(
      'pnpm install --frozen-lockfile --ignore-scripts --filter offline-detector',
    );
    for (const forbidden of [
      'pnpm build',
      'pnpm test',
      'pnpm lint',
      'verify-pack',
      'storybook',
    ]) {
      expect({ forbidden, found: stepsOf('publish').includes(forbidden) }).toEqual({
        forbidden,
        found: false,
      });
    }
  });

  it('exposes no unused outputs', () => {
    expect(Object.keys(wf().jobs.verify.outputs)).toEqual(['tag', 'notes']);
    expect(text()).not.toContain('previous');
  });

  it('creates the GitHub Release last, from the annotated tag message', () => {
    const release = wf().jobs['github-release'];
    expect(release.permissions).toEqual({ contents: 'write' });
    expect(release['timeout-minutes']).toBe(10);
    expect(stepsOf('github-release')).toContain('softprops/action-gh-release@');
    expect(stepsOf('github-release')).toContain('needs.verify.outputs.notes');
  });

  it('pins every action by commit SHA and uses no registry token secret', () => {
    const uses = [...text().matchAll(/uses:\s*(\S+)/g)].map((m) => m[1] ?? '');
    expect(uses.map((use) => use.split('@')[0])).toEqual([
      'actions/checkout',
      'pnpm/action-setup',
      'actions/setup-node',
      'actions/upload-artifact',
      'actions/checkout',
      'pnpm/action-setup',
      'actions/setup-node',
      'actions/download-artifact',
      'softprops/action-gh-release',
    ]);
    for (const use of uses) {
      expect({ use, pinned: /@[0-9a-f]{40}$/.test(use) }).toEqual({ use, pinned: true });
    }
    const secrets = [...text().matchAll(/secrets\.(\w+)/g)].map((m) => m[1]);
    expect([...new Set(secrets)]).toEqual(['GITHUB_TOKEN']);
    expect(text()).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/);
    expect(text()).not.toMatch(/\|\s*(ba)?sh\b/);
  });
});

describe('CI checks the tarballs on every PR, not only at release time', () => {
  it('runs the pack check right after the build', () => {
    const ci = parse(read('.github/workflows/ci.yml'));
    const runs: string[] = ci.jobs.verify.steps
      .map((step: { run?: string }) => step.run)
      .filter(Boolean);
    expect(runs.indexOf('node scripts/verify-pack.cjs')).toBe(
      runs.indexOf('pnpm build') + 1,
    );
  });
});

describe('release documentation', () => {
  const releasing = () => read('docs/RELEASING.md');
  const owner = () => read('docs/OWNER-ACTIONS.md');
  const at = (text: string, needle: string): number => {
    const index = text.indexOf(needle);
    expect({ needle, found: index >= 0 }).toEqual({ needle, found: true });
    return index;
  };

  it('RELEASING.md makes the environment step 0, before any tag, and the tag step comes after', () => {
    const doc = releasing();
    const step0 = at(doc, '## Step 0: before the first tag is ever pushed');
    const every = at(doc, '## Every release');
    const first = at(doc, '## The first release (manual, once)');
    expect(step0).toBeLessThan(every);
    expect(every).toBeLessThan(first);
    const zero = doc.slice(step0, every);
    // The four things to do first, in this order.
    const order = [
      'Create the `npm-publish` environment',
      '**Protect `main`**',
      'tag ruleset for `v*`',
      '**Wait for the first CodeQL scan**',
    ].map((needle) => at(zero, needle));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(zero).toContain('without anyone approving it');
  });

  it('RELEASING.md lists the release steps in order, with their commands', () => {
    const doc = releasing();
    const every = doc.slice(
      at(doc, '## Every release'),
      at(doc, '## What the workflow refuses'),
    );
    const order = [
      'pnpm changeset`.',
      'git switch -c release/0.2.0 develop',
      'pnpm changeset version',
      'Merge that PR into `main`',
      'git tag -a v0.2.0',
      'git push origin v0.2.0',
      'Approve the publish',
      'git merge origin/main',
      'npm view @rogeriodocarmo/offline-detector-core version',
    ].map((needle) => at(every, needle));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('RELEASING.md publishes the first release with the changeset command, not a hand loop', () => {
    const doc = releasing();
    const first = doc.slice(
      at(doc, '## The first release (manual, once)'),
      at(doc, '## Tested with'),
    );
    expect(first).toContain('pnpm changeset publish --no-git-tag');
    expect(first).toContain('from the repository root');
    expect(first).toContain('Git Bash');
    expect(first).toContain('PowerShell 5.1');
    expect(first).toContain('`&&`');
    expect(first).toContain('parse error');
    // The loop that kept going after a failure, and the per-package publish, are gone as commands.
    expect(doc).not.toContain('for p in core react web native');
    expect(doc).not.toMatch(/^\s*pnpm publish/m);
    expect(first).toContain('stops after a batch with a failure');
    expect(first).toContain('Allowed actions');
    expect(first).toContain('tick `npm publish`');
  });

  it('RELEASING.md says the release comes from main and Git Flow branches, and never rebase', () => {
    const doc = flat(releasing());
    expect(doc).toContain('`release/*` and `hotfix/*`');
    expect(doc).toContain('git merge origin/main');
    expect(doc).toContain('Never rebase: merge `main` back into `develop`');
    expect(doc).toContain('only plain `vX.Y.Z` is accepted');
    expect(doc).not.toContain('build metadata `+x` is ignored');
  });

  it('RELEASING.md records what the peer ranges were actually tested with', () => {
    const doc = flat(releasing());
    expect(doc).toContain('`react` `^18.0.0 || ^19.0.0`');
    expect(doc).toContain('React 19, React Native 0.86 and 0.87, NetInfo 12');
    expect(doc).toContain('**Not run:** React 18, React Native 0.73 to 0.85, NetInfo 11');
  });

  it('CLAUDE.md lets main take release and hotfix branches as well as develop', () => {
    const doc = flat(read('CLAUDE.md'));
    expect(doc).toContain(
      '`main` receives merges from `develop` and from `release/*` and `hotfix/*`',
    );
    expect(doc).not.toContain('`main` receives merges from `develop` only');
  });

  it('OWNER-ACTIONS.md orders the environment first and no longer creates the repository', () => {
    const doc = owner();
    expect(doc).not.toContain('## Create the GitHub repository');
    expect(doc).not.toContain('gh repo create');
    const order = [
      '## Create the npm-publish environment',
      '## Protect main',
      '## Restrict who can create release tags',
      '## Enable CodeQL default setup',
      '## Enable Dependabot alerts and security updates',
      '## Publish the first release by hand',
      '## Configure npm trusted publishing',
    ].map((heading) => at(doc, heading));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(doc).toContain('environments/npm-publish');
    expect(doc).toContain("-f name='v*.*.*' -f type=tag");
    expect(doc).toContain('"required_reviewers"');
  });

  it('OWNER-ACTIONS.md protects main and the release tags with rulesets', () => {
    const doc = owner();
    expect(doc).toContain('"include": ["refs/heads/main"]');
    expect(doc).toContain('"context": "Build, lint, typecheck and test"');
    expect(doc).toContain('"include": ["refs/tags/v*"]');
    for (const rule of [
      'creation',
      'update',
      'deletion',
      'non_fast_forward',
      'pull_request',
    ]) {
      expect(doc).toContain(`"type": "${rule}"`);
    }
  });

  it('OWNER-ACTIONS.md turns on Dependabot alerts and security updates and waits for CodeQL', () => {
    const doc = owner();
    expect(doc).toContain(
      '-X PUT repos/RogerioDoCarmo/offline-detector/vulnerability-alerts',
    );
    expect(doc).toContain(
      '-X PUT repos/RogerioDoCarmo/offline-detector/automated-security-fixes',
    );
    expect(doc).toContain('Wait for the first scan to finish on `main` before tagging');
    expect(doc).toContain('code-scanning/analyses');
  });

  it('OWNER-ACTIONS.md gives the first publish as the one changeset command', () => {
    const doc = owner();
    expect(doc).toContain('pnpm changeset publish --no-git-tag');
    expect(doc).not.toContain('pnpm publish --access public');
    expect(doc).toContain('Git Bash');
  });

  it('NPM-SETUP.md points at OWNER-ACTIONS.md instead of repeating the settings', () => {
    const doc = flat(read('NPM-SETUP.md'));
    expect(doc).toContain('docs/OWNER-ACTIONS.md');
    expect(doc).toContain(
      '"Create the npm-publish environment" **first**, before any tag',
    );
    expect(doc).not.toContain('(do this later, when the repo has a CI release)');
    expect(doc).not.toContain('Not needed today');
  });
});
