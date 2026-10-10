import * as core from './index';
import { DEFAULT_PROBE_URLS, createOfflineDetector, packageName } from './index';
import type { OfflineDetectorInstance, ProbeFetch, ProbeOptions } from './index';
import { createAdapter } from '../tests/helpers';

describe('@rogeriodocarmo/offline-detector-core', () => {
  it('exports its package name', () => {
    expect(packageName).toBe('@rogeriodocarmo/offline-detector-core');
  });

  it('exports exactly these runtime values', () => {
    expect(Object.keys(core).sort()).toEqual([
      'DEFAULT_PROBE_URLS',
      'createOfflineDetector',
      'isOnline',
      'packageName',
    ]);
  });

  it('accepts the exported readonly DEFAULT_PROBE_URLS as probe.urls', () => {
    const probe: ProbeOptions = { urls: DEFAULT_PROBE_URLS };
    expect(probe.urls).toEqual([
      'https://cp.cloudflare.com/generate_204',
      'https://www.gstatic.com/generate_204',
    ]);
  });

  it('names the detector type OfflineDetectorInstance and lets fetch resolve anything', () => {
    const fetch: ProbeFetch = () => Promise.resolve(undefined);
    const detector: OfflineDetectorInstance = createOfflineDetector({
      adapter: createAdapter().adapter,
      probe: { urls: DEFAULT_PROBE_URLS },
      fetch,
    });
    expect(typeof detector.checkNow).toBe('function');
  });
});
