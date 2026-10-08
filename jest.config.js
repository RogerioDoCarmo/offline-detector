/** @type {import('jest').Config} */
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
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/packages/*/src/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coverageReporters: ['text', 'lcov'],
};
