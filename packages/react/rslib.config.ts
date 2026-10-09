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
  // Without this SWC emits classic `React.createElement` calls and no `React` import, so the
  // published bundle would throw "React is not defined" in any consumer.
  tools: { swc: { jsc: { transform: { react: { runtime: 'automatic' } } } } },
  output: { target: 'web', cleanDistPath: true },
});
