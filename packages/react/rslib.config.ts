import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    { format: 'esm', dts: { autoExtension: true } },
    { format: 'cjs', dts: { autoExtension: true } },
  ],
  source: {
    entry: { index: './src/index.ts' },
    tsconfigPath: 'tsconfig.build.json',
  },
  output: { target: 'web', cleanDistPath: true },
});
