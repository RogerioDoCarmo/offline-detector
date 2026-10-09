---
id: intro
title: Introducción
slug: /
sidebar_position: 1
---

# offline-detector

offline-detector avisa a una app React o React Native, y a la persona que la usa, cuando **no hay
internet**. Muestra un snackbar discreto con la acción Reintentar, un banner y un indicador de
estado, además de un estado de pantalla completa opcional. Se ve como parte de la app que lo aloja,
se puede re-tematizar con tokens, es accesible por defecto y habla inglés, portugués de Brasil y
español.

[Prueba la demo en vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) para ver todas las
opciones, o ve directo al [inicio rápido para web](./web-quick-start.md) o al
[inicio rápido para nativo](./native-quick-start.md).

## ¿Por qué no leer simplemente `navigator.onLine`?

Porque "conectado" no es "tiene internet". `navigator.onLine` y la señal de red del sistema
operativo solo dicen que una **interfaz** de red está activa. Una red Wi-Fi detrás de un portal
cautivo, un router sin salida y una señal móvil sin datos informan "en línea" mientras cada petición
falla. Una app que confía en esa señal sigue mostrando indicadores de carga en lugar de decirle al
usuario qué está mal.

offline-detector combina la señal rápida de la plataforma (la interfaz) con una pequeña **sonda de
alcance** que confirma que hay internet de verdad, e informa por qué cree que estás sin conexión.

## Los tres estados de "sin internet"

| Estado                       | `status`  | `reason`       | Lo que ve el usuario por defecto |
| ---------------------------- | --------- | -------------- | -------------------------------- |
| Sin conexión de red          | `offline` | `no-interface` | "Sin internet"                   |
| Conectado, pero sin internet | `offline` | `no-internet`  | "Sin internet"                   |
| Conexión restablecida        | `online`  | `null`         | "Conexión restablecida" por 4 s  |

El detector también tiene el estado `unknown` antes de que termine la primera comprobación.
`isOnline` lo trata como en línea; así se supone que la app está en línea hasta que se demuestre lo
contrario y nada parpadea al abrir.

Por defecto, los dos motivos de desconexión dicen "Sin internet". Activa `distinguishReason` para
decir "Sin conexión de red" o "Conectado, pero sin internet".

## Qué incluye

| Paquete                                   | Qué es                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `@rogeriodocarmo/offline-detector-core`   | La máquina de estados y la sonda, sin framework y sin dependencias.        |
| `@rogeriodocarmo/offline-detector-react`  | Provider, hooks, estado de descarte y los textos incluidos.                |
| `@rogeriodocarmo/offline-detector-web`    | La interfaz web: snackbar, banner, indicador, pantalla completa, `--od-*`. |
| `@rogeriodocarmo/offline-detector-native` | La interfaz React Native. Sin código nativo, sin Reanimated.               |

La mayoría de las apps instala un paquete de interfaz (web o nativo) y nunca toca los demás
directamente.

## Cómo se comporta

- La app arranca en línea y no muestra nada. Las piezas solo aparecen cuando se pierde la conexión.
- Cada transición se anuncia una sola vez a los lectores de pantalla, con cortesía, y nunca con
  `role="alert"`.
- Toda pieza se puede descartar deslizando (a izquierda o derecha) y también con un botón o el
  teclado. Una pieza descartada vuelve en el siguiente cambio de estado. Consulta
  [Descartar](./dismissal.md).
- Volver a comprobar cuando el usuario regresa a la app es opcional, por pantalla. Consulta
  [Comprobar al volver](./recheck-on-return.md).
- El único tráfico de red es la sonda de alcance configurable. Consulta
  [Privacidad](./privacy.md).

## Adónde ir después

1. [Instala](./install.md) los paquetes de tu plataforma.
2. Sigue el inicio rápido para [web](./web-quick-start.md) o [nativo](./native-quick-start.md).
3. Busca cualquier prop o hook en la [referencia](./reference/web.md).
4. Lee las [preguntas frecuentes](./faq.md) si algo te sorprende.
