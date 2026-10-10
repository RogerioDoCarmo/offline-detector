'use strict';

// Packs every publishable package exactly as `pnpm publish` would and checks the tarball, so a
// release cannot ship source, tests, a leftover `workspace:` dependency or a missing file. The
// checks are pure (`checkPacked`); the rest of this file only runs `pnpm pack` and reads the result.
//
//   node scripts/verify-pack.cjs              (run after `pnpm build`: packs the workspace)
//   node scripts/verify-pack.cjs <dir>        (checks the tarballs `changeset pack --out-dir <dir>`
//                                              wrote, which are exactly what gets published)

const { execFileSync } = require('node:child_process');
const {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join, relative } = require('node:path');

const MAX_BYTES = 300_000;
const REQUIRED = [
  'package.json',
  'README.md',
  'LICENSE',
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.d.cts',
];
const NEVER_SHIPPED =
  /(^|\/)(src|tests?|__tests__|node_modules|\.stryker-tmp)(\/|$)|\.(test|stories)\./;
const SIBLING = /^@rogeriodocarmo\/offline-detector-/;

/** Every file path an `exports` map points at. */
function exportTargets(value) {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(exportTargets);
  return [];
}

/** Returns the problems with one packed tarball: { manifest, files (relative paths), bytes }. */
function checkPacked({ manifest, files, bytes }) {
  const problems = [];
  const text = JSON.stringify(manifest);
  if (text.includes('workspace:')) {
    problems.push(
      'The packed package.json still contains a workspace: protocol dependency.',
    );
  }
  for (const section of ['dependencies', 'optionalDependencies']) {
    for (const [name, range] of Object.entries(manifest[section] ?? {})) {
      if (
        SIBLING.test(name) &&
        range !== manifest.version &&
        !String(range).startsWith('workspace:')
      ) {
        problems.push(`${name} must be pinned to ${manifest.version} but is ${range}.`);
      }
    }
  }
  for (const file of files) {
    if (NEVER_SHIPPED.test(file)) problems.push(`${file} must not be in the tarball.`);
  }
  for (const file of REQUIRED) {
    if (!files.includes(file)) problems.push(`The tarball is missing ${file}.`);
  }
  for (const target of exportTargets(manifest.exports)) {
    if (!files.includes(target.replace(/^\.\//, ''))) {
      problems.push(`exports names ${target} but it is not in the tarball.`);
    }
  }
  if (bytes > MAX_BYTES) {
    problems.push(
      `The tarball is ${bytes} bytes, larger than the ${MAX_BYTES} byte limit.`,
    );
  }
  if (manifest.license !== 'MIT') problems.push('license must be MIT.');
  if (manifest.publishConfig?.access !== 'public') {
    problems.push('publishConfig.access must be public.');
  }
  if (
    !String(manifest.repository?.url ?? '').includes(
      'github.com/RogerioDoCarmo/offline-detector',
    )
  ) {
    problems.push(
      'repository.url must point at github.com/RogerioDoCarmo/offline-detector.',
    );
  }
  return problems;
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function packOne(packageDir, scratch) {
  // One directory per package, so a tarball can never be mistaken for another package's.
  const out = mkdtempSync(join(scratch, 'tarball-'));
  const shell = process.platform === 'win32';
  execFileSync('pnpm', ['pack', '--pack-destination', out], {
    cwd: packageDir,
    shell,
    stdio: 'pipe',
  });
  return readTarball(join(out, readdirSync(out)[0]), scratch);
}

/** Unpacks one tarball into the scratch folder and describes it for `checkPacked`. */
function readTarball(tarball, scratch) {
  const extracted = mkdtempSync(join(scratch, 'extracted-'));
  // The archive goes in on stdin and tar runs inside the target folder. GNU tar (Git Bash on
  // Windows) reads a path like C:\temp\x.tgz as host:file and tries to connect to a machine "C".
  execFileSync('tar', ['-xzf', '-'], {
    cwd: extracted,
    input: readFileSync(tarball),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const base = join(extracted, 'package');
  return {
    manifest: JSON.parse(readFileSync(join(base, 'package.json'), 'utf8')),
    files: listFiles(base).map((file) => relative(base, file).split('\\').join('/')),
    bytes: statSync(tarball).size,
  };
}

/** Prints the verdict for one tarball and returns true when it has problems. */
function report(packed) {
  const problems = checkPacked(packed);
  for (const problem of problems)
    console.error(`::error::${packed.manifest.name}: ${problem}`);
  if (problems.length === 0) {
    console.log(
      `${packed.manifest.name}@${packed.manifest.version}: ${packed.files.length} files, ${packed.bytes} bytes, ok`,
    );
  }
  return problems.length > 0;
}

/** True when `<dir>/publish-plan.json` parses and lists no release of kind `publish`. */
function planIsEmpty(dir) {
  try {
    const { plan } = JSON.parse(readFileSync(join(dir, 'publish-plan.json'), 'utf8'));
    return (
      Array.isArray(plan) &&
      plan.flat().every((release) => release && release.kind !== 'publish')
    );
  } catch {
    return false;
  }
}

/** Checks the tarballs that `changeset pack --out-dir <dir>` wrote: the ones that get published. */
function checkDirectory(dir, scratch) {
  const tarballs = existsSync(dir)
    ? listFiles(dir)
        .filter((file) => file.endsWith('.tgz'))
        .sort()
    : [];
  if (tarballs.length === 0) {
    // Once every version is on npm (the manual first publish) the plan has nothing to publish and
    // `changeset pack` writes no tarballs. That is only believed when the plan says so.
    if (planIsEmpty(dir)) {
      console.log(`Nothing to publish: ${dir} holds a plan with no publish releases.`);
      return false;
    }
    console.error(`::error::No tarballs found under ${dir}.`);
    return true;
  }
  return tarballs.map((tarball) => report(readTarball(tarball, scratch))).some(Boolean);
}

/** Packs every publishable workspace package, as `pnpm publish` would, and checks the result. */
function checkWorkspace(scratch) {
  const packagesDir = join(__dirname, '..', 'packages');
  let failed = false;
  for (const entry of readdirSync(packagesDir).sort()) {
    const packageDir = join(packagesDir, entry);
    const file = join(packageDir, 'package.json');
    if (!existsSync(file) || JSON.parse(readFileSync(file, 'utf8')).private) continue;
    failed = report(packOne(packageDir, scratch)) || failed;
  }
  return failed;
}

function main() {
  const dir = process.argv[2];
  const scratch = mkdtempSync(join(tmpdir(), 'od-pack-'));
  let failed;
  try {
    failed = dir ? checkDirectory(dir, scratch) : checkWorkspace(scratch);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  if (failed) process.exit(1);
}

if (require.main === module) main();

module.exports = { checkPacked, exportTargets };
