---
id: web
title: Referencia web
sidebar_label: web
sidebar_position: 3
---

# `@rogeriodocarmo/offline-detector-web`

Muestra cuándo una app React web no tiene internet: un snackbar con Reintentar, un banner y un
indicador de estado, con un estado de pantalla completa opcional. Accesible, tematizable, traducido
y seguro para renderizar en el servidor. React y react-dom 18 o superior son dependencias peer.

## Props de `OfflineDetector`

Todo es opcional. Consulta el [inicio rápido para web](../web-quick-start.md).

| Prop                | Tipo                                              | Por defecto             | Qué hace                                                                                                               |
| ------------------- | ------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `adapter`           | `PlatformAdapter`                                 | `createWebAdapter()`    | El punto de conexión con la plataforma. Se crea una vez por montaje; se lee una vez.                                   |
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Transporte de la sonda: `no-cors`, `no-store`, sin cookies, sin `Referer`.                                             |
| `probe`             | `ProbeOptions`                                    | valores del core        | URL de la sonda, tiempo de espera, intervalo, método, modo.                                                            |
| `onOffline`         | `(state) => void`                                 |                         | El estado pasó a sin conexión (también cuando el primer resultado es sin conexión).                                    |
| `onOnline`          | `(state) => void`                                 |                         | El estado volvió de sin conexión a en línea.                                                                           |
| `onChange`          | `(state, previous) => void`                       |                         | Cada cambio de estado, incluido el primer resultado.                                                                   |
| `onError`           | `(error) => void`                                 |                         | Excepciones lanzadas por oyentes y callbacks.                                                                          |
| `initialStatus`     | `'online' \| 'offline'`                           | desconocido             | Pista de SSR para el primer renderizado. Nunca dispara "Conexión restablecida".                                        |
| `locale`            | `string`                                          | `'en'`                  | `'en'`, `'pt-BR'`, `'es'` (variantes como `pt`, `es-MX` se resuelven).                                                 |
| `strings`           | `Partial<OfflineStrings>`                         |                         | Sobrescrituras de texto combinadas sobre el idioma.                                                                    |
| `distinguishReason` | `boolean`                                         | `false`                 | Dice "Sin conexión de red" o "Conectado, pero sin internet" en lugar de "Sin internet".                                |
| `fullScreen`        | `boolean \| { continueOffline?: boolean }`        | desactivado             | Estado de pantalla completa opcional sin conexión. `continueOffline: true` añade una salida.                           |
| `onContinueOffline` | `() => void`                                      |                         | El usuario pulsó "Continuar sin conexión" (o Escape) en el estado de pantalla completa.                                |
| `dismissible`       | `boolean`                                         | `true`                  | Interruptor global del deslizamiento y del Cerrar. Por pieza: opciones `snackbar`, `banner`, `indicator`.              |
| `onDismiss`         | `(piece) => void`                                 |                         | Se descartó una pieza (`'snackbar' \| 'banner' \| 'indicator'`).                                                       |
| `snackbar`          | `{ dismissible? }`                                |                         | Opciones por pieza.                                                                                                    |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` flota sobre el contenido.                                                                                    |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, automático   | `variant` es `dot` mientras se muestra el banner, si no `chip`.                                                        |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` sigue `prefers-reduced-motion`.                                                                                 |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Cualquier valor distinto de `auto` envuelve el árbol en un elemento `data-od-theme` (`display: contents`).             |
| `recoveryMs`        | `number`                                          | `4000`                  | Cuánto tiempo se muestra "Conexión restablecida". El tiempo se pausa con el snackbar bajo el ratón, con foco o tocado. |
| `nonce`             | `string`                                          |                         | Nonce de CSP del elemento `<style>` en línea que lleva los tokens y los estilos.                                       |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Reemplaza una pieza por tu componente. Consulta [Slots](../slots.md).                                                  |
| `children`          | `ReactNode`                                       |                         | Tu app.                                                                                                                |

Una pieza descartada sigue oculta hasta el siguiente cambio de estado; después vuelven todas. El
descarte vive solo en memoria. Cuando la pieza descartada tenía el foco del teclado, el foco vuelve
al elemento que lo tenía antes de que apareciera la pieza (al cuerpo de la página si ese elemento
ya no está).

El título de pantalla completa es `strings.fullScreenTitle`; con `distinguishReason` es el mensaje
que depende del motivo.

`<OfflineDetector>` no necesita provider ni adapter. Los hooks (véase abajo) funcionan en cualquier
punto dentro de él.

## Las piezas

`Snackbar`, `Banner`, `Indicator` y `FullScreen` se exportan para que un [slot](../slots.md) las
reutilice o para que armes tu propio árbol. Todas aceptan `PieceProps`, la misma forma que reciben las piezas nativas:

| Prop                               | Qué hace                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `phase`, `message`, `strings`      | Qué mostrar: `'offline' \| 'checking' \| 'recovered'`, el texto y las etiquetas.       |
| `actions`                          | `retry`, `dismiss` (su presencia indica que es descartable), `continueOffline`.        |
| `state`, `theme`                   | Aceptados por paridad con `PieceRenderProps`; las piezas se guían por `phase`.         |
| `visible`                          | Falso en la ventana de salida: la pieza reproduce la salida e ignora entradas.         |
| `rootProps`                        | Props de rol, región viva y dirección que vienen del provider.                         |
| `announce`                         | Si esta pieza es dueña del anuncio al lector de pantalla. Por defecto true.            |
| `motion`                           | `'auto'`, `'reduced'` o `'full'`.                                                      |
| `className`, `style`, `icons`      | Ganchos de estilo; `icons` reemplaza el glifo de sin conexión, en línea o verificando. |
| `checkingDelayMs`, `checkingMinMs` | Tiempos de visibilidad del estado verificando. Por defecto 150 y 400.                  |

`BannerProps` e `IndicatorProps` añaden sus propias opciones (superposición del banner; posición y
variante del indicador); `SnackbarProps` también extiende `PieceProps`.

## Adapter y fetch de la sonda

- `createWebAdapter(env?)` devuelve un `PlatformAdapter` a partir de `navigator.onLine`, de los
  eventos `online` y `offline` y de `visibilitychange` o foco. Lee los globales del navegador solo
  cuando se llama, nunca al importar. `WebAdapterEnv` permite inyectar `window`, `document` y
  `navigator` en pruebas.
- `createWebProbeFetch(fetchImpl?)` envuelve el `fetch` de la sonda con `mode: 'no-cors'`,
  `cache: 'no-store'`, `credentials: 'omit'` y `referrerPolicy: 'no-referrer'`, y devuelve el
  resultado sin tocarlo. Cualquier respuesta completada cuenta como alcanzable, no hacen falta
  cabeceras CORS y la sonda no envía cookies ni `Referer`, ni siquiera a un endpoint del mismo origen.

## Internos del descarte

El hook de deslizar, sus umbrales y los auxiliares de tiempo son internos y no se exportan. Un
diseño propio descarta una pieza pasando `actions.dismiss`: una pieza es descartable exactamente
cuando esa función está presente. Todo deslizamiento tiene una alternativa de teclado (Escape,
Delete) y un botón.

## Tokens

`OfflineTokens` renderiza los tokens y los estilos en un elemento `<style>` (acepta un `nonce`).
`offlineTokensCss` y `offlineCss` son constantes: los tokens como cadena, y los tokens más los
estilos de las cuatro piezas. Los tokens se declaran bajo selectores `:where(...)`, que no tienen especificidad, así que una
regla tuya `:root { --od-... }` prevalece.
Consulta [Temas](../theming.md).

## Hooks y tipos del paquete react

El paquete web reexporta la API de react, así que una app web instala un solo paquete: los hooks
`useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` y `useCheckingFeedback`, y los tipos
`OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`, `DismissiblePiece`,
`Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` y `UseNetworkStatusResult`. Consulta la
[referencia de react](./react.md) para ver qué hacen. El paquete nativo reexporta la misma lista.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

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
- `createWebAdapter` (función)
- `createWebProbeFetch` (función)
- `offlineCss` (constante)
- `offlineTokensCss` (constante)
- `packageName` (constante)
- `useCheckingFeedback` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
