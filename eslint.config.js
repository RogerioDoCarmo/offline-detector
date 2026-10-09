const tseslint = require('typescript-eslint');

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/.expo/**',
      '**/.docusaurus/**',
      '**/.stryker-tmp/**',
      '**/.superpowers/**',
      '**/.claude/**',
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
