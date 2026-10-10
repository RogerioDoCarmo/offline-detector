---
id: native
title: Referência nativa
sidebar_label: native
sidebar_position: 4
---

# `@rogeriodocarmo/offline-detector-native`

Mostra quando um app React Native está sem internet: por padrão, um snackbar com Tentar novamente,
um banner e um indicador, além de um estado de tela cheia opcional. Sem código nativo, sem Reanimated,
sem gesture-handler. Exige React 18 ou mais recente e React Native 0.73 ou mais recente. Veja o
[início rápido para nativo](../native-quick-start.md).

## Props de `OfflineDetector`

| Prop                | Notas                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `netInfo`           | O módulo NetInfo, passado pelo app. Ignorado quando `adapter` é informado.                         |
| `adapter`           | Um `PlatformAdapter`. Padrão: `createNativeAdapter({ netInfo })`, criado uma vez.                  |
| `probe`             | Configurações da sonda de alcance (veja a [referência do react](./react.md)).                      |
| `fetch`             | O transporte da sonda.                                                                             |
| `onOffline`         | Dispara quando o status passa a offline.                                                           |
| `onOnline`          | Dispara quando o status volta de offline para online.                                              |
| `onChange`          | Dispara a cada mudança de status.                                                                  |
| `onError`           | Recebe exceções lançadas por ouvintes e callbacks.                                                 |
| `initialStatus`     | Como no pacote react.                                                                              |
| `detector`          | Como no pacote react.                                                                              |
| `locale`            | `en`, `pt-BR`, `es`; o padrão segue o idioma do dispositivo.                                       |
| `strings`           | Sobrescritas de texto.                                                                             |
| `distinguishReason` | `true` diz "Sem conexão com a rede" ou "Conectado, mas sem internet".                              |
| `fullScreen`        | `true`, ou `{ continueOffline: true }` para a saída. Desligado por padrão.                         |
| `onContinueOffline` | Dispara quando "Continuar offline" é tocado.                                                       |
| `onRestoreFocus`    | Dispara quando o estado de tela cheia sai, para o app devolver o foco do leitor de tela.           |
| `snackbar`          | Opções por peça: `dismissible`.                                                                    |
| `banner`            | Opções por peça: `dismissible`, `position`, `overlay`.                                             |
| `indicator`         | Opções por peça: `dismissible`, `position`, `variant`.                                             |
| `dismissible`       | As peças podem ser deslizadas para sumir (padrão); uma peça dispensada volta na próxima transição. |
| `onDismiss`         | `(piece) => void`.                                                                                 |
| `motion`            | `'auto'`, `'reduced'`, `'full'`.                                                                   |
| `colorScheme`       | `'auto'`, `'light'`, `'dark'`.                                                                     |
| `theme`             | Sobrescritas de tokens em `Partial<OfflineTheme>`. Veja [Temas](../theming.md).                    |
| `insets`            | Margens de área segura em `Partial<Insets>`.                                                       |
| `recoveryMs`        | Quanto tempo "Conexão restabelecida" aparece. Padrão 4000.                                         |
| `slots`             | Substitui uma peça por completo. Veja [Slots](../slots.md).                                        |

O conteúdo do app fica oculto para a tecnologia assistiva enquanto o estado de tela cheia aparece.

## Adapter

`createNativeAdapter({ netInfo?, appState? })` devolve um `PlatformAdapter`:

- `netInfo` é o módulo NetInfo (`NetInfoLike`: `fetch()` e `addEventListener()`), passado pelo app.
  O pacote nunca o importa. Sem ele, presume-se que a interface está ativa e só a sonda decide;
  builds de desenvolvimento avisam uma vez.
- `appState` usa por padrão o `AppState` do React Native (`AppStateLike`). Um retorno ao primeiro
  plano é uma mudança de `background` ou `inactive` para `active`.
- A interface está ativa quando `isConnected !== false`.

## Tema

`OfflineTheme` é o objeto tipado de tokens; `lightTheme` e `darkTheme` são os dois padrões;
`createTheme(overrides?, scheme?)` mescla sobrescritas sobre um deles; `useOfflineTheme(...)` devolve
o tema resolvido dentro de um componente. Todas as chaves estão em [Temas](../theming.md).

## Margens de área segura

`Insets` é `{ top, right, bottom, left }` em dp. O padrão é a altura da barra de status do Android
no topo e zero nos demais lados, o que está errado em iPhones com notch: passe as margens reais
(por exemplo, de `useSafeAreaInsets()`).

## Peças

`Snackbar`, `Banner`, `Indicator` e `FullScreen` são exportados com `SnackbarProps`, `BannerProps`,
`IndicatorProps` e `FullScreenProps`. Recebem as mesmas props das peças web: `phase`, `message`,
`strings`, e opcionalmente `state`, `actions`, `visible`, `rootProps` e `theme`, além de extras
nativos (`announce`, `reduceMotion`, `insets`, `icons`, `style`, `testID`; no banner `position`,
`overlay`, `showRetry`, `offset`; no indicador `variant`, `position`, `offsetTop`, `offsetBottom`; no
snackbar `offsetBottom`; na tela cheia `onRestoreFocus`).

`actions` é `{ retry?, dismiss?, continueOffline? }`. Uma peça é dispensável exatamente quando
`actions.dismiss` está presente, e a tela cheia mostra "Continuar offline" exatamente quando
`actions.continueOffline` está. Não há props separadas de tentar de novo, dispensar ou título:
use `actions` e `message` (o título da tela cheia). Uma peça deslizada para fora volta ao repouso quando
`visible` volta a ser true, então ela reaparece na próxima transição. `PieceIcons` tipa os glifos
substituíveis. Um slot recebe o contrato `PieceRenderProps`, com `theme` preenchido.

O hook de deslizar, as regras de deslize e de tempo e o auxiliar de acessibilidade que esconde o
conteúdo do app são internos e não são exportados; `<OfflineDetector>` esconde o conteúdo do app
para você enquanto o estado de tela cheia aparece.

## Hooks e tipos

- `useReducedMotion(motion?)` é `true` quando o movimento deve ser reduzido; `'auto'` lê a
  configuração do sistema.
- `useOfflineTheme(...)` devolve o tema resolvido dentro dos seus próprios componentes.
- O pacote nativo reexporta a API do react, então um app instala um único pacote: os hooks
  `useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` e `useCheckingFeedback`, e os tipos
  `OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`, `DismissiblePiece`,
  `Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` e `UseNetworkStatusResult`. Veja a
  [referência do react](./react.md). O pacote web reexporta a mesma lista.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `AppStateLike` (tipo)
- `Banner` (componente)
- `BannerProps` (tipo)
- `Bezier` (tipo)
- `DismissiblePiece` (tipo)
- `FullScreen` (componente)
- `FullScreenProps` (tipo)
- `Indicator` (componente)
- `IndicatorPosition` (tipo)
- `IndicatorProps` (tipo)
- `Insets` (tipo)
- `Locale` (tipo)
- `NativeAdapterOptions` (tipo)
- `NetInfoLike` (tipo)
- `OfflineDetector` (componente)
- `OfflineDetectorProps` (tipo)
- `OfflineDetectorSlot` (tipo)
- `OfflineDetectorSlots` (tipo)
- `OfflineState` (tipo)
- `OfflineStrings` (tipo)
- `OfflineTheme` (tipo)
- `OfflineUiOptions` (tipo)
- `Phase` (tipo)
- `PieceIcons` (tipo)
- `PieceProps` (tipo)
- `PieceRenderProps` (tipo)
- `RecheckOnReturnOptions` (tipo)
- `STRINGS` (constante)
- `ShadowStyle` (tipo)
- `Snackbar` (componente)
- `SnackbarProps` (tipo)
- `UseNetworkStatusResult` (tipo)
- `createNativeAdapter` (função)
- `createTheme` (função)
- `darkTheme` (constante)
- `indicatorName` (função)
- `lightTheme` (constante)
- `offlineMessage` (função)
- `packageName` (constante)
- `resolveDismissible` (função)
- `resolveLocale` (função)
- `resolveStrings` (função)
- `useCheckingFeedback` (hook)
- `useDismissals` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useOfflineTheme` (hook)
- `useRecheckOnReturn` (hook)
- `useReducedMotion` (hook)

<!--/EXPORTS-->
