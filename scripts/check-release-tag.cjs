'use strict';

// Refuses to release a tag that does not match the packages it would publish. The tag and the
// package versions are two separate declarations of the same fact, and nothing else keeps them
// honest (the same reason morse_app checks its tag against app.json).
//
//   node scripts/check-release-tag.cjs v0.1.0

const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

/**
 * Returns the problems with releasing `tag` over the packages at `versions` ({ name: version }).
 * Build metadata (`+suffix`) is dropped before comparing: it sorts equal to the version. A
 * `-suffix` is a pre-release, which sorts before the version, so it is refused.
 */
function checkTag(tag, versions) {
  const match = /^v(\d+\.\d+\.\d+)(\+[0-9A-Za-z.-]+)?$/.exec(tag);
  if (!match) {
    return [
      `Tag "${tag}" must look like v1.2.3 (build metadata such as +rc.1 is allowed); ` +
        'pre-release tags are not published.',
    ];
  }
  const entries = Object.entries(versions);
  if (entries.length === 0) return ['No publishable packages were found.'];
  const wanted = match[1];
  return entries
    .filter(([, version]) => version !== wanted)
    .map(([name, version]) => `${name} is at ${version} but the tag says ${wanted}.`);
}

/** Reads { name: version } for every non-private package under packages/. */
function readVersions(root) {
  const versions = {};
  const dir = join(root, 'packages');
  if (!existsSync(dir)) return versions;
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry, 'package.json');
    if (!existsSync(file)) continue;
    const manifest = JSON.parse(readFileSync(file, 'utf8'));
    if (!manifest.private) versions[manifest.name] = manifest.version;
  }
  return versions;
}

if (require.main === module) {
  const tag = process.argv[2] ?? '';
  const problems = checkTag(tag, readVersions(join(__dirname, '..')));
  if (problems.length > 0) {
    for (const problem of problems) console.error(`::error::${problem}`);
    process.exit(1);
  }
  console.log(`${tag} matches every publishable package.`);
}

module.exports = { checkTag, readVersions };
