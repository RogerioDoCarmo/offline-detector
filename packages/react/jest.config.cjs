const { join } = require('node:path');
const base = require('../../jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'react',
  rootDir: __dirname,
  roots: [join(__dirname, 'src')],
  // Hooks are tested in jsdom; SSR tests opt back into node with a per-file docblock.
  testEnvironment: 'jsdom',
};
