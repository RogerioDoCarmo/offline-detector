/* eslint-disable @typescript-eslint/no-require-imports */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    peerDependencies: { react: '>=18.0.0' },
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

  it('verifies before anything is published: tag object, branch, version, build and pack', () => {
    const verify = stepsOf('verify');
    expect(verify).toContain('git fetch --force --tags origin');
    expect(verify).toContain('git cat-file -t');
    expect(verify).toContain('lightweight tag');
    expect(verify).toContain('git merge-base --is-ancestor');
    expect(verify).toContain('origin/main');
    expect(verify).toContain('node scripts/check-release-tag.cjs');
    expect(verify).toContain('pnpm test:ci');
    expect(verify).toContain('node scripts/verify-pack.cjs');
    expect(wf().jobs.verify.permissions).toBeUndefined();
  });

  it('publishes only after the owner approves the protected environment, with OIDC', () => {
    const publish = wf().jobs.publish;
    expect(publish.environment).toBe('npm-publish');
    expect(publish.permissions).toEqual({ contents: 'read', 'id-token': 'write' });
    const steps = stepsOf('publish');
    expect(steps).toContain('pnpm changeset publish --no-git-tag');
    expect(steps).toContain('"registry-url":"https://registry.npmjs.org"');
    expect(steps).toContain('"package-manager-cache":false');
    expect(steps).toContain('11.5.1');
  });

  it('creates the GitHub Release last, from the annotated tag message', () => {
    const release = wf().jobs['github-release'];
    expect(release.permissions).toEqual({ contents: 'write' });
    expect(stepsOf('github-release')).toContain('softprops/action-gh-release@');
    expect(stepsOf('github-release')).toContain('needs.verify.outputs.notes');
  });

  it('pins every action by commit SHA and uses no registry token secret', () => {
    const uses = [...text().matchAll(/uses:\s*(\S+)/g)].map((m) => m[1] ?? '');
    expect(uses.length).toBe(7);
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
  it('RELEASING.md gives the whole flow, the first manual publish and the npm settings', () => {
    expect(existsSync(join(root, 'docs/RELEASING.md'))).toBe(true);
    const doc = flat(read('docs/RELEASING.md'));
    for (const phrase of [
      'pnpm changeset version',
      'git tag -a v',
      'git push origin v',
      'release.yml',
      'npm-publish',
      'pnpm publish --access public',
      'provenance is generated automatically',
      'workspace:',
      'Trusted publishing',
      'Allowed actions',
      'npm publish',
      'git merge origin/main',
      'never rebase',
      'rerun',
    ]) {
      expect({ phrase, found: doc.includes(phrase) }).toEqual({ phrase, found: true });
    }
  });

  it('OWNER-ACTIONS.md lists the environment, the first publish and the trusted publishers', () => {
    const doc = flat(read('docs/OWNER-ACTIONS.md'));
    for (const heading of [
      '## Create the npm-publish environment',
      '## Publish the first release by hand',
      '## Configure npm trusted publishing',
    ]) {
      expect(doc).toContain(heading);
    }
    expect(doc).toContain('environments/npm-publish');
    expect(doc).toContain('v*.*.*');
  });
});
