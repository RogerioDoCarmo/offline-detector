---
id: ssr
title: Renderizado en el servidor y Next.js
sidebar_position: 10
---

# Renderizado en el servidor y Next.js

Importar los paquetes, crear el adapter y renderizar en el servidor nunca tocan `window`,
`document` ni `navigator`. El servidor renderiza los tokens y tus hijos, y ninguna pieza (a menos que
pases `initialStatus="offline"`). La primera comprobación de conectividad se ejecuta en un efecto tras
el montaje; así, la hidratación produce el mismo HTML que el servidor y nada parpadea.

## Next.js App Router

El componente usa estado y efectos, así que colócalo en un componente de cliente:

```tsx
'use client';

import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Offline({ children }: { children: React.ReactNode }) {
  return <OfflineDetector>{children}</OfflineDetector>;
}
```

Luego usa `<Offline>` en tu layout raíz. Lo mismo vale para cualquier hook del paquete React: solo se
ejecuta en componentes de cliente.

## `initialStatus`

Sin `initialStatus`, el primer renderizado en el servidor y en el cliente muestra el estado
`unknown`, que `isOnline` trata como en línea. Pasa `initialStatus="offline"` cuando sepas más, por
ejemplo por una cookie o una cabecera de la petición:

```tsx
<OfflineDetector initialStatus="offline">{children}</OfflineDetector>
```

Así, el HTML del servidor y el primer renderizado en el cliente coinciden, y la pista se mantiene
hasta que termina la primera comprobación real. Es solo una pista para el primer pintado: si la
primera comprobación real encuentra la app en línea, las piezas simplemente desaparecen, **sin** el
mensaje "Conexión restablecida".

## Exportación estática

Un sitio exportado de forma estática (`output: 'export'` de Next.js, Docusaurus, islas de Astro)
funciona igual: nada se ejecuta hasta que la página está en un navegador. La
[demo en vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) es una exportación estática.

## Política de seguridad de contenido

`<OfflineDetector>` renderiza un elemento `<style>` en línea con los tokens `--od-*` y los estilos
de las piezas, y no acepta una prop `nonce`. Un `style-src` estricto, sin `unsafe-inline`, lo
bloquea por tanto. Los bloques de construcción se exportan por si necesitas armar el tuyo:
`OfflineTokens` (acepta un `nonce`), `offlineTokensCss` y `offlineCss` (el CSS como cadenas).
Consulta la [referencia web](./reference/web.md). Este camino no se ha probado con una política real.
