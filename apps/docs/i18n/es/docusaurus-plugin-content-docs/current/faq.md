---
id: faq
title: Preguntas frecuentes
sidebar_position: 11
---

# Preguntas frecuentes

## ¿Muestra algo cuando la app arranca en línea?

No. El estado es `unknown` hasta que termina la primera comprobación, y `isOnline` trata `unknown`
como en línea. "Conexión restablecida" solo se muestra tras una pérdida real: nunca al arrancar.

## ¿Por qué dice sin conexión si mi Wi-Fi está conectado?

Porque "conectado" no es "tiene internet". Si la interfaz está activa pero la sonda falla en todas las
URL, el estado es `offline` con el motivo `no-internet`. Un portal cautivo, un router sin salida o un
cortafuegos que bloquea los hosts de la sonda se ven así. Una sonda solo falla cuando falla la propia petición (sin conexión, un error de TLS, un tiempo
agotado); cualquier respuesta HTTP, incluso un 404 o un 500, cuenta como alcanzable. Usa tu propia
URL de sonda si las
predeterminadas están bloqueadas. Consulta [Privacidad](./privacy.md).

## ¿Cuánto tarda en notarlo?

Cuando la interfaz se cae, es inmediato: no hace falta ninguna sonda. Cuando la interfaz sigue activa
pero se pierde internet, decide la siguiente sonda: cada 30 segundos por defecto mientras hay
conexión. Sin conexión, reintenta tras 1 segundo, duplicando hasta un tope de 30 segundos, y volver
a estar en línea lo reinicia.

## ¿Puedo ejecutarlo sin ninguna petición de red?

Sí. Usa `probe={{ mode: 'interface-only' }}`. Nunca llama a `fetch`, no programa temporizadores y
depende solo de la señal de la interfaz de la plataforma. Consulta [Privacidad](./privacy.md).

## ¿Puedo hacer que se vea como mi app?

Sí. Sobrescribe los tokens `--od-*` en CSS en web, o pasa un `theme` en nativo. Consulta
[Temas](./theming.md). Para reemplazar una pieza por completo, usa [slots](./slots.md).

## ¿Puedo desactivar el deslizamiento?

Sí: `dismissible={false}` para todas las piezas, o las opciones `snackbar`, `banner` e `indicator`
para una sola. Toda pieza también tiene una alternativa con botón o tecla. Consulta
[Descartar](./dismissal.md).

## ¿El banner empuja mi contenido hacia abajo?

Por defecto, sí: el banner está en el flujo. Usa `banner={{ overlay: true }}` para flotar sobre el
contenido. En web, `--od-banner-height` informa su altura mientras se muestra.

## ¿Funciona con Next.js, Expo o React Native Web?

Next.js: sí, desde un componente de cliente ([notas](./ssr.md)). Expo y React Native sin Expo: sí,
pasando NetInfo ([inicio rápido para nativo](./native-quick-start.md)). El paquete web renderiza
elementos del DOM y no depende de `react-native-web`; el paquete nativo apunta solo a React Native.

## ¿Por qué tengo que pasar NetInfo yo mismo?

Para que Metro nunca trate `@react-native-community/netinfo` como una dependencia obligatoria que no
instalaste. Sin él, solo decide la sonda.

## ¿Funciona en un web worker, en Node o en pruebas?

El core no tiene importaciones de DOM ni de React Native y acepta `fetch`, `now` y temporizadores
inyectables, que es como se ejecutan sus propias pruebas. Los paquetes de interfaz necesitan un
renderizador de React.

## ¿Los textos en portugués y español fueron revisados por hablantes nativos?

Los textos incluidos siguen las notas de diseño para el portugués de Brasil y el español
internacional neutro. Las traducciones de la documentación aún necesitan la revisión de hablantes
nativos. Las correcciones son bienvenidas.

## ¿Dónde está el código fuente?

En [GitHub](https://github.com/RogerioDoCarmo/offline-detector). Los paquetes tienen licencia MIT.
