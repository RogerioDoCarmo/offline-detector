const { join } = require('node:path');
const base = require('../../jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'web',
  rootDir: __dirname,
  roots: [join(__dirname, 'src')],
  testEnvironment: 'jsdom',
  // Run against the sibling package's source: tests need no prior build, and they do not depend
  // on how that package happens to be bundled.
  moduleNameMapper: {
    '^@rogeriodocarmo/offline-detector-react$': join(__dirname, '../react/src/index.ts'),
    '^@rogeriodocarmo/offline-detector-core$': join(__dirname, '../core/src/index.ts'),
  },
  setupFilesAfterEnv: [join(__dirname, 'jest.setup.ts')],
};
