// Pure settings logic. No React Native imports, so the repo's Jest can test it.

export type Locale = 'en' | 'pt-BR' | 'es';
export type FullScreenMode = 'off' | 'on' | 'continue';
export type ColorScheme = 'auto' | 'light' | 'dark';
export type Motion = 'auto' | 'reduced' | 'full';
export type CheckingFeedback = 'brief' | 'none';

export interface Settings {
  locale: Locale;
  distinguishReason: boolean;
  dismissible: boolean;
  fullScreen: FullScreenMode;
  colorScheme: ColorScheme;
  motion: Motion;
  recoveryMs: number;
  /** Comma or newline separated. Empty means the package default. */
  probeUrls: string;
  intervalMs: number;
  /** Stub probe (no network) or the real fetch. */
  useStubProbe: boolean;
  /** Pass the NetInfo module to the detector, or leave it out. */
  passNetInfo: boolean;
  useSlots: boolean;
  checkingFeedback: CheckingFeedback;
}

export const INTERVALS = [3000, 10000, 30000];
export const RECOVERY_CHOICES = [1000, 4000, 8000];

export const defaultSettings: Settings = {
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
};

export function buildProbeOptions(settings: Settings): {
  urls?: string[];
  intervalMs: number;
} {
  const urls = settings.probeUrls
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
  return urls.length > 0
    ? { urls, intervalMs: settings.intervalMs }
    : { intervalMs: settings.intervalMs };
}

/**
 * The detector reads `probe`, `fetch` and the adapter once per mount, so changing any of them
 * must remount it. Everything else is a live prop.
 */
export function detectorKey(settings: Settings): string {
  return JSON.stringify([
    settings.probeUrls,
    settings.intervalMs,
    settings.useStubProbe,
    settings.passNetInfo,
  ]);
}
