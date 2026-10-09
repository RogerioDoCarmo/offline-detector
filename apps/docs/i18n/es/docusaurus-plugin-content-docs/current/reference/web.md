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
| `fetch`             | `ProbeFetch`                                      | `createWebProbeFetch()` | Transporte de la sonda (`no-cors`, `no-store`).                                                                        |
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
| `dismissible`       | `boolean`                                         | `true`                  | Interruptor global del deslizamiento y del Cerrar. Por pieza: opciones `snackbar`, `banner`, `indicator`.              |
| `onDismiss`         | `(piece) => void`                                 |                         | Se descartó una pieza (`'snackbar' \| 'banner' \| 'indicator'`).                                                       |
| `snackbar`          | `{ dismissible? }`                                |                         | Opciones por pieza.                                                                                                    |
| `banner`            | `{ overlay?, dismissible? }`                      |                         | `overlay` flota sobre el contenido.                                                                                    |
| `indicator`         | `{ position?, variant?, dismissible? }`           | `top-end`, automático   | `variant` es `dot` mientras se muestra el banner, si no `chip`.                                                        |
| `motion`            | `'auto' \| 'reduced' \| 'full'`                   | `'auto'`                | `auto` sigue `prefers-reduced-motion`.                                                                                 |
| `colorScheme`       | `'auto' \| 'light' \| 'dark'`                     | `'auto'`                | Cualquier valor distinto de `auto` envuelve el árbol en un elemento `data-od-theme` (`display: contents`).             |
| `recoveryMs`        | `number`                                          | `4000`                  | Cuánto tiempo se muestra "Conexión restablecida". El tiempo se pausa con el snackbar bajo el ratón, con foco o tocado. |
| `slots`             | `{ snackbar?, banner?, indicator?, fullScreen? }` |                         | Reemplaza una pieza por tu componente. Consulta [Slots](../slots.md).                                                  |
| `children`          | `ReactNode`                                       |                         | Tu app.                                                                                                                |

`<OfflineDetector>` no necesita provider ni adapter. Los hooks del [paquete React](./react.md)
funcionan en cualquier punto dentro de él.

## Las piezas

`Snackbar`, `Banner`, `Indicator` y `FullScreen` se exportan para que un [slot](../slots.md) las
reutilice o para que armes tu propio árbol. Todas aceptan `PieceProps`:

| Prop                               | Qué hace                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| `phase`, `message`, `strings`      | Qué mostrar: `'offline' \| 'checking' \| 'recovered'`, el texto y las etiquetas.       |
| `actions`                          | `retry`, `dismiss` (su presencia indica que es descartable), `continueOffline`.        |
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
- `createWebProbeFetch(fetchImpl?)` envuelve el `fetch` de la sonda con `mode: 'no-cors'` y
  `cache: 'no-store'`; así, un éxito opaco cuenta como alcanzable y no hacen falta cabeceras CORS.

## Deslizar

`useSwipeDismiss({ enabled, onDismiss, reducedMotion, keys? })` devuelve `{ props, dragging,
dismissed, dismiss, reset }`; esparce `props` en la raíz de la pieza. `SWIPE_RULES` guarda los umbrales
(30 por ciento del ancho, 0,5 px/ms, bloqueo de eje a 8 px). `lockAxis(dx, dy)` y
`shouldDismiss(dx, width, elapsedMs)` son las decisiones puras que hay detrás. Las teclas por
defecto son `Escape` y `Delete`.

## Tokens

`OfflineTokens` renderiza los tokens y los estilos en un elemento `<style>` (acepta un `nonce`).
`offlineTokensCss` son los tokens como cadena; `offlineCss` añade los estilos de las cuatro piezas.
Consulta [Temas](../theming.md).

## Hooks

- `useReducedMotion(motion?)` es `true` cuando el movimiento debe reducirse; `'auto'` lee
  `prefers-reduced-motion`.
- `useSettledChecking(...)` aplica las reglas de 150 ms y 400 ms a un estado "Verificando…"
  pendiente, para que no destelle ni parpadee.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

<!--EXPORTS-->

- `Axis` (tipo)
- `Banner` (componente)
- `BannerProps` (tipo)
- `createWebAdapter` (función)
- `createWebProbeFetch` (función)
- `DismissKey` (tipo)
- `FullScreen` (componente)
- `Indicator` (componente)
- `IndicatorProps` (tipo)
- `lockAxis` (función)
- `Motion` (tipo)
- `offlineCss` (función)
- `OfflineDetector` (componente)
- `OfflineDetectorProps` (tipo)
- `OfflineDetectorSlots` (tipo)
- `OfflineTokens` (componente)
- `offlineTokensCss` (función)
- `OfflineTokensProps` (tipo)
- `packageName` (constante)
- `Phase` (tipo)
- `PieceIcons` (tipo)
- `PieceProps` (tipo)
- `shouldDismiss` (función)
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
