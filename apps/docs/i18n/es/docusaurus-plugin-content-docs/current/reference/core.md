---
id: core
title: Referencia del core
sidebar_label: core
sidebar_position: 1
---

# `@rogeriodocarmo/offline-detector-core`

El motor de detección sin framework: una pequeña máquina de estados que dice si la app tiene
**internet de verdad**. No tiene dependencias en tiempo de ejecución y nunca toca el DOM, `window`,
`navigator` ni React Native. Las plataformas se conectan mediante un `PlatformAdapter`; los paquetes
React, web y nativo se construyen sobre él.

"Sin conexión" significa sin internet de verdad. Wi-Fi, Ethernet o datos móviles conectados pero sin
tráfico de datos cuentan como sin conexión.

## Cómo funciona la detección

- La **señal de la interfaz**, que viene del adapter, es la rápida. Interfaz caída significa
  `offline` con el motivo `no-interface`, sin necesidad de sonda.
- Con la interfaz activa, una **sonda** confirma el alcance real. Las URL se prueban en orden y vale
  el primer éxito (`online`). Si todas fallan o agotan el tiempo, el estado es `offline` con el
  motivo `no-internet`.
- Mientras está **en línea**, la sonda se repite cada `intervalMs` (por defecto 30000 ms).
- Mientras está **sin conexión**, reintenta tras 1000 ms, duplicando hasta un tope de 30000 ms.
  Volver a estar en línea reinicia la espera.
- El modo `interface-only` nunca llama a `fetch`.

## Uso

```ts
import { createOfflineDetector, isOnline } from '@rogeriodocarmo/offline-detector-core';

const detector = createOfflineDetector({
  adapter, // un PlatformAdapter, véase abajo
  probe: { urls: ['https://cp.cloudflare.com/generate_204'], timeoutMs: 5000 },
  onOffline: (state) => console.log('offline', state.reason),
  onOnline: (state) => console.log('de vuelta en línea', state.lastOnlineAt),
  onChange: (state, previous) => console.log(previous.status, '->', state.status),
});

const unsubscribe = detector.subscribe((state) => render(isOnline(state)));
detector.start();
// después
detector.stop();
unsubscribe();
```

## `createOfflineDetector(options)`

| Opción                                       | Por defecto          | Notas                                                                                            |
| -------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| `adapter`                                    | obligatorio          | Un `PlatformAdapter`.                                                                            |
| `probe.urls`                                 | `DEFAULT_PROBE_URLS` | Un `readonly string[]`, se prueban en orden. No vacía, salvo que `mode` sea `interface-only`.    |
| `probe.timeoutMs`                            | `5000`               | Por URL. La petición se aborta al agotarse el tiempo.                                            |
| `probe.intervalMs`                           | `30000`              | Período de la nueva sonda mientras hay conexión.                                                 |
| `probe.method`                               | `'HEAD'`             | `'HEAD'` o `'GET'`.                                                                              |
| `probe.mode`                                 | `'probe'`            | `'interface-only'` nunca llama a `fetch` y no programa temporizadores.                           |
| `onOffline(state)`                           | ninguno              | Véanse los callbacks abajo.                                                                      |
| `onOnline(state)`                            | ninguno              | Véanse los callbacks abajo.                                                                      |
| `onChange(state, previous)`                  | ninguno              | Véanse los callbacks abajo.                                                                      |
| `onError(error)`                             | ninguno              | Recibe las excepciones lanzadas por oyentes y callbacks. Si también lanza, el error se descarta. |
| `fetch`, `now`, `setTimeout`, `clearTimeout` | los globales         | Inyectables para pruebas. En web, envuelve `fetch` para añadir `mode: 'no-cors'`.                |

`DEFAULT_PROBE_URLS` es `['https://cp.cloudflare.com/generate_204',
'https://www.gstatic.com/generate_204']`. Crear un detector en modo sonda sin `fetch` disponible, o
con una lista `urls` vacía, lanza un error.

Una sonda tiene éxito cuando `fetch` se resuelve con **cualquier cosa**: el valor resuelto se
ignora, así que cualquier respuesta HTTP completada (un 404, un 500, una respuesta opaca de
`no-cors`) significa que la red es alcanzable. Solo un rechazo (error de red, fallo de TLS, abort) o
un tiempo agotado cuenta como fallo. La petición se hace como
`fetch(url, { method, signal, credentials: 'omit' })`, así que no envía cookies. `ProbeFetch` es
`(url, init) => Promise<unknown>`.

## `OfflineDetectorInstance`

Lo que devuelve `createOfflineDetector`.

| Miembro                             | Comportamiento                                                                                                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getState(): OfflineState`          | El estado actual. Un objeto nuevo en cada cambio.                                                                                                                                                                                                                        |
| `subscribe(listener)`               | `listener(state, previous)` se ejecuta en cada cambio. Devuelve una función para cancelar.                                                                                                                                                                               |
| `start()`                           | Se suscribe al adapter, hace una comprobación ahora y programa las demás. Idempotente.                                                                                                                                                                                   |
| `stop()`                            | Limpia el temporizador, cancela la suscripción, aborta la petición en curso y limpia su temporizador, y descarta su resultado. Se puede repetir.                                                                                                                         |
| `checkNow(): Promise<OfflineState>` | Fuerza una comprobación. Las llamadas simultáneas comparten una sonda. Si un evento de interfaz activa adelanta la comprobación, la promesa se resuelve con el resultado de la comprobación que la adelantó, nunca con un estado aún `checking`. Funciona sin `start()`. |

## `OfflineState`

```ts
type OfflineState = {
  status: 'online' | 'offline' | 'unknown'; // unknown solo hasta que termina la primera comprobación
  reason: 'no-interface' | 'no-internet' | null; // no nulo exactamente cuando está sin conexión
  checking: boolean;
  lastChecked: number | null; // now() cuando terminó la última comprobación
  lastOnlineAt: number | null; // now() cuando se vio en línea por última vez
};
```

`isOnline(state)` es `true` mientras el estado es `unknown`: se supone que una app está en línea hasta
que se demuestre lo contrario.

## Callbacks

Se disparan solo en **transiciones de estado** reales, nunca en cada sonda:

- `onChange(state, previous)` se dispara en cada cambio de estado, incluido el primer resultado.
- `onOffline(state)` se dispara cuando el estado pasa a `offline`, incluido un primer resultado sin
  conexión.
- `onOnline(state)` se dispara cuando el estado pasa de `offline` de nuevo a `online`. **No** se
  dispara cuando el primer resultado es `online`: no se perdió nada.
- Un cambio solo de motivo (`no-interface` a `no-internet`) no es una transición de estado. Los
  suscriptores se enteran; los callbacks no.

Las excepciones lanzadas por un oyente o callback se capturan y se pasan a `onError` (un `onError`
que lance también se descarta); así, un
consumidor defectuoso no puede romper la detección.

## `PlatformAdapter`

```ts
interface PlatformAdapter {
  isInterfaceUp(): boolean | Promise<boolean>;
  subscribeInterface(listener: (up: boolean) => void): () => void;
  subscribeForeground(listener: () => void): () => void;
}
```

- Un evento de interfaz caída se aplica al instante y se impone a cualquier sonda en curso. Un evento
  de interfaz activa dispara una comprobación inmediata.
- Un regreso al primer plano dispara `checkNow()` solo cuando se pasa `recheckOnForeground: true`
  (por defecto `false`). La capa React lo conecta por pantalla con `useRecheckOnReturn`.
- Si `isInterfaceUp()` lanza un error o se rechaza, se trata como "activa" y decide la sonda.

## Índice de exportaciones {#export-index}

Todo lo que exporta el paquete, valores y tipos.

<!--EXPORTS-->

- `ClearTimeoutFn` (tipo)
- `DEFAULT_PROBE_URLS` (constante)
- `OfflineDetectorInstance` (tipo)
- `OfflineDetectorOptions` (tipo)
- `OfflineReason` (tipo)
- `OfflineState` (tipo)
- `OfflineStatus` (tipo)
- `PlatformAdapter` (tipo)
- `ProbeFetch` (tipo)
- `ProbeOptions` (tipo)
- `SetTimeoutFn` (tipo)
- `StateListener` (tipo)
- `TimerHandle` (tipo)
- `createOfflineDetector` (función)
- `isOnline` (función)
- `packageName` (constante)

<!--/EXPORTS-->
