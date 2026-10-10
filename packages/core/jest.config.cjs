const { join } = require('node:path');
const base = require('../../jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'core',
  rootDir: __dirname,
  roots: [join(__dirname, 'src')],
};
