import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  INTERVALS,
  buildProbeOptions,
  defaultSettings,
  detectorKey,
} from '../apps/demo-native/src/options';
import { createStubProbe } from '../apps/demo-native/src/stub-probe';

const root = join(__dirname, '..');
const app = 'apps/demo-native';
const read = (path: string): string => readFileSync(join(root, path), 'utf8');
const readJson = (path: string) => JSON.parse(read(path));

describe('demo-native: settings', () => {
  it('starts with the package defaults and the stub probe', () => {
    expect(defaultSettings).toEqual({
      locale: 'en',
      distinguishReason: false,
      dismissible: true,
      fullScreen: 'off',
      colorScheme: 'auto',
      motion: 'auto',
      recoveryMs: 4000,
      probeUrls: 'https://www.gstatic.com/generate_204',
      intervalMs: 30000,
      useStubProbe: true,
      passNetInfo: true,
      useSlots: false,
      checkingFeedback: 'brief',
    });
  });

  it('offers three probe intervals', () => {
    expect(INTERVALS).toEqual([3000, 10000, 30000]);
  });

  it('splits the URL list on commas and newlines and drops blanks', () => {
    expect(
      buildProbeOptions({
        ...defaultSettings,
        probeUrls: ' https://a.test/x ,\nhttps://b.test/y,, ',
        intervalMs: 3000,
      }),
    ).toEqual({ urls: ['https://a.test/x', 'https://b.test/y'], intervalMs: 3000 });
  });

  it('leaves urls out when the list is empty so the package default applies', () => {
    expect(buildProbeOptions({ ...defaultSettings, probeUrls: '  ' })).toEqual({
      intervalMs: 30000,
    });
  });

  it('changes the detector key whenever a read-once setting changes', () => {
    const base = detectorKey(defaultSettings);
    expect(detectorKey({ ...defaultSettings, intervalMs: 3000 })).not.toBe(base);
    expect(detectorKey({ ...defaultSettings, probeUrls: 'https://x.test' })).not.toBe(
      base,
    );
    expect(detectorKey({ ...defaultSettings, useStubProbe: false })).not.toBe(base);
    expect(detectorKey({ ...defaultSettings, passNetInfo: false })).not.toBe(base);
    expect(detectorKey({ ...defaultSettings, locale: 'es' })).toBe(base);
  });
});

describe('demo-native: stub probe', () => {
  const init = () => ({ method: 'HEAD', signal: new AbortController().signal });

  it('answers ok while online', async () => {
    const probe = createStubProbe();
    await expect(probe.fetch('https://a.test', init())).resolves.toEqual({
      ok: true,
      type: 'basic',
    });
  });

  it('rejects like a dead network while simulating offline', async () => {
    const probe = createStubProbe();
    probe.setOffline(true);
    await expect(probe.fetch('https://a.test', init())).rejects.toThrow(
      'Simulated offline',
    );
    probe.setOffline(false);
    await expect(probe.fetch('https://a.test', init())).resolves.toMatchObject({
      ok: true,
    });
  });

  it('reports whether it is offline', () => {
    const probe = createStubProbe();
    expect(probe.isOffline()).toBe(false);
    probe.setOffline(true);
    expect(probe.isOffline()).toBe(true);
  });
});

describe('demo-native: package and scripts', () => {
  const pkg = readJson(`${app}/package.json`);

  it('is the private @offline-detector/demo-native', () => {
    expect(pkg.name).toBe('@offline-detector/demo-native');
    expect(pkg.private).toBe(true);
  });

  it('consumes the three workspace packages as workspace:*', () => {
    for (const name of ['core', 'react', 'native']) {
      expect(pkg.dependencies[`@rogeriodocarmo/offline-detector-${name}`]).toBe(
        'workspace:*',
      );
    }
  });

  it('pins Expo SDK 57 with React Native 0.86.3 and React 19.2.3', () => {
    expect(pkg.dependencies.expo).toBe('~57.0.27');
    expect(pkg.dependencies['react-native']).toBe('0.86.3');
    expect(pkg.dependencies.react).toBe('19.2.3');
  });

  it('passes NetInfo and safe-area from the host', () => {
    expect(pkg.dependencies['@react-native-community/netinfo']).toBe('12.0.1');
    expect(pkg.dependencies['react-native-safe-area-context']).toBe('~5.7.0');
  });

  it('has no Reanimated and no react-native-web', () => {
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(all).not.toContain('react-native-reanimated');
    expect(all).not.toContain('react-native-web');
  });

  it('keeps build offline-safe (a type check) and bundling separate', () => {
    expect(pkg.scripts.build).toBe('tsc --noEmit');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.dev).toBe('expo start');
    expect(pkg.scripts.bundle).toBe('expo export --platform android');
    expect(pkg.scripts['bundle:ios']).toBe('expo export --platform ios');
  });

  it('has no android or ios folder: prebuild happens in CI only', () => {
    expect(existsSync(join(root, app, 'android'))).toBe(false);
    expect(existsSync(join(root, app, 'ios'))).toBe(false);
  });
});

describe('demo-native: metro config', () => {
  const metro = read(`${app}/metro.config.js`);

  it('watches the workspace and looks in both node_modules', () => {
    expect(metro).toContain('config.watchFolders = [workspaceRoot]');
    expect(metro).toContain('config.resolver.nodeModulesPaths');
    expect(metro).toContain("path.resolve(workspaceRoot, 'node_modules')");
  });

  it('honours package exports and does not alias to source', () => {
    expect(metro).toContain('config.resolver.unstable_enablePackageExports = true');
    expect(metro).not.toContain('extraNodeModules');
    expect(metro).not.toMatch(/packages\/\w+\/src/);
  });

  it('keeps react and react-native to a single copy', () => {
    expect(metro).toContain("const singletons = ['react', 'react-native']");
    expect(metro).toContain('originModulePath: appOrigin');
  });

  it('uses the Expo babel preset', () => {
    expect(read(`${app}/babel.config.js`)).toContain("presets: ['babel-preset-expo']");
  });
});

describe('demo-native: app config', () => {
  it('has a stable application id for Maestro and prebuild', () => {
    const { expo } = readJson(`${app}/app.json`);
    expect(expo.android.package).toBe('dev.rogeriodocarmo.offlinedetector.demo');
    expect(expo.ios.bundleIdentifier).toBe('dev.rogeriodocarmo.offlinedetector.demo');
  });
});

describe('demo-native: Maestro', () => {
  const flowsDir = join(root, app, '.maestro');
  const flows = readdirSync(flowsDir).filter((f) => f.endsWith('.yaml'));

  it('ships the four flows plus pt-BR', () => {
    expect(flows.sort()).toEqual([
      'dismiss-swipe.yaml',
      'offline-banner.yaml',
      'pt-br.yaml',
      'recovery.yaml',
      'retry.yaml',
    ]);
  });

  it.each([
    'dismiss-swipe.yaml',
    'offline-banner.yaml',
    'pt-br.yaml',
    'recovery.yaml',
    'retry.yaml',
  ])('%s targets the demo appId', (file) => {
    const header = read(`${app}/.maestro/${file}`).split('\n---')[0] ?? '';
    expect(parse(header).appId).toBe('dev.rogeriodocarmo.offlinedetector.demo');
  });

  it('asserts the real copy', () => {
    expect(read(`${app}/.maestro/offline-banner.yaml`)).toContain('No internet');
    expect(read(`${app}/.maestro/recovery.yaml`)).toContain('Back online');
    expect(read(`${app}/.maestro/pt-br.yaml`)).toContain('Sem internet');
  });

  describe('workflow', () => {
    const workflow = parse(read('.github/workflows/maestro.yml'));

    it('runs on push to main and develop and on manual dispatch only', () => {
      expect(Object.keys(workflow.on).sort()).toEqual(['push', 'workflow_dispatch']);
      expect(workflow.on.push.branches).toEqual(['main', 'develop']);
      expect(workflow.on).not.toHaveProperty('pull_request');
      expect(workflow.on).not.toHaveProperty('pull_request_target');
    });

    it('uses the pinned emulator runner and prebuilds in CI', () => {
      const text = read('.github/workflows/maestro.yml');
      expect(text).toContain('reactivecircus/android-emulator-runner@v2');
      expect(text).toContain('expo prebuild');
      expect(text).toContain('maestro test');
    });

    it('has read-only permissions', () => {
      expect(workflow.permissions).toEqual({ contents: 'read' });
    });
  });
});
