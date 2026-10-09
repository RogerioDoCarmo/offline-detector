import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(__dirname, '..');
const app = 'apps/demo-native';
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const pkg = () => JSON.parse(read(`${app}/package.json`));

/** Every file under `dir` (relative to the repo root) that matches `keep`. */
function files(dir: string, keep: (path: string) => boolean): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      if (entry === 'node_modules') continue;
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (keep(full)) out.push(relative(root, full).replace(/\\/g, '/'));
    }
  };
  walk(join(root, dir));
  return out;
}

const storyFiles = () =>
  files(`${app}/.rnstorybook/stories`, (path) => path.endsWith('.stories.tsx'));
const exportsOf = (path: string): string[] =>
  [...read(path).matchAll(/^export const (\w+)/gm)].map((match) => match[1] as string);

describe('demo-native storybook: dependencies', () => {
  const dev = () => pkg().devDependencies;

  it('pins Storybook for React Native 10 with matching addon versions', () => {
    expect(dev()['@storybook/react-native']).toBe('10.6.0');
    expect(dev()['@storybook/react-native-ui-lite']).toBe('10.6.0');
    expect(dev()['@storybook/addon-ondevice-controls']).toBe('10.6.0');
    expect(dev()['@storybook/addon-ondevice-actions']).toBe('10.6.0');
    expect(dev().storybook).toBe('10.6.1');
  });

  it('adds the controls addon peers that are plain JS or Expo Go modules', () => {
    expect(dev()['@react-native-community/slider']).toBe('5.2.1');
    expect(dev()['@react-native-community/datetimepicker']).toBe('9.2.1');
  });

  it('keeps the no-Reanimated, no-gesture-handler, no-web rules', () => {
    const all = Object.keys({ ...pkg().dependencies, ...pkg().devDependencies });
    for (const banned of [
      'react-native-reanimated',
      'react-native-worklets',
      'react-native-gesture-handler',
      '@gorhom/bottom-sheet',
      'react-native-web',
      '@storybook/react-native-ui',
    ]) {
      expect(all).not.toContain(banned);
    }
  });
});

describe('demo-native storybook: scripts and the switch', () => {
  it('adds storybook, storybook:generate and bundle:storybook, and leaves the others alone', () => {
    const { scripts } = pkg();
    expect(scripts.storybook).toBe('cross-env EXPO_PUBLIC_STORYBOOK=true expo start');
    expect(scripts['storybook:generate']).toBe(
      'sb-rn-get-stories --use-js --config-path .rnstorybook',
    );
    expect(scripts['bundle:storybook']).toBe(
      'cross-env EXPO_PUBLIC_STORYBOOK=true expo export --platform android',
    );
    expect(scripts.build).toBe('tsc --noEmit');
    expect(scripts.dev).toBe('expo start');
    expect(scripts.bundle).toBe('expo export --platform android');
  });

  it('keeps cross-env available for the scripts', () => {
    expect(pkg().devDependencies['cross-env']).toBe('10.1.0');
  });

  it('chooses the demo or Storybook in index.ts from EXPO_PUBLIC_STORYBOOK', () => {
    const index = read(`${app}/index.ts`);
    expect(index).toContain("process.env.EXPO_PUBLIC_STORYBOOK === 'true'");
    expect(index).toContain("from './.rnstorybook'");
    expect(index).toContain("from './App'");
    expect(index).toContain('registerRootComponent');
  });
});

describe('demo-native storybook: metro', () => {
  const metro = read(`${app}/metro.config.js`);

  it('wraps the existing config with withStorybook, last', () => {
    expect(metro).toContain("require('@storybook/react-native/metro/withStorybook')");
    expect(metro).toContain(
      "const storybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK === 'true'",
    );
    expect(metro).toContain('enabled: storybookEnabled');
    expect(metro).toContain('liteMode: true');
    expect(metro).toContain('useJs: true');
    expect(metro).toContain("configPath: path.resolve(projectRoot, '.rnstorybook')");
    expect(metro.indexOf('module.exports = withStorybook(config')).toBeGreaterThan(
      metro.indexOf('config.resolver.resolveRequest ='),
    );
  });

  it('keeps Reanimated, worklets, gesture-handler and bottom-sheet out of the bundle', () => {
    for (const name of [
      '@gorhom/bottom-sheet',
      'react-native-reanimated',
      'react-native-worklets',
      'react-native-gesture-handler',
    ]) {
      expect(metro).toContain(`'${name}',`);
    }
    expect(metro).toContain('disableHierarchicalLookup: true');
    expect(metro).toContain("'/@storybook/react-native-ui/'");
    expect(metro).toContain("replace(/\\\\/g, '/')");
  });

  it('keeps every monorepo setting of the demo', () => {
    expect(metro).toContain('config.watchFolders = [workspaceRoot]');
    expect(metro).toContain('config.resolver.nodeModulesPaths');
    expect(metro).toContain('config.resolver.unstable_enablePackageExports = true');
    expect(metro).toContain("const singletons = ['react', 'react-native']");
    expect(metro).toContain('originModulePath: appOrigin');
  });
});

describe('demo-native storybook: config', () => {
  it('registers the lite UI and the two on-device addons', () => {
    const main = read(`${app}/.rnstorybook/main.ts`);
    expect(main).toContain("stories: ['./stories/**/*.stories.?(ts|tsx|js|jsx)']");
    expect(main).toContain("'@storybook/addon-ondevice-controls'");
    expect(main).toContain("'@storybook/addon-ondevice-actions'");
    const index = read(`${app}/.rnstorybook/index.tsx`);
    expect(index).toContain("from '@storybook/react-native-ui-lite'");
    expect(index).toContain('CustomUIComponent: LiteUI');
  });

  it('is typechecked by the app', () => {
    expect(read(`${app}/tsconfig.json`)).toContain('.rnstorybook/**/*');
  });

  it('commits the generated story index (a clean checkout must typecheck)', () => {
    expect(existsSync(join(root, `${app}/.rnstorybook/storybook.requires.js`))).toBe(
      true,
    );
  });

  it('generates JS, so the generated require calls pass the repo lint rules, and types it', () => {
    expect(existsSync(join(root, `${app}/.rnstorybook/storybook.requires.d.ts`))).toBe(
      true,
    );
    expect(read(`${app}/.rnstorybook/storybook.requires.d.ts`)).toContain(
      'export const view: View;',
    );
  });

  it('indexes the whole stories folder (the generator emits a require.context glob)', () => {
    // Prettier rewrites the generated quotes, so compare with one quote style.
    const requires = read(`${app}/.rnstorybook/storybook.requires.js`).replace(/"/g, "'");
    expect(storyFiles()).toHaveLength(5);
    expect(requires).toContain("directory: './.rnstorybook/stories'");
    expect(requires).toContain("files: '**/*.stories.?(ts|tsx|js|jsx)'");
    // Metro writes '../.rnstorybook/stories', the CLI './stories': both are this folder.
    expect(requires).toMatch(/require\.context\(\s*'(\.|\.\.\/\.rnstorybook)\/stories',/);
    expect(requires).toContain('@storybook/addon-ondevice-controls/register');
    expect(requires).toContain('@storybook/addon-ondevice-actions/register');
  });
});

describe('demo-native storybook: stories', () => {
  const named = (name: string) => `${app}/.rnstorybook/stories/${name}.stories.tsx`;

  it('has a story file per piece, FullScreen and the OfflineDetector states', () => {
    expect(storyFiles().sort()).toEqual(
      ['Banner', 'FullScreen', 'Indicator', 'OfflineDetector', 'Snackbar'].map(named),
    );
  });

  it('covers offline, checking and recovered for the snackbar and indicator', () => {
    for (const piece of ['Snackbar', 'Indicator']) {
      expect(exportsOf(named(piece))).toEqual(
        expect.arrayContaining(['Offline', 'Checking', 'Recovered']),
      );
    }
  });

  it('covers offline and checking for the banner and full-screen state', () => {
    for (const piece of ['Banner', 'FullScreen']) {
      expect(exportsOf(named(piece))).toEqual(
        expect.arrayContaining(['Offline', 'Checking']),
      );
    }
  });

  it('covers the OfflineDetector states', () => {
    expect(exportsOf(named('OfflineDetector'))).toEqual([
      'Online',
      'Offline',
      'OfflineDistinguishingTheReason',
      'Recovering',
      'Checking',
      'FullScreen',
      'Dismissed',
      'NotDismissible',
      'Dark',
      'Portuguese',
      'SpanishReducedMotion',
    ]);
  });

  it('exposes locale, colour scheme, reduced motion and dismissible as controls', () => {
    const helpers = read(`${app}/.rnstorybook/helpers.tsx`);
    expect(helpers).toContain("options: ['en', 'pt-BR', 'es']");
    expect(helpers).toContain("options: ['light', 'dark']");
    expect(helpers).toContain('reduceMotion: { control: ');
    expect(helpers).toContain('dismissible: { control: ');
  });

  it('imports the package by name only, never from src/ or dist/', () => {
    const all = files(`${app}/.rnstorybook`, (path) => /\.tsx?$/.test(path));
    expect(all.length).toBeGreaterThan(5);
    for (const path of all) {
      const text = read(path);
      expect(text).not.toMatch(/from '[^']*\/(src|dist)(\/[^']*)?'/);
      expect(text).not.toMatch(/packages\/(core|react|web|native)/);
    }
    expect(read(named('Snackbar'))).toContain(
      "from '@rogeriodocarmo/offline-detector-native'",
    );
  });

  it('never reaches the network: probes go through the fake fetch', () => {
    const fakes = read(`${app}/.rnstorybook/fakes.ts`);
    expect(fakes).toContain('https://probe.story.test');
    expect(fakes).not.toMatch(/\bfetch\(/);
    expect(read(named('OfflineDetector'))).toContain('fetch={network.fetch}');
    expect(read(named('OfflineDetector'))).toContain('adapter={network.adapter}');
  });
});
