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

`Insets` es `{ top, right, bottom, left }` en dp. `defaultInsets()` devuelve la altura de la barra de
estado de Android arriba y cero en los demás lados. Pasa los márgenes reales (por ejemplo, desde
`useSafeAreaInsets()`), sobre todo en iPhones con notch.

## Piezas

`Snackbar`, `Banner`, `Indicator` y `FullScreen` se exportan con `SnackbarProps`, `BannerProps`,
`IndicatorProps` y `FullScreenProps`. `FullScreen` recibe `phase`, `title`, `strings`, `onRetry` y,
opcionalmente, `onContinueOffline`, `onRestoreFocus`, `visible`, `theme`, `reduceMotion`, `insets`,
`icons`, `style` y `testID`. `PieceIcons` tipa los glifos reemplazables. Un slot recibe el contrato
`PieceRenderProps`, con `theme` rellenado.

`hostContentAccessibilityProps(fullScreenVisible)` devuelve las props que ocultan el contenido de tu
app a la tecnología de asistencia mientras el estado de pantalla completa está visible
(`no-hide-descendants` en Android, `accessibilityElementsHidden` en iOS). Esparce esas props en tu
vista raíz cuando armes las piezas por tu cuenta.

## Hooks

- `useReducedMotion(motion?)` es `true` cuando el movimiento debe reducirse; `'auto'` lee el ajuste
  del sistema.
- `useSwipeDismiss({ enabled, onDismiss, reducedMotion, theme? })` devuelve `panHandlers`,
  `onLayout` y un `style` animado. Usa `PanResponder` y la API `Animated` integrada de React Native.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

<!--EXPORTS-->

- `AppStateLike` (tipo)
- `Banner` (componente)
- `BannerProps` (tipo)
- `Bezier` (tipo)
- `createNativeAdapter` (función)
- `createTheme` (constante)
- `darkTheme` (constante)
- `defaultInsets` (función)
- `FullScreen` (componente)
- `FullScreenProps` (tipo)
- `hostContentAccessibilityProps` (función)
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
