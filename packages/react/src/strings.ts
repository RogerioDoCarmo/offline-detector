import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import type { Locale, OfflineStrings } from './types';

/** The bundled copy. Equal to the table in `docs/design/strings.md`. */
export const STRINGS: Record<Locale, OfflineStrings> = {
  en: {
    offline: 'No internet',
    offlineNoInterface: 'No network connection',
    offlineNoInternet: 'Connected, but no internet',
    online: 'Back online',
    retry: 'Retry',
    checking: 'Checking…',
    continueOffline: 'Continue offline',
    dismiss: 'Dismiss',
    dismissHint: 'Swipe left or right to dismiss',
    indicatorLabelOnline: 'Online',
    indicatorLabelOffline: 'No internet',
    indicatorLabelChecking: 'Checking connection',
    indicatorAccessibleName: 'Connection status: {status}',
    fullScreenTitle: 'No internet',
    fullScreenBody: 'Check your connection and try again.',
    fullScreenRetry: 'Try again',
  },
  'pt-BR': {
    offline: 'Sem internet',
    offlineNoInterface: 'Sem conexão com a rede',
    offlineNoInternet: 'Conectado, mas sem internet',
    online: 'Conexão restabelecida',
    retry: 'Tentar novamente',
    checking: 'Verificando…',
    continueOffline: 'Continuar offline',
    dismiss: 'Fechar',
    dismissHint: 'Deslize para a esquerda ou direita para fechar',
    indicatorLabelOnline: 'Online',
    indicatorLabelOffline: 'Sem internet',
    indicatorLabelChecking: 'Verificando conexão',
    indicatorAccessibleName: 'Status da conexão: {status}',
    fullScreenTitle: 'Sem internet',
    fullScreenBody: 'Verifique sua conexão e tente novamente.',
    fullScreenRetry: 'Tentar novamente',
  },
  es: {
    offline: 'Sin internet',
    offlineNoInterface: 'Sin conexión de red',
    offlineNoInternet: 'Conectado, pero sin internet',
    online: 'Conexión restablecida',
    retry: 'Reintentar',
    checking: 'Verificando…',
    continueOffline: 'Continuar sin conexión',
    dismiss: 'Cerrar',
    dismissHint: 'Desliza a izquierda o a derecha para descartar',
    indicatorLabelOnline: 'En línea',
    indicatorLabelOffline: 'Sin internet',
    indicatorLabelChecking: 'Verificando conexión',
    indicatorAccessibleName: 'Estado de la conexión: {status}',
    fullScreenTitle: 'Sin internet',
    fullScreenBody: 'Revisa tu conexión e inténtalo de nuevo.',
    fullScreenRetry: 'Intentar de nuevo',
  },
};

/**
 * Any `pt` variant resolves to `pt-BR`, any `es-*` to `es`, everything else (including a missing
 * or malformed input) to `en`. Never throws.
 */
export function resolveLocale(input?: string): Locale {
  if (typeof input !== 'string') return 'en';
  const language = input.trim().toLowerCase().split(/[-_]/)[0];
  if (language === 'pt') return 'pt-BR';
  if (language === 'es') return 'es';
  return 'en';
}

/** The locale's table with `overrides` merged on top. `undefined` overrides are ignored. */
export function resolveStrings(
  locale?: string,
  overrides?: Partial<OfflineStrings>,
): OfflineStrings {
  const merged: OfflineStrings = { ...STRINGS[resolveLocale(locale)] };
  if (overrides) {
    for (const key of Object.keys(overrides) as (keyof OfflineStrings)[]) {
      const value = overrides[key];
      if (value !== undefined) merged[key] = value;
    }
  }
  return merged;
}

/**
 * The text for the offline snackbar, banner and full-screen title. By default it is always
 * `strings.offline`; with `distinguishReason` it names the reason.
 */
export function offlineMessage(
  state: OfflineState,
  strings: OfflineStrings,
  distinguishReason = false,
): string {
  if (distinguishReason) {
    if (state.reason === 'no-interface') return strings.offlineNoInterface;
    if (state.reason === 'no-internet') return strings.offlineNoInternet;
  }
  return strings.offline;
}

/** `strings.indicatorAccessibleName` with every `{status}` replaced by `statusLabel` (literally). */
export function indicatorName(strings: OfflineStrings, statusLabel: string): string {
  return strings.indicatorAccessibleName.split('{status}').join(statusLabel);
}
