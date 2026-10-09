const { join } = require('node:path');
const base = require('./jest.base');

/**
 * One project for the repo meta-tests in tests/, plus one per package. Each package owns its
 * packages/<name>/jest.config.cjs (web adds a browser-like environment, native a React Native
 * transform), so parallel work on different packages never edits a shared file.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  projects: [
    {
      ...base,
      displayName: 'repo',
      rootDir: __dirname,
      roots: [join(__dirname, 'tests')],
      testMatch: ['**/*.test.ts'],
      // Repo meta-tests load config files (playwright.config.ts, ...) that must not count as source.
      coveragePathIgnorePatterns: ['.*'],
    },
    'packages/*/jest.config.cjs',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coverageReporters: ['text', 'lcov'],
};
