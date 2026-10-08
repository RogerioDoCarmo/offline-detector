import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [{ format: 'esm', dts: true }, { format: 'cjs' }],
  source: {
    entry: { index: './src/index.ts' },
    tsconfigPath: 'tsconfig.build.json',
  },
  output: { target: 'web', cleanDistPath: true },
});
