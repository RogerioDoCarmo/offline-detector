---
id: web
title: Referência web
sidebar_label: web
sidebar_position: 3
---

# `@rogeriodocarmo/offline-detector-web`

Mostra quando um app React web está sem internet: um snackbar com Tentar novamente, um banner e um
indicador de status, com um estado de tela cheia opcional. Acessível, tematizável, traduzido e
seguro para renderizar no servidor. React e react-dom 18 ou mais recente são dependências peer.

## Props de `OfflineDetector`

Tudo é opcional. Veja o [início rápido para web](../web-quick-start.md).

| Prop                | Tipo                                              | Padrão                  | O que faz                                                                                            |
| ------------------- | ------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `adapter`           | `PlatformAdapter`                                 | `createWebAdapter()`    | O ponto de conexão com a plataforma. Criado uma vez por montagem; lido uma vez.                      |
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Transporte da sonda: `no-cors`, `no-store`, sem cookies, sem `Referer`.                              |
| `probe`             | `ProbeOptions`                                    | padrões do core         | URLs da sonda, tempo limite, intervalo, método, modo.                                                |
| `onOffline`         | `(state) => void`                                 |                         | O status passou a offline (também quando o primeiro resultado é offline).                            |
| `onOnline`          | `(state) => void`                                 |                         | O status voltou de offline para online.                                                              |
| `onChange`          | `(state, previous) => void`                       |                         | Toda mudança de status, inclusive o primeiro resultado.                                              |
| `onError`           | `(error) => void`                                 |                         | Exceções lançadas por ouvintes e callbacks.                                                          |
| `initialStatus`     | `'online' \| 'offline'`                           | desconhecido            | Dica de SSR para a primeira renderização. Nunca dispara "Conexão restabelecida".                     |
| `locale`            | `string`                                          | `'en'`                  | `'en'`, `'pt-BR'`, `'es'` (variantes como `pt`, `es-MX` são resolvidas).                             |
| `strings`           | `Partial<OfflineStrings>`                         |                         | Sobrescritas de texto mescladas sobre o idioma.                                                      |
| `distinguishReason` | `boolean`                                         | `false`                 | Diz "Sem conexão com a rede" ou "Conectado, mas sem internet" em vez de "Sem internet".              |
| `fullScreen`        | `boolean \| { continueOffline?: boolean }`        | desligado               | Estado de tela cheia opcional quando offline. `continueOffline: true` adiciona uma saída.            |
| `onContinueOffline` | `() => void`                                      |                         | O usuário tocou em "Continuar offline" (ou pressionou Escape) no estado de tela cheia.               |
| `dismissible`       | `boolean`                                         | `true`                  | Chave global do deslizar e do Fechar. Por peça: opções `snackbar`, `banner`, `indicator`.            |
| `onDismiss`         | `(piece) => void`                                 |                         | Uma peça foi dispensada (`'snackbar' \| 'banner' \| 'indicator'`).                                   |
| `snackbar`          | `{ dismissible? }`                                |                         | Opções por peça.                                                                                     |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` flutua sobre o conteúdo.                                                                   |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, automático   | `variant` é `dot` enquanto o banner aparece, senão `chip`.                                           |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` segue `prefers-reduced-motion`.                                                               |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Qualquer valor além de `auto` envolve a árvore em um elemento `data-od-theme` (`display: contents`). |
| `recoveryMs`        | `number`                                          | `4000`                  | Quanto tempo "Conexão restabelecida" aparece. O tempo pausa com o snackbar sob mouse, foco ou toque. |
| `nonce`             | `string`                                          |                         | Nonce de CSP do elemento `<style>` inline que carrega os tokens e os estilos.                        |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Substitui uma peça pelo seu componente. Veja [Slots](../slots.md).                                   |
| `children`          | `ReactNode`                                       |                         | O seu app.                                                                                           |

Uma peça dispensada continua oculta até a próxima mudança de status; depois todas voltam. A
dispensa fica só em memória. Quando a peça dispensada tinha o foco do teclado, o foco volta ao
elemento que o tinha antes de a peça aparecer (ao corpo da página, se esse elemento sumiu).

O título da tela cheia é `strings.fullScreenTitle`; com `distinguishReason` é a mensagem que
depende do motivo.

`<OfflineDetector>` não precisa de provider nem de adapter. Os hooks (veja abaixo) funcionam em
qualquer ponto dentro dele.

## As peças

`Snackbar`, `Banner`, `Indicator` e `FullScreen` são exportados para que um [slot](../slots.md) os
reaproveite ou para você montar a sua própria árvore. Todos aceitam `PieceProps`, o mesmo formato que as peças nativas recebem:

| Prop                               | O que faz                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `phase`, `message`, `strings`      | O que mostrar: `'offline' \| 'checking' \| 'recovered'`, o texto e os rótulos.    |
| `actions`                          | `retry`, `dismiss` (a presença dele indica que é dispensável), `continueOffline`. |
| `state`, `theme`                   | Aceitos por paridade com `PieceRenderProps`; as peças são guiadas por `phase`.    |
| `visible`                          | Falso na janela de saída: a peça roda a saída e ignora entradas.                  |
| `rootProps`                        | Props de papel, região viva e direção vindas do provider.                         |
| `announce`                         | Se esta peça é dona do anúncio ao leitor de tela. Padrão true.                    |
| `motion`                           | `'auto'`, `'reduced'` ou `'full'`.                                                |
| `className`, `style`, `icons`      | Ganchos de estilo; `icons` troca o glifo de offline, online ou verificando.       |
| `checkingDelayMs`, `checkingMinMs` | Tempos de visibilidade do estado verificando. Padrões 150 e 400.                  |

`BannerProps` e `IndicatorProps` acrescentam as suas próprias opções (sobreposição do banner; posição
e variante do indicador); `SnackbarProps` também estende `PieceProps`.

## Adapter e fetch da sonda

- `createWebAdapter(env?)` devolve um `PlatformAdapter` a partir de `navigator.onLine`, dos eventos
  `online` e `offline` e de `visibilitychange` ou foco. Ele lê os globais do navegador somente quando
  é chamado, nunca na importação. `WebAdapterEnv` permite injetar `window`, `document` e `navigator`
  em testes.
- `createWebProbeFetch(fetchImpl?)` envolve o `fetch` da sonda com `mode: 'no-cors'`,
  `cache: 'no-store'`, `credentials: 'omit'` e `referrerPolicy: 'no-referrer'`, e devolve o
  resultado sem alterá-lo. Qualquer resposta concluída conta como alcançável, nenhum cabeçalho CORS
  é necessário e a sonda não envia cookies nem `Referer`, nem mesmo a um endpoint de mesma origem.

## Internos da dispensa

O hook de deslizar, os seus limites e os auxiliares de tempo são internos e não são exportados. Um
layout próprio dispensa uma peça passando `actions.dismiss`: uma peça é dispensável exatamente
quando essa função está presente. Todo deslizar tem uma alternativa de teclado (Escape, Delete) e
um botão.

## Tokens

`OfflineTokens` renderiza os tokens e os estilos em um elemento `<style>` (aceita um `nonce`).
`offlineTokensCss` e `offlineCss` são constantes: os tokens como string, e os tokens mais os estilos
das quatro peças. Os tokens são declarados sob `:where(:root)`, então uma regra sua
`:root { --od-... }` prevalece.
Veja [Temas](../theming.md).

## Hooks e tipos do pacote react

O pacote web reexporta a API do react, então um app web instala um único pacote: os hooks
`useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` e `useCheckingFeedback`, e os tipos
`OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`, `DismissiblePiece`,
`Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` e `UseNetworkStatusResult`. Veja a
[referência do react](./react.md) para saber o que fazem. O pacote nativo reexporta a mesma lista.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `Banner` (componente)
- `BannerProps` (tipo)
- `DismissiblePiece` (tipo)
- `FullScreen` (componente)
- `Indicator` (componente)
- `IndicatorPosition` (tipo)
- `IndicatorProps` (tipo)
- `Locale` (tipo)
- `Motion` (tipo)
- `OfflineDetector` (componente)
- `OfflineDetectorProps` (tipo)
- `OfflineDetectorSlots` (tipo)
- `OfflineState` (tipo)
- `OfflineStrings` (tipo)
- `OfflineTokens` (componente)
- `OfflineTokensProps` (tipo)
- `OfflineUiOptions` (tipo)
- `Phase` (tipo)
- `PieceIcons` (tipo)
- `PieceProps` (tipo)
- `PieceRenderProps` (tipo)
- `RecheckOnReturnOptions` (tipo)
- `Snackbar` (componente)
- `SnackbarProps` (tipo)
- `UseNetworkStatusResult` (tipo)
- `WebAdapterEnv` (tipo)
- `createWebAdapter` (função)
- `createWebProbeFetch` (função)
- `offlineCss` (constante)
- `offlineTokensCss` (constante)
- `packageName` (constante)
- `useCheckingFeedback` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
