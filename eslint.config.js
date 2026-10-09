const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.docusaurus/**',
      '**/.stryker-tmp/**',
      '**/.superpowers/**',
      '**/storybook-static/**',
      '**/playwright-report/**',
    ],
  },
  ...tseslint.configs.strict,
  {
    // Root config files are CommonJS on purpose (the root package is not type: module).
    files: ['**/*.{js,cjs}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
