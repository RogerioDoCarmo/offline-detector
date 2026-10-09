---
id: react
title: Referencia de react
sidebar_label: react
sidebar_position: 2
---

# `@rogeriodocarmo/offline-detector-react`

La capa React sobre el [motor core](./core.md): un provider, hooks, estado de descarte, textos
incluidos y los tipos compartidos en los que se apoyan los paquetes web y nativo. No tiene DOM ni
importaciones de React Native; así, una sola copia sirve para ambos. Un **adapter de plataforma**, de
los paquetes web o nativo, aporta las señales de la plataforma. Requiere React 18 o superior.

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

El provider crea **un** detector por montaje, lo inicia en un efecto y lo detiene al desmontarse. El
montaje extra del StrictMode de React no inicia una segunda comprobación ni filtra temporizadores u
oyentes. Nada se ejecuta durante el renderizado; por eso renderizar en el servidor e hidratar es
seguro.

| Prop            | Notas                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `adapter`       | Obligatorio. Un `PlatformAdapter`. Se lee una vez por montaje.                                              |
| `probe`         | `ProbeOptions` del core (`urls`, `timeoutMs`, `intervalMs`, `method`, `mode`). Se lee una vez.              |
| `fetch`         | El transporte de la sonda. Se lee una vez. En web, usa `createWebProbeFetch()`.                             |
| `onOffline`     | `(state) => void`. Se dispara cuando el estado pasa a `offline`, incluido un primer resultado sin conexión. |
| `onOnline`      | `(state) => void`. Se dispara cuando el estado pasa de `offline` de nuevo a `online`.                       |
| `onChange`      | `(state, previous) => void`. Se dispara en cada cambio de estado, incluido el primer resultado.             |
| `onError`       | `(error) => void`. Recibe excepciones lanzadas por callbacks y por `onResult`.                              |
| `initialStatus` | `'online'` u `'offline'`. Pista para SSR: lo que supone el primer renderizado.                              |
| `detector`      | Punto de prueba: usa este detector en lugar de crear uno. Los callbacks no se conectan a él.                |

Los callbacks se disparan solo en transiciones de estado reales, se leen mediante una ref (pasar una
función nueva en cada renderizado nunca reinicia el detector) y `onOnline` no se dispara cuando el
primer resultado es en línea.

## Hooks

| Hook                       | Devuelve                                                 |
| -------------------------- | -------------------------------------------------------- |
| `useNetworkStatus()`       | `OfflineState` más `isOnline: boolean` y `checkNow()`    |
| `useOfflineDetector()`     | El `OfflineDetectorInstance` del core, para uso avanzado |
| `useRecheckOnReturn(opts)` | `boolean`, el último estado en línea conocido            |
| `useCheckingFeedback()`    | `'brief'` o `'none'`, para paquetes de interfaz          |
| `useDismissals(options)`   | `{ isDismissed(piece), dismiss(piece) }`                 |

Todo hook lanza un error claro cuando se usa fuera de `<OfflineDetectorProvider>`.

```ts
type UseNetworkStatusResult = OfflineState & {
  isOnline: boolean; // true mientras el estado es 'unknown'
  checkNow(): Promise<OfflineState>; // las llamadas simultáneas comparten una sonda
};
```

`useRecheckOnReturn` recibe `{ checkingFeedback?: 'brief' | 'none'; onResult?: (isOnline) => void }`.
Consulta [Comprobar al volver](../recheck-on-return.md).

## Utilidades de descarte

```ts
interface DismissOptions {
  dismissible?: boolean; // global, por defecto true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: 'snackbar' | 'banner' | 'indicator'): void;
}
```

`resolveDismissible(piece, options)` es pura: un valor por pieza prevalece sobre el global y el valor
por defecto es `true`. `useDismissals(options)` mantiene los descartes en memoria hasta la siguiente
transición de estado. Consulta [Descartar](../dismissal.md).

## Textos e idiomas

| Función                                              | Qué hace                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `STRINGS`                                            | Las tablas incluidas de `en`, `pt-BR` y `es`.                                        |
| `resolveLocale(input?)`                              | `'en'`, `'pt-BR'` o `'es'`. Nunca lanza un error.                                    |
| `resolveStrings(locale?, overrides?)`                | La tabla del idioma con un `Partial<OfflineStrings>` combinado encima.               |
| `offlineMessage(state, strings, distinguishReason?)` | El texto de desconexión; consciente del motivo cuando el tercer argumento es `true`. |
| `indicatorName(strings, label)`                      | El nombre accesible del indicador, con `{status}` rellenado.                         |

Consulta [Idiomas y textos](../i18n.md).

## Tipos

`OfflineUiOptions` (descarte, idioma, textos, indicador, banner, snackbar, movimiento, esquema de
color), `PieceRenderProps<Theme = unknown>` (el contrato de render props, consulta
[Slots](../slots.md)), `OfflineStrings`, `Locale`, `PieceName`, `DismissiblePiece`,
`IndicatorPosition`, `DismissOptions`, `RecheckOnReturnOptions`, `UseNetworkStatusResult` y
`OfflineDetectorProviderProps` se exportan solo como tipos.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

<!--EXPORTS-->

- `DismissiblePiece` (tipo)
- `DismissOptions` (tipo)
- `indicatorName` (función)
- `IndicatorPosition` (tipo)
- `Locale` (tipo)
- `OfflineDetectorProvider` (componente)
- `OfflineDetectorProviderProps` (tipo)
- `offlineMessage` (función)
- `OfflineStrings` (tipo)
- `OfflineUiOptions` (tipo)
- `packageName` (constante)
- `PieceName` (tipo)
- `PieceRenderProps` (tipo)
- `RecheckOnReturnOptions` (tipo)
- `resolveDismissible` (función)
- `resolveLocale` (función)
- `resolveStrings` (función)
- `STRINGS` (constante)
- `useCheckingFeedback` (hook)
- `useDismissals` (hook)
- `useNetworkStatus` (hook)
- `UseNetworkStatusResult` (tipo)
- `useOfflineDetector` (hook)
- `useRecheckOnReturn` (hook)

<!--/EXPORTS-->
