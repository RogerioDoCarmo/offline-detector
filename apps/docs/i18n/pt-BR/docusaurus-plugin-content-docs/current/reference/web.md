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
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Transporte da sonda (`no-cors`, `no-store`).                                                         |
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
| `dismissible`       | `boolean`                                         | `true`                  | Chave global do deslizar e do Fechar. Por peça: opções `snackbar`, `banner`, `indicator`.            |
| `onDismiss`         | `(piece) => void`                                 |                         | Uma peça foi dispensada (`'snackbar' \| 'banner' \| 'indicator'`).                                   |
| `snackbar`          | `{ dismissible? }`                                |                         | Opções por peça.                                                                                     |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` flutua sobre o conteúdo.                                                                   |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, automático   | `variant` é `dot` enquanto o banner aparece, senão `chip`.                                           |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` segue `prefers-reduced-motion`.                                                               |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Qualquer valor além de `auto` envolve a árvore em um elemento `data-od-theme` (`display: contents`). |
| `recoveryMs`        | `number`                                          | `4000`                  | Quanto tempo "Conexão restabelecida" aparece. O tempo pausa com o snackbar sob mouse, foco ou toque. |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Substitui uma peça pelo seu componente. Veja [Slots](../slots.md).                                   |
| `children`          | `ReactNode`                                       |                         | O seu app.                                                                                           |

`<OfflineDetector>` não precisa de provider nem de adapter. Os hooks do [pacote React](./react.md)
funcionam em qualquer ponto dentro dele.

## As peças

`Snackbar`, `Banner`, `Indicator` e `FullScreen` são exportados para que um [slot](../slots.md) os
reaproveite ou para você montar a sua própria árvore. Todos aceitam `PieceProps`:

| Prop                               | O que faz                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `phase`, `message`, `strings`      | O que mostrar: `'offline' \| 'checking' \| 'recovered'`, o texto e os rótulos.    |
| `actions`                          | `retry`, `dismiss` (a presença dele indica que é dispensável), `continueOffline`. |
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
- `createWebProbeFetch(fetchImpl?)` envolve o `fetch` da sonda com `mode: 'no-cors'` e
  `cache: 'no-store'`; assim, um sucesso opaco conta como alcançável e nenhum cabeçalho CORS é
  necessário.

## Deslizar

`useSwipeDismiss({ enabled, onDismiss, reducedMotion, keys? })` devolve `{ props, dragging,
dismissed, dismiss, reset }`; espalhe `props` na raiz da peça. `SWIPE_RULES` guarda os limites (30
por cento da largura, 0,5 px/ms, trava de eixo em 8 px). `lockAxis(dx, dy)` e
`shouldDismiss(dx, width, elapsedMs)` são as decisões puras por trás disso. As teclas padrão são
`Escape` e `Delete`.

## Tokens

`OfflineTokens` renderiza os tokens e os estilos em um elemento `<style>` (aceita um `nonce`).
`offlineTokensCss` são os tokens como string; `offlineCss` acrescenta os estilos das quatro peças.
Veja [Temas](../theming.md).

## Hooks

- `useReducedMotion(motion?)` é `true` quando o movimento deve ser reduzido; `'auto'` lê
  `prefers-reduced-motion`.
- `useSettledChecking(...)` aplica as regras de 150 ms e 400 ms a um estado "Verificando…" pendente,
  para que ele não pisque nem cintile.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `Axis` (tipo)
- `Banner` (componente)
- `BannerProps` (tipo)
- `createWebAdapter` (função)
- `createWebProbeFetch` (função)
- `DismissKey` (tipo)
- `FullScreen` (componente)
- `Indicator` (componente)
- `IndicatorProps` (tipo)
- `lockAxis` (função)
- `Motion` (tipo)
- `offlineCss` (função)
- `OfflineDetector` (componente)
- `OfflineDetectorProps` (tipo)
- `OfflineDetectorSlots` (tipo)
- `OfflineTokens` (componente)
- `offlineTokensCss` (função)
- `OfflineTokensProps` (tipo)
- `packageName` (constante)
- `Phase` (tipo)
- `PieceIcons` (tipo)
- `PieceProps` (tipo)
- `shouldDismiss` (função)
- `Snackbar` (componente)
- `SnackbarProps` (tipo)
- `SWIPE_RULES` (constante)
- `SwipeDismissProps` (tipo)
- `useReducedMotion` (hook)
- `useSettledChecking` (hook)
- `useSwipeDismiss` (hook)
- `UseSwipeDismissOptions` (tipo)
- `UseSwipeDismissResult` (tipo)
- `WebAdapterEnv` (tipo)

<!--/EXPORTS-->
