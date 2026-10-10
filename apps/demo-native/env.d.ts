// Metro inlines `process.env.EXPO_PUBLIC_*` at build time (babel-preset-expo). `types: []` keeps
// Node's globals out of this app, so declare just the one variable it reads.
declare const process: { env: { EXPO_PUBLIC_STORYBOOK?: string } };
