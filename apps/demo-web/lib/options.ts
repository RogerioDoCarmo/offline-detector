import { DEFAULT_PROBE_URLS } from '@rogeriodocarmo/offline-detector-core';
import type { ProbeOptions } from '@rogeriodocarmo/offline-detector-core';
import type { OfflineDetectorProps } from '@rogeriodocarmo/offline-detector-web';

/** Per-piece switches: leave the library default, or force on or off. */
export type Tri = 'default' | 'yes' | 'no';
export type IndicatorPositionChoice =
  'default' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

/** Everything the control panel can change. One flat, serialisable object. */
export interface DemoOptions {
  locale: 'en' | 'pt-BR' | 'es';
  distinguishReason: boolean;
  dismissible: boolean;
  snackbarDismissible: Tri;
  bannerDismissible: Tri;
  indicatorDismissible: Tri;
  fullScreen: 'off' | 'on' | 'continue';
  colorScheme: 'auto' | 'light' | 'dark';
  motion: 'auto' | 'reduced' | 'full';
  recoveryMs: number;
  bannerOverlay: boolean;
  indicatorPosition: IndicatorPositionChoice;
  indicatorVariant: 'auto' | 'chip' | 'dot';
  retryLabel: string;
  customSnackbar: boolean;
  initialStatus: 'unknown' | 'online' | 'offline';
  probeUrls: string;
  probeIntervalMs: number;
  probeTimeoutMs: number;
  probeMethod: 'HEAD' | 'GET';
  probeMode: 'probe' | 'interface-only';
  /** Use the library's own network probe instead of the stub. */
  realProbe: boolean;
  /** How long the stub takes to answer, so "Checking" is visible. */
  stubLatencyMs: number;
  recheckScreen: boolean;
  checkingFeedback: 'brief' | 'none';
}

export const DEFAULT_OPTIONS: DemoOptions = {
  locale: 'en',
  distinguishReason: false,
  dismissible: true,
  snackbarDismissible: 'default',
  bannerDismissible: 'default',
  indicatorDismissible: 'default',
  fullScreen: 'off',
  colorScheme: 'auto',
  motion: 'auto',
  recoveryMs: 4000,
  bannerOverlay: false,
  indicatorPosition: 'default',
  indicatorVariant: 'auto',
  retryLabel: '',
  customSnackbar: false,
  initialStatus: 'unknown',
  probeUrls: DEFAULT_PROBE_URLS.join('\n'),
  probeIntervalMs: 30000,
  probeTimeoutMs: 5000,
  probeMethod: 'HEAD',
  probeMode: 'probe',
  realProbe: false,
  stubLatencyMs: 400,
  recheckScreen: false,
  checkingFeedback: 'brief',
};

/** One URL per line; blank lines are dropped. */
export function parseUrls(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function triToBoolean(value: Tri): boolean | undefined {
  if (value === 'default') return undefined;
  return value === 'yes';
}

function defined(object: Record<string, unknown>): Record<string, unknown> | undefined {
  const entries = Object.entries(object).filter(([, value]) => value !== undefined);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

/**
 * The props for `<OfflineDetector>` that the options describe (without `fetch`, `adapter`, the
 * callbacks and `slots`, which the demo wires itself). Unset choices are left out, so the library
 * default applies and the panel shows what is really passed.
 */
export function buildDetectorProps(
  options: DemoOptions,
): Omit<OfflineDetectorProps, 'children'> {
  const urls = parseUrls(options.probeUrls);
  const probe: ProbeOptions = {
    ...(urls.length > 0 ? { urls } : {}),
    intervalMs: options.probeIntervalMs,
    timeoutMs: options.probeTimeoutMs,
    method: options.probeMethod,
    mode: options.probeMode,
  };

  const props: Omit<OfflineDetectorProps, 'children'> = {
    locale: options.locale,
    distinguishReason: options.distinguishReason,
    dismissible: options.dismissible,
    colorScheme: options.colorScheme,
    motion: options.motion,
    recoveryMs: options.recoveryMs,
    probe,
  };

  if (options.fullScreen === 'on') props.fullScreen = true;
  if (options.fullScreen === 'continue') props.fullScreen = { continueOffline: true };
  if (options.initialStatus !== 'unknown') props.initialStatus = options.initialStatus;
  if (options.retryLabel !== '') props.strings = { retry: options.retryLabel };

  const snackbar = defined({ dismissible: triToBoolean(options.snackbarDismissible) });
  const banner = defined({
    dismissible: triToBoolean(options.bannerDismissible),
    overlay: options.bannerOverlay ? true : undefined,
  });
  const indicator = defined({
    dismissible: triToBoolean(options.indicatorDismissible),
    position:
      options.indicatorPosition === 'default' ? undefined : options.indicatorPosition,
    variant: options.indicatorVariant === 'auto' ? undefined : options.indicatorVariant,
  });
  if (snackbar)
    props.snackbar = snackbar as NonNullable<OfflineDetectorProps['snackbar']>;
  if (banner) props.banner = banner as NonNullable<OfflineDetectorProps['banner']>;
  if (indicator)
    props.indicator = indicator as NonNullable<OfflineDetectorProps['indicator']>;

  return props;
}

/**
 * `probe`, `initialStatus` and the transport are read once per mount, so the detector is
 * remounted (by changing this key) when any of them changes. Everything else updates live.
 */
export function mountKey(options: DemoOptions): string {
  return JSON.stringify([
    options.probeUrls,
    options.probeIntervalMs,
    options.probeTimeoutMs,
    options.probeMethod,
    options.probeMode,
    options.initialStatus,
    options.realProbe,
  ]);
}
