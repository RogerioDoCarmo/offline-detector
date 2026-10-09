'use strict';

/**
 * Assembles the one GitHub Pages site: the docs build at the root, the exported web demo under
 * /demo/ and, when the file exists, docs/privacy-policy.html at /privacy-policy.html. A missing
 * demo or policy is skipped, not an error, so the docs can publish before either exists. A missing
 * docs build is an error: there would be nothing to publish.
 *
 *   node assemble-site.cjs --docs apps/docs/build --demo apps/demo-web/out \
 *     --policy docs/privacy-policy.html --out site
 */

const fs = require('node:fs');
const path = require('node:path');

function isDirectory(p) {
  return Boolean(p) && fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function isFile(p) {
  return Boolean(p) && fs.existsSync(p) && fs.statSync(p).isFile();
}

function assemble({ docs, demo, policy, out }) {
  if (!isDirectory(docs)) throw new Error(`docs build not found: ${docs}`);
  fs.rmSync(out, { recursive: true, force: true });
  fs.cpSync(docs, out, { recursive: true });

  const hasDemo = isDirectory(demo);
  if (hasDemo) fs.cpSync(demo, path.join(out, 'demo'), { recursive: true });

  const hasPolicy = isFile(policy);
  if (hasPolicy) fs.copyFileSync(policy, path.join(out, 'privacy-policy.html'));

  // The export contains folders that start with an underscore (_next); Pages must not run Jekyll.
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  return { demo: hasDemo, policy: hasPolicy };
}

module.exports = { assemble };

if (require.main === module) {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  const result = assemble({
    docs: args.docs,
    demo: args.demo,
    policy: args.policy,
    out: args.out,
  });
  console.log(
    `site assembled in ${args.out}: demo ${result.demo ? 'included' : 'absent'}, ` +
      `privacy policy ${result.policy ? 'included' : 'absent'}`,
  );
}
