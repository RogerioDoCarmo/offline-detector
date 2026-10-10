// Metro for a pnpm monorepo. The workspace packages are consumed through their `exports`
// (dist), exactly as a published install would be: no alias to source.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');

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

// On-device Storybook, switched by one build-time flag (see index.ts). `withStorybook` goes last:
// it wraps `resolver.resolveRequest` and calls the one set above, so the single-React rule holds.
// With the flag off (`enabled: false`) every Storybook module resolves to an empty module and the
// demo bundle is the same as before. `liteMode` mocks the default Storybook UI, which needs
// Reanimated and gesture-handler; this app uses the lite UI instead.
const storybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK === 'true';

module.exports = withStorybook(config, {
  enabled: storybookEnabled,
  liteMode: true,
  useJs: true,
  configPath: path.resolve(projectRoot, '.rnstorybook'),
});

// `liteMode` recognises the default UI by a forward-slash path, so on Windows (backslashes) it
// lets `@storybook/react-native-ui` through and Metro then compiles Reanimated code. Repeat the
// check on a normalised path; the lite and common UI packages are kept.
const isDefaultStorybookUi = (filePath) => {
  const normalised = String(filePath).replace(/\\/g, '/');
  return (
    normalised.includes('/@storybook/react-native-ui/') ||
    normalised.endsWith('/@storybook/react-native-ui')
  );
};
const storybookResolveRequest = module.exports.resolver.resolveRequest;

// pnpm installs the peers of the Storybook packages (bottom-sheet, Reanimated, worklets) into its
// store, where Metro would find them from inside `@storybook/*`. This app must not bundle them
// (see README: no Reanimated), so they are made unresolvable. The controls addon requires
// bottom-sheet inside try/catch and falls back to plain inputs, which is what this relies on.
const unavailable = [
  '@gorhom/bottom-sheet',
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-gesture-handler',
];

module.exports.resolver.resolveRequest = (context, moduleName, platform) => {
  if (storybookEnabled && unavailable.includes(moduleName)) {
    return storybookResolveRequest(
      { ...context, nodeModulesPaths: [], disableHierarchicalLookup: true },
      moduleName,
      platform,
    );
  }
  const resolved = storybookResolveRequest(context, moduleName, platform);
  if (storybookEnabled && resolved && isDefaultStorybookUi(resolved.filePath)) {
    return { type: 'empty' };
  }
  return resolved;
};
