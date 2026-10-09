---
id: recheck-on-return
title: Comprobar al volver
sidebar_position: 5
---

# Comprobar al volver

Cuando alguien regresa a tu app después de un rato (la pestaña vuelve a ser visible, la ventana
recupera el foco o el `AppState` de React Native pasa a activo), la última sonda puede ser antigua.
`useRecheckOnReturn` vuelve a sondear al instante en lugar de esperar a la siguiente comprobación
programada.

Es **opcional, por pantalla**. Por defecto el detector ni siquiera se suscribe a la señal de primer
plano; así, una pantalla a la que no le importa no paga nada.

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-react';

function Checkout() {
  const online = useRecheckOnReturn({
    checkingFeedback: 'brief',
    onResult: (isOnline) => console.log('de vuelta en la app, en línea:', isOnline),
  });
  return <Pay disabled={!online} />;
}
```

## Opciones

| Opción             | Por defecto | Notas                                                                    |
| ------------------ | ----------- | ------------------------------------------------------------------------ |
| `checkingFeedback` | `'none'`    | `'brief'` o `'none'`. Si la comprobación al volver es visible.           |
| `onResult`         | ninguno     | `(isOnline: boolean) => void`, se llama tras cada comprobación al volver |

El hook devuelve el último booleano conocido: `false` solo cuando la app está sin conexión. Se
actualiza con cada cambio de estado, no únicamente tras un regreso.

## `'brief'` frente a `'none'`

| Origen de la comprobación                           | `'none'`                        | `'brief'`                                                    |
| --------------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Nueva sonda al volver a la app                      | nada visible                    | las piezas muestran un breve estado "Verificando…"           |
| El usuario pulsa Reintentar                         | el botón muestra "Verificando…" | igual (un Reintentar pulsado siempre lo muestra)             |
| Sonda programada con espera creciente, sin conexión | nada visible                    | nada visible (solo comprobaciones disparadas al volver)      |
| En línea, sin problema                              | nada visible                    | nada visible: una comprobación breve exitosa no muestra nada |

Reglas de `'brief'`:

- El estado "Verificando…" solo aparece si la comprobación sigue pendiente tras **150 ms** y, una vez
  mostrado, permanece al menos **400 ms**. Así se evita un destello en una red rápida y un
  parpadeo en una lenta.
- Nunca mueve el diseño: un indicador de carga reemplaza la etiqueta dentro de la misma caja.

## Detalles que conviene saber

- El hook se suscribe al adapter solo mientras el componente está montado y cancela la suscripción
  al desmontarse. `onResult` no se llama después de desmontar.
- Varios hooks montados comparten **una** sonda, porque el core elimina las comprobaciones
  simultáneas duplicadas.
- La opción `recheckOnForeground` del propio core sigue desactivada. Este hook es el único lugar que
  vuelve a comprobar al regresar.
- `useCheckingFeedback()` es para paquetes de interfaz: informa `'brief'` mientras está pendiente una
  comprobación al volver iniciada por un hook `'brief'`, y `'none'` en el resto del tiempo.

Consulta la [referencia de react](./reference/react.md) para ver los tipos exactos.
