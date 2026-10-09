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

`Insets` é `{ top, right, bottom, left }` em dp. `defaultInsets()` devolve a altura da barra de
status do Android no topo e zero nos demais lados. Passe as margens reais (por exemplo, de
`useSafeAreaInsets()`), principalmente em iPhones com notch.

## Peças

`Snackbar`, `Banner`, `Indicator` e `FullScreen` são exportados com `SnackbarProps`, `BannerProps`,
`IndicatorProps` e `FullScreenProps`. `FullScreen` recebe `phase`, `title`, `strings`, `onRetry` e,
opcionalmente, `onContinueOffline`, `onRestoreFocus`, `visible`, `theme`, `reduceMotion`, `insets`,
`icons`, `style` e `testID`. `PieceIcons` tipa os glifos substituíveis. Um slot recebe o contrato
`PieceRenderProps`, com `theme` preenchido.

`hostContentAccessibilityProps(fullScreenVisible)` devolve as props que escondem o conteúdo do seu
app da tecnologia assistiva enquanto o estado de tela cheia está visível (`no-hide-descendants` no
Android, `accessibilityElementsHidden` no iOS). Espalhe-as na sua view raiz quando montar as peças
por conta própria.

## Hooks

- `useReducedMotion(motion?)` é `true` quando o movimento deve ser reduzido; `'auto'` lê a
  configuração do sistema.
- `useSwipeDismiss({ enabled, onDismiss, reducedMotion, theme? })` devolve `panHandlers`, `onLayout`
  e um `style` animado. Usa `PanResponder` e a API `Animated` nativa do React Native.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `AppStateLike` (tipo)
- `Banner` (componente)
- `BannerProps` (tipo)
- `Bezier` (tipo)
- `createNativeAdapter` (função)
- `createTheme` (constante)
- `darkTheme` (constante)
- `defaultInsets` (função)
- `FullScreen` (componente)
- `FullScreenProps` (tipo)
- `hostContentAccessibilityProps` (função)
- `Indicator` (componente)
- `IndicatorProps` (tipo)
- `Insets` (tipo)
- `lightTheme` (constante)
- `NativeAdapterOptions` (tipo)
- `NetInfoLike` (tipo)
- `OfflineDetector` (componente)
- `OfflineDetectorProps` (tipo)
- `OfflineDetectorSlot` (tipo)
- `OfflineDetectorSlots` (tipo)
- `OfflineTheme` (tipo)
- `packageName` (constante)
- `PieceIcons` (tipo)
- `ShadowStyle` (tipo)
- `Snackbar` (componente)
- `SnackbarProps` (tipo)
- `useOfflineTheme` (constante)
- `useReducedMotion` (hook)
- `useSwipeDismiss` (hook)
- `UseSwipeDismissOptions` (tipo)

<!--/EXPORTS-->
