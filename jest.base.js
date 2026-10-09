/**
 * Shared Jest settings. Every project spreads this and sets its own displayName and rootDir.
 * Globs here are relative on purpose: Jest 30 on Windows mangles absolute root-based globs when
 * the checkout path contains a dot-folder such as ".claude" (agent worktrees live there).
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  transform: {
    // Inline Babel config on purpose: a root babel.config.js would make the Next.js demo drop SWC.
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
      },
    ],
  },
  testMatch: ['**/src/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
  ],
};
