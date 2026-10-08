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
  // The default SWC transform emits `React.createElement` without importing React, which throws
  // "React is not defined" at runtime. The automatic runtime imports `react/jsx-runtime` instead.
  tools: {
    swc: { jsc: { transform: { react: { runtime: 'automatic' } } } },
  },
  output: { target: 'web', cleanDistPath: true },
});
