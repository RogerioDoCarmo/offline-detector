const { join } = require('node:path');
const base = require('../../jest.base');
// React Native >= 0.85 ships its Jest preset as a separate package.
const rnPreset = require('@react-native/jest-preset/jest-preset');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'native',
  rootDir: __dirname,
  roots: [join(__dirname, 'src')],

  // The first test to touch Animated pays for loading react-native's Animated modules.
  setupFilesAfterEnv: [join(__dirname, 'jest.setup.cjs')],
  haste: rnPreset.haste,
  moduleNameMapper: {
    ...rnPreset.moduleNameMapper,
    // Test against the react package's source: its published dist is built with the classic JSX
    // transform and calls an unimported `React.createElement`, which fails with "React is not
    // defined". The source needs no build step and is transformed like our own.
    '^@rogeriodocarmo/offline-detector-react$': join(__dirname, '../react/src/index.ts'),
  },
  resolver: rnPreset.resolver,
  setupFiles: rnPreset.setupFiles,
  testEnvironment: rnPreset.testEnvironment,
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: ['module:@react-native/babel-preset'],
      },
    ],
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      require.resolve('@react-native/jest-preset/jest/assetFileTransformer.js'),
  },
  // pnpm keeps packages under node_modules/.pnpm/<name>@<ver>/node_modules/<name>.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?)/)',
  ],
};
