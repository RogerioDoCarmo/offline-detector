// Metro for a pnpm monorepo. The workspace packages are consumed through their `exports`
// (dist), exactly as a published install would be: no alias to source.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Metro must see the packages' dist (symlinked from packages/*) and the root node_modules.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Honour the packages' `exports` map (import/require conditions) so `dist` is what loads.
config.resolver.unstable_enablePackageExports = true;

// The workspace packages are built and tested against their own copy of React and React Native.
// Two copies in one bundle break hooks, so every `react` and `react-native` import, wherever it
// comes from, resolves from this app.
const singletons = ['react', 'react-native'];
const isSingleton = (name) =>
  singletons.some((single) => name === single || name.startsWith(`${single}/`));
const appOrigin = path.join(projectRoot, 'index.ts');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isSingleton(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: appOrigin },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
