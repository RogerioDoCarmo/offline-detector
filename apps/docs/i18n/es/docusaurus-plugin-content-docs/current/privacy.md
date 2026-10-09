---
id: privacy
title: Privacidad
sidebar_position: 12
---

# Privacidad

**El único tráfico de red que crea offline-detector es la sonda de alcance configurable.** No se
recopila, almacena ni envía nada más a ningún sitio. No hay analíticas, ni informes de fallos, ni
cuentas, y los paquetes no definen cookies ni escriben nada en el almacenamiento: incluso el descarte
se guarda solo en memoria.

## A quién contacta la sonda

Para distinguir "conectado" de "tiene internet", el detector solicita una URL diminuta que responde
con un `204 No Content` vacío. Por defecto prueba estas, en orden, y vale el primer éxito:

1. `https://cp.cloudflare.com/generate_204`
2. `https://www.gstatic.com/generate_204`

Son los endpoints de comprobación de conectividad que usan los sistemas operativos y los
navegadores. La petición no lleva cuerpo ni cabeceras personalizadas de esta biblioteca, ni ningún
identificador. Como cualquier petición web, revela la dirección IP del dispositivo y los metadatos
habituales de la petición al host que responde, que es el operador de esa URL, no los autores de este
proyecto.

| Opción             | Por defecto            | Significado                                                                     |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------- |
| `probe.urls`       | las dos URL anteriores | Se prueban en orden. No pueden estar vacías, salvo en el modo `interface-only`. |
| `probe.method`     | `'HEAD'`               | `'HEAD'` o `'GET'`.                                                             |
| `probe.timeoutMs`  | `5000`                 | Por URL. La petición se aborta al agotarse el tiempo.                           |
| `probe.intervalMs` | `30000`                | Cada cuánto vuelve a sondear mientras hay conexión.                             |
| `probe.mode`       | `'probe'`              | `'interface-only'` no hace ninguna petición.                                    |

Sin conexión, reintenta tras 1 segundo, duplicando hasta un tope de 30 segundos. Una sonda cuenta como
alcanzable cuando se completa cualquier respuesta HTTP, sea cual sea su estado: un `404` o `500`
sigue demostrando que un servidor respondió. Solo una petición que falla (sin conexión, fallo de TLS,
tiempo agotado o aborto) cuenta como inalcanzable. La respuesta nunca se lee.

La sonda no envía cookies (`credentials: 'omit'`, así que ni siquiera un endpoint del mismo origen
recibe alguna) ni la cabecera `Referer` (`referrerPolicy: 'no-referrer'`).

## Usa tu propio endpoint

Puedes apuntar la sonda a un servidor que controles, para que ningún tercero vea la petición.

```tsx
<OfflineDetector probe={{ urls: ['https://status.example.com/generate_204'] }}>
  <App />
</OfflineDetector>
```

Lo que debe hacer tu endpoint:

- Responder rápido a `HEAD` y `GET`, preferiblemente con `204 No Content` y cuerpo vacío. El estado
  no se inspecciona (cualquier respuesta demuestra que la red funciona), pero una respuesta pequeña y
  vacía mantiene la comprobación barata.
- Servirse por HTTPS (una página servida por HTTPS no puede llamar a una URL HTTP).
- No ser almacenado en caché por un service worker o una CDN: el fetch de sonda de la web ya envía
  `cache: 'no-store'`.
- Ser alcanzable desde donde están tus usuarios. Si sirves un origen distinto al de la página, una
  política de seguridad de contenido con `connect-src` debe permitirlo.

CORS: el fetch de sonda predeterminado de la web usa `mode: 'no-cors'`, así que tu endpoint no
necesita enviar `Access-Control-Allow-Origin`. Solo necesitas esa cabecera si proporcionas tu propio
`fetch` que no use `no-cors` y lea la respuesta.

Un endpoint mínimo, por ejemplo en Node:

```js
import { createServer } from 'node:http';

createServer((req, res) => {
  res.writeHead(204, { 'Cache-Control': 'no-store' });
  res.end();
}).listen(8080);
```

## Modo solo interfaz: ninguna petición

Si no quieres ninguna petición, usa solo la señal de la interfaz de la plataforma:

```tsx
<OfflineDetector probe={{ mode: 'interface-only' }}>
  <App />
</OfflineDetector>
```

En este modo `fetch` nunca se llama y no se programa ningún temporizador. El coste es la precisión:
una red conectada sin internet (un portal cautivo, un router sin salida) parece estar en línea; por
eso el motivo `no-internet` nunca ocurre.

## React Native: qué hace NetInfo

En React Native pasas un módulo NetInfo (`@react-native-community/netinfo`) al componente. No forma
parte de offline-detector, y offline-detector no controla ni ve lo que solicita. Según su
documentación, en plataformas sin alcance de internet nativo, o cuando `useNativeReachability` está
desactivado, NetInfo hace su propia petición periódica: por defecto una petición `HEAD` a
`https://clients3.google.com/generate_204`, cada 5 segundos cuando internet no era alcanzable y cada
60 segundos cuando sí lo era. Cámbialo o desactívalo con el `configure()` de NetInfo. Los sistemas
operativos móviles también hacen sus propias comprobaciones de conectividad, independientes de
cualquier app.

## Cómo está este sitio de documentación

Este sitio de documentación es estático. No define cookies, no carga analíticas y no obtiene fuentes
ni scripts de otros hosts. Puede guardar preferencias de interfaz, como el tema claro u oscuro que
elijas, en el almacenamiento local del navegador; se quedan en tu dispositivo y nunca se envían. La
demo en vivo tiene un control de simular sin conexión que acciona una sonda simulada; así se puede
probar sin ninguna petición de red.

La página de la política de privacidad del proyecto se publica junto a este sitio en
`/privacy-policy.html`, y el `PRIVACY.md` del repositorio contiene la misma política.
