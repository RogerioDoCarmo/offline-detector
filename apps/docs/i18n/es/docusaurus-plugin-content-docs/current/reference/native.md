---
id: native
title: Referencia nativa
sidebar_label: native
sidebar_position: 4
---

# `@rogeriodocarmo/offline-detector-native`

Muestra cuándo una app React Native no tiene internet: por defecto, un snackbar con Reintentar, un
banner y un indicador, además de un estado de pantalla completa opcional. Sin código nativo, sin
Reanimated, sin gesture-handler. Requiere React 18 o superior y React Native 0.73 o superior.
Consulta el [inicio rápido para nativo](../native-quick-start.md).

## Props de `OfflineDetector`

| Prop                | Notas                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `netInfo`           | El módulo NetInfo, pasado por la app. Se ignora cuando se indica `adapter`.                                            |
| `adapter`           | Un `PlatformAdapter`. Por defecto: `createNativeAdapter({ netInfo })`, creado una vez.                                 |
| `probe`             | Configuración de la sonda de alcance (consulta la [referencia de react](./react.md)).                                  |
| `fetch`             | El transporte de la sonda.                                                                                             |
| `onOffline`         | Se dispara cuando el estado pasa a sin conexión.                                                                       |
| `onOnline`          | Se dispara cuando el estado vuelve de sin conexión a en línea.                                                         |
| `onChange`          | Se dispara en cada cambio de estado.                                                                                   |
| `onError`           | Recibe excepciones lanzadas por oyentes y callbacks.                                                                   |
| `initialStatus`     | Como en el paquete react.                                                                                              |
| `detector`          | Como en el paquete react.                                                                                              |
| `locale`            | `en`, `pt-BR`, `es`; por defecto sigue el idioma del dispositivo.                                                      |
| `strings`           | Sobrescrituras de texto.                                                                                               |
| `distinguishReason` | `true` dice "Sin conexión de red" o "Conectado, pero sin internet".                                                    |
| `fullScreen`        | `true`, o `{ continueOffline: true }` para la salida. Desactivado por defecto.                                         |
| `onContinueOffline` | Se dispara cuando se pulsa "Continuar sin conexión".                                                                   |
| `onRestoreFocus`    | Se dispara cuando el estado de pantalla completa se va, para que la app devuelva el foco del lector de pantalla.       |
| `snackbar`          | Opciones por pieza: `dismissible`.                                                                                     |
| `banner`            | Opciones por pieza: `dismissible`, `position`, `overlay`.                                                              |
| `indicator`         | Opciones por pieza: `dismissible`, `position`, `variant`.                                                              |
| `dismissible`       | Las piezas se pueden deslizar para descartarlas (por defecto); una pieza descartada vuelve en la siguiente transición. |
| `onDismiss`         | `(piece) => void`.                                                                                                     |
| `motion`            | `'auto'`, `'reduced'`, `'full'`.                                                                                       |
| `colorScheme`       | `'auto'`, `'light'`, `'dark'`.                                                                                         |
| `theme`             | Sobrescrituras de tokens en `Partial<OfflineTheme>`. Consulta [Temas](../theming.md).                                  |
| `insets`            | Márgenes de área segura en `Partial<Insets>`.                                                                          |
| `recoveryMs`        | Cuánto tiempo se muestra "Conexión restablecida". Por defecto 4000.                                                    |
| `slots`             | Reemplaza una pieza por completo. Consulta [Slots](../slots.md).                                                       |

El contenido de la app queda oculto para la tecnología de asistencia mientras se muestra el estado de
pantalla completa.

## Adapter

`createNativeAdapter({ netInfo?, appState? })` devuelve un `PlatformAdapter`:

- `netInfo` es el módulo NetInfo (`NetInfoLike`: `fetch()` y `addEventListener()`), pasado por la
  app. El paquete nunca lo importa. Sin él se supone que la interfaz está activa y solo decide la
  sonda; las builds de desarrollo avisan una vez.
- `appState` usa por defecto el `AppState` de React Native (`AppStateLike`). Un regreso al primer
  plano es un cambio de `background` o `inactive` a `active`.
- La interfaz está activa cuando `isConnected !== false`.

## Tema

`OfflineTheme` es el objeto tipado de tokens; `lightTheme` y `darkTheme` son los dos valores por
defecto; `createTheme(overrides?, scheme?)` combina sobrescrituras sobre uno de ellos;
`useOfflineTheme(...)` devuelve el tema resuelto dentro de un componente. Todas las claves están en
[Temas](../theming.md).

## Márgenes de área segura

`Insets` es `{ top, right, bottom, left }` en dp. El valor por defecto es la altura de la barra de
estado de Android arriba y cero en los demás lados, lo que está mal en iPhones con notch: pasa los
márgenes reales (por ejemplo, desde `useSafeAreaInsets()`).

## Piezas

`Snackbar`, `Banner`, `Indicator` y `FullScreen` se exportan con `SnackbarProps`, `BannerProps`,
`IndicatorProps` y `FullScreenProps`. Reciben las mismas props que las piezas web: `phase`,
`message`, `strings`, y opcionalmente `state`, `actions`, `visible`, `rootProps` y `theme`, además
de extras nativos (`announce`, `reduceMotion`, `insets`, `icons`, `style`, `testID`; en el banner
`position`, `overlay`, `showRetry`, `offset`; en el indicador `variant`, `position`, `offsetTop`,
`offsetBottom`; en el snackbar `offsetBottom`; en la pantalla completa `onRestoreFocus`).

`actions` es `{ retry?, dismiss?, continueOffline? }`. Una pieza es descartable exactamente cuando
`actions.dismiss` está presente, y la pantalla completa muestra "Continuar sin conexión" exactamente
cuando `actions.continueOffline` lo está. Las antiguas props `onRetry`, `onDismiss`, `dismissible` y
`title` ya no existen: `message` es el título de la pantalla completa. Una pieza deslizada fuera
vuelve al reposo cuando `visible` pasa a ser true otra vez, así que reaparece en la siguiente
transición. `PieceIcons` tipa los glifos reemplazables. Un slot recibe el contrato
`PieceRenderProps`, con `theme` rellenado.

El hook de deslizar, las reglas de deslizamiento y de tiempo y el auxiliar de accesibilidad que
oculta el contenido de la app son internos y no se exportan; `<OfflineDetector>` oculta el contenido
de la app por ti mientras se muestra el estado de pantalla completa.

## Hooks y tipos

- `useReducedMotion(motion?)` es `true` cuando el movimiento debe reducirse; `'auto'` lee el ajuste
  del sistema.
- `useOfflineTheme(...)` devuelve el tema resuelto dentro de tus propios componentes.
- El paquete nativo reexporta la API de react, así que una app instala un solo paquete: los hooks
  `useNetworkStatus`, `useRecheckOnReturn`, `useOfflineDetector` y `useCheckingFeedback`, y los
  tipos `OfflineState`, `OfflineStrings`, `OfflineUiOptions`, `PieceRenderProps`,
  `DismissiblePiece`, `Locale`, `IndicatorPosition`, `RecheckOnReturnOptions` y
  `UseNetworkStatusResult`. Consulta la [referencia de react](./react.md). El paquete web reexporta
  la misma lista.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

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
- `ShadowStyle` (tipo)
- `Snackbar` (componente)
- `SnackbarProps` (tipo)
- `UseNetworkStatusResult` (tipo)
- `createNativeAdapter` (función)
- `createTheme` (función)
- `darkTheme` (constante)
- `lightTheme` (constante)
- `packageName` (constante)
- `useCheckingFeedback` (hook)
- `useNetworkStatus` (hook)
- `useOfflineDetector` (hook)
- `useOfflineTheme` (hook)
- `useRecheckOnReturn` (hook)
- `useReducedMotion` (hook)

<!--/EXPORTS-->
