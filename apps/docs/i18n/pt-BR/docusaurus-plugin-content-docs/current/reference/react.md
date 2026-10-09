---
id: react
title: Referência do react
sidebar_label: react
sidebar_position: 2
---

# `@rogeriodocarmo/offline-detector-react`

A camada React sobre o [motor core](./core.md): um provider, hooks, estado de dispensa, textos
incluídos e os tipos compartilhados nos quais os pacotes web e nativo se apoiam. Não tem DOM nem
imports do React Native; assim, uma única cópia serve aos dois. Um **adapter de plataforma**, dos
pacotes web ou nativo, fornece os sinais da plataforma. Exige React 18 ou mais recente.

## `OfflineDetectorProvider`

```tsx
import {
  OfflineDetectorProvider,
  useNetworkStatus,
} from '@rogeriodocarmo/offline-detector-react';
import {
  createWebAdapter,
  createWebProbeFetch,
} from '@rogeriodocarmo/offline-detector-web';

const adapter = createWebAdapter();
const fetch = createWebProbeFetch();

export function App() {
  return (
    <OfflineDetectorProvider adapter={adapter} fetch={fetch}>
      <Screen />
    </OfflineDetectorProvider>
  );
}
```

O provider cria **um** detector por montagem, inicia-o em um efeito e o para quando é desmontado. A
montagem extra do StrictMode do React não inicia uma segunda verificação nem vaza temporizador ou
ouvinte. Nada roda durante a renderização; portanto renderizar no servidor e hidratar é seguro.

| Prop            | Notas                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `adapter`       | Obrigatório. Um `PlatformAdapter`. Lido uma vez por montagem.                                           |
| `probe`         | `ProbeOptions` do core (`urls`, `timeoutMs`, `intervalMs`, `method`, `mode`). Lido uma vez.             |
| `fetch`         | O transporte da sonda. Lido uma vez. Na web, use `createWebProbeFetch()`.                               |
| `onOffline`     | `(state) => void`. Dispara quando o status passa a `offline`, inclusive num primeiro resultado offline. |
| `onOnline`      | `(state) => void`. Dispara quando o status vai de `offline` de volta a `online`.                        |
| `onChange`      | `(state, previous) => void`. Dispara a cada mudança de status, inclusive no primeiro resultado.         |
| `onError`       | `(error) => void`. Recebe exceções lançadas por callbacks e por `onResult`.                             |
| `initialStatus` | `'online'` ou `'offline'`. Dica para SSR: o que a primeira renderização presume.                        |
| `detector`      | Ponto de teste: usa este detector em vez de criar um. Os callbacks não são ligados a ele.               |

Os callbacks disparam só em transições de status reais, são lidos por uma ref (passar uma função nova
a cada renderização nunca reinicia o detector) e `onOnline` não dispara quando o primeiro resultado
é online.

## Hooks

| Hook                       | Devolve                                                |
| -------------------------- | ------------------------------------------------------ |
| `useNetworkStatus()`       | `OfflineState` mais `isOnline: boolean` e `checkNow()` |
| `useOfflineDetector()`     | O `OfflineDetectorInstance` do core, para uso avançado |
| `useRecheckOnReturn(opts)` | `boolean`, o último estado online conhecido            |
| `useCheckingFeedback()`    | `'brief'` ou `'none'`, para pacotes de interface       |
| `useDismissals(options)`   | `{ isDismissed(piece), dismiss(piece) }`               |

Todo hook lança um erro claro quando usado fora de `<OfflineDetectorProvider>`.

```ts
type UseNetworkStatusResult = OfflineState & {
  isOnline: boolean; // true enquanto o status é 'unknown'
  checkNow(): Promise<OfflineState>; // chamadas simultâneas compartilham uma sonda
};
```

`useRecheckOnReturn` recebe `{ checkingFeedback?: 'brief' | 'none'; onResult?: (isOnline) => void }`.
Veja [Verificar ao voltar](../recheck-on-return.md).

## Auxiliares de dispensa

```ts
interface DismissOptions {
  dismissible?: boolean; // global, padrão true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: 'snackbar' | 'banner' | 'indicator'): void;
}
```

`resolveDismissible(piece, options)` é pura: um valor por peça vence o global e o padrão é `true`.
`useDismissals(options)` mantém as dispensas na memória até a próxima transição de status. Veja
[Dispensar](../dismissal.md).

## Textos e idiomas

| Função                                               | O que faz                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `STRINGS`                                            | As tabelas incluídas de `en`, `pt-BR` e `es`.                              |
| `resolveLocale(input?)`                              | `'en'`, `'pt-BR'` ou `'es'`. Nunca lança erro.                             |
| `resolveStrings(locale?, overrides?)`                | A tabela do idioma com um `Partial<OfflineStrings>` mesclado por cima.     |
| `offlineMessage(state, strings, distinguishReason?)` | O texto de offline; ciente do motivo quando o terceiro argumento é `true`. |
| `indicatorName(strings, label)`                      | O nome acessível do indicador, com `{status}` preenchido.                  |

Veja [Idiomas e textos](../i18n.md).

## Tipos

`OfflineUiOptions` (dispensa, idioma, textos, indicador, banner, snackbar, movimento, esquema de
cores), `PieceRenderProps<Theme = unknown>` (o contrato de render props, veja [Slots](../slots.md)),
`OfflineStrings`, `Locale`, `PieceName`, `DismissiblePiece`, `IndicatorPosition`, `DismissOptions`,
`RecheckOnReturnOptions`, `UseNetworkStatusResult` e `OfflineDetectorProviderProps` são exportados
somente como tipos.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `DismissiblePiece` (tipo)
- `DismissOptions` (tipo)
- `indicatorName` (função)
- `IndicatorPosition` (tipo)
- `Locale` (tipo)
- `OfflineDetectorProvider` (componente)
- `OfflineDetectorProviderProps` (tipo)
- `offlineMessage` (função)
- `OfflineStrings` (tipo)
- `OfflineUiOptions` (tipo)
- `packageName` (constante)
- `PieceName` (tipo)
- `PieceRenderProps` (tipo)
- `RecheckOnReturnOptions` (tipo)
- `resolveDismissible` (função)
- `resolveLocale` (função)
- `resolveStrings` (função)
- `STRINGS` (constante)
- `useCheckingFeedback` (hook)
- `useDismissals` (hook)
- `useNetworkStatus` (hook)
- `UseNetworkStatusResult` (tipo)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
