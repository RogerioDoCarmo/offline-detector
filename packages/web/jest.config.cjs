const { join } = require('node:path');
const base = require('../../jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'web',
  rootDir: __dirname,
  roots: [join(__dirname, 'src')],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [join(__dirname, 'jest.setup.ts')],
};
