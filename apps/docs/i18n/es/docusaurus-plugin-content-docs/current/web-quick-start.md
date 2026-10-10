---
id: web-quick-start
title: Inicio rápido para web
sidebar_position: 3
---

# Inicio rápido para web

Renderiza `<OfflineDetector>` una vez, cerca de la raíz. No necesita provider ni adapter.

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Root() {
  return (
    <OfflineDetector>
      <App />
    </OfflineDetector>
  );
}
```

Esa es toda la configuración. La app arranca en línea y no muestra nada. Cuando la conexión se cae,
aparecen un snackbar ("Sin internet", con Reintentar), un banner y un indicador. Cuando regresa, un
snackbar "Conexión restablecida" se muestra durante cuatro segundos.

Pruébalo en la [demo en vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) o abre las
DevTools del navegador, pestaña Network, y elige Offline.

## Lee el estado en cualquier lugar

Los hooks funcionan en cualquier punto dentro de `<OfflineDetector>`, y el paquete web los exporta:

```tsx
import { useNetworkStatus } from '@rogeriodocarmo/offline-detector-web';

function SaveButton() {
  const { isOnline, reason, checkNow } = useNetworkStatus();
  return (
    <button disabled={!isOnline} onClick={() => void checkNow()}>
      {isOnline ? 'Guardar' : `Sin conexión (${reason})`}
    </button>
  );
}
```

El paquete web reexporta los hooks de la capa React, así que es el único paquete que hay que
instalar y desde el que importar. Consulta la [referencia de react](./reference/react.md) para ver
todos los hooks.

## Opciones comunes

```tsx
<OfflineDetector
  locale="es"
  distinguishReason
  fullScreen={{ continueOffline: true }}
  probe={{ urls: ['https://example.com/health'], intervalMs: 60000 }}
  onOffline={(state) => console.log('offline', state.reason)}
>
  <App />
</OfflineDetector>
```

| Opción              | Qué hace                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `locale`            | `en`, `pt-BR` o `es`. Variantes como `pt` y `es-MX` se resuelven.                                 |
| `distinguishReason` | Dice el motivo: "Sin conexión de red" o "Conectado, pero sin internet".                           |
| `fullScreen`        | Un estado de pantalla completa opcional, con Intentar de nuevo y, si quieres, una salida.         |
| `probe`             | URL de la sonda, tiempo de espera, intervalo, método y modo. Consulta [Privacidad](./privacy.md). |
| `onContinueOffline` | Se llama cuando el usuario pulsa "Continuar sin conexión" (o Escape) en la pantalla completa.     |
| `nonce`             | Nonce de CSP del elemento `<style>` en línea. Consulta [Renderizado en el servidor](./ssr.md).    |
| `dismissible`       | Apaga el deslizar y el Cerrar en todas las piezas. Consulta [Descartar](./dismissal.md).          |

La lista completa está en la [referencia web](./reference/web.md). En Next.js, lee las notas sobre
[renderizado en el servidor](./ssr.md): el componente debe vivir en un componente de cliente.
