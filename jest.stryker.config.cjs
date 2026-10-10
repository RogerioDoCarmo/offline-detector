const { join } = require('node:path');
const base = require('./jest.base');

/**
 * Flat Jest config used only by Stryker. Its Jest runner cannot apply a multi-project config
 * (the Babel transform never reaches the sandbox), so this runs core and react as one project.
 * React's hook tests need a DOM, so the whole run uses Stryker's own jsdom environment, which
 * is what lets it collect per-test coverage.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  ...base,
  rootDir: __dirname,
  roots: [join(__dirname, 'packages/core/src'), join(__dirname, 'packages/react/src')],
  testEnvironment: '@stryker-mutator/jest-runner/jest-env/jsdom',
  setupFiles: [join(__dirname, 'jest.stryker.setup.cjs')],
  // ssr.test.tsx opts into the node environment with a docblock; that cannot report per-test
  // coverage to Stryker, so it stays in the normal test run only.
  testPathIgnorePatterns: [...base.testPathIgnorePatterns, 'ssr\\.test\\.tsx$'],
};
