// Bundles the web UI fixture page (fixture.jsx) into one script with Rspack, which already ships
// with @rslib/core, so no new dependency is involved. Usage: node build.mjs <output-directory>
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? join(here, '.out'));

// @rspack/core is a dependency of @rslib/core, so resolve it from there.
const fromRslib = createRequire(createRequire(import.meta.url).resolve('@rslib/core'));
const { rspack } = fromRslib('@rspack/core');

const compiler = rspack({
  mode: 'production',
  target: 'web',
  entry: join(here, 'fixture.jsx'),
  output: { path: outDir, filename: 'bundle.js', clean: true },
  resolve: {
    // Bundle the sibling package from source, so the fixture does not depend on how (or whether)
    // it was built.
    alias: {
      '@rogeriodocarmo/offline-detector-react': join(
        here,
        '../../packages/react/src/index.ts',
      ),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // react and react-dom are devDependencies of packages/web only.
    modules: [join(here, '../../packages/web/node_modules'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  performance: false,
});

compiler.run((error, stats) => {
  if (error || stats?.hasErrors()) {
    console.error(error ?? stats.toString({ colors: false, errors: true }));
    process.exit(1);
  }
  compiler.close(() => console.log(join(outDir, 'bundle.js')));
});
