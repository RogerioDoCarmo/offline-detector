import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import {
  indicatorName,
  offlineMessage,
  resolveLocale,
  resolveStrings,
  STRINGS,
} from './strings';

const state = (reason: OfflineState['reason']): OfflineState => ({
  status: reason === null ? 'online' : 'offline',
  reason,
  checking: false,
  lastChecked: null,
  lastOnlineAt: null,
});

describe('STRINGS (docs/design/strings.md, literally)', () => {
  it('en', () => {
    expect(STRINGS.en).toEqual({
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
    });
  });

  it('pt-BR', () => {
    expect(STRINGS['pt-BR']).toEqual({
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
    });
  });

  it('es', () => {
    expect(STRINGS.es).toEqual({
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
    });
  });
});

describe('resolveLocale', () => {
  it.each([
    [undefined, 'en'],
    ['', 'en'],
    ['en', 'en'],
    ['en-US', 'en'],
    ['fr', 'en'],
    ['de-DE', 'en'],
    ['pt', 'pt-BR'],
    ['pt-BR', 'pt-BR'],
    ['pt-PT', 'pt-BR'],
    ['pt-br', 'pt-BR'],
    ['PT_br', 'pt-BR'],
    ['es', 'es'],
    ['es-MX', 'es'],
    ['es-419', 'es'],
    ['ES', 'es'],
    [' es-AR ', 'es'],
    ['ptolemy', 'en'],
    ['espanol', 'en'],
    ['zh-Hant-TW', 'en'],
  ])('resolves %p to %p', (input, expected) => {
    expect(resolveLocale(input)).toBe(expected);
  });

  it('falls back to en for a non-string that slipped past the types', () => {
    expect(resolveLocale(42 as unknown as string)).toBe('en');
    expect(resolveLocale(null as unknown as string)).toBe('en');
  });
});

describe('resolveStrings', () => {
  it('returns the locale table when there are no overrides', () => {
    expect(resolveStrings('es')).toEqual(STRINGS.es);
    expect(resolveStrings()).toEqual(STRINGS.en);
  });

  it('resolves variants of the locale before looking up', () => {
    expect(resolveStrings('pt-PT').retry).toBe('Tentar novamente');
  });

  it('merges overrides over the locale', () => {
    const merged = resolveStrings('pt-BR', { retry: 'Outra vez' });
    expect(merged.retry).toBe('Outra vez');
    expect(merged.dismiss).toBe('Fechar');
  });

  it('ignores overrides whose value is undefined', () => {
    expect(resolveStrings('en', { retry: undefined }).retry).toBe('Retry');
  });

  it('keeps an empty-string override (an intentional blank)', () => {
    expect(resolveStrings('en', { dismissHint: '' }).dismissHint).toBe('');
  });

  it('never mutates the bundled table', () => {
    resolveStrings('en', { retry: 'X' });
    expect(STRINGS.en.retry).toBe('Retry');
  });
});

describe('offlineMessage', () => {
  const en = STRINGS.en;

  it('is always "offline" by default', () => {
    expect(offlineMessage(state('no-interface'), en)).toBe('No internet');
    expect(offlineMessage(state('no-internet'), en)).toBe('No internet');
    expect(offlineMessage(state(null), en)).toBe('No internet');
  });

  it('is reason-aware when asked', () => {
    expect(offlineMessage(state('no-interface'), en, true)).toBe('No network connection');
    expect(offlineMessage(state('no-internet'), en, true)).toBe(
      'Connected, but no internet',
    );
  });

  it('falls back to "offline" for a null reason even when asked', () => {
    expect(offlineMessage(state(null), en, true)).toBe('No internet');
  });

  it('uses the strings it is given', () => {
    expect(offlineMessage(state('no-internet'), STRINGS.es, true)).toBe(
      'Conectado, pero sin internet',
    );
  });

  it('treats distinguishReason false the same as the default', () => {
    expect(offlineMessage(state('no-interface'), en, false)).toBe('No internet');
  });
});

describe('indicatorName', () => {
  it('fills {status}', () => {
    expect(indicatorName(STRINGS.en, 'Online')).toBe('Connection status: Online');
    expect(indicatorName(STRINGS['pt-BR'], 'Sem internet')).toBe(
      'Status da conexão: Sem internet',
    );
  });

  it('fills every occurrence and treats the label literally', () => {
    const strings = { ...STRINGS.en, indicatorAccessibleName: '{status} / {status}' };
    expect(indicatorName(strings, "$& $1 $'")).toBe("$& $1 $' / $& $1 $'");
  });

  it('leaves a name without the token unchanged', () => {
    const strings = { ...STRINGS.en, indicatorAccessibleName: 'Network' };
    expect(indicatorName(strings, 'Online')).toBe('Network');
  });
});
