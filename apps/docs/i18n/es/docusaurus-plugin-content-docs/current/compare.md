---
id: compare
title: Comparación con las alternativas
sidebar_position: 1.5
---

# Comparación con las alternativas

Hay algunas formas comunes de saber si una app está en línea. Cada una es la respuesta correcta
para alguna app. Esta página dice qué informa cada una, para que elijas.

## Qué informa cada opción

| Opción                           | Qué informa                                                             | Qué te deja a ti                                                 |
| -------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `navigator.onLine` y sus eventos | Una interfaz de red está activa                                         | Saber si alguna petición funciona, y toda la interfaz            |
| NetInfo solo (React Native)      | El tipo de interfaz e `isInternetReachable`, de una comprobación propia | La interfaz, y una versión web                                   |
| Tu propio hook con sonda `fetch` | Lo que construyas                                                       | Reintentos, comprobaciones solapadas, hidratación, accesibilidad |
| offline-detector                 | Internet de verdad, con el motivo, en la web y en React Native          | Nada que construir en el caso común; slots para el resto         |

La comprobación de NetInfo envía una petición, un `HEAD` a `https://clients3.google.com/generate_204`
por defecto, y la repite cada 5 segundos mientras internet no era accesible y cada 60 segundos
mientras lo era. Todo es configurable con `NetInfo.configure`.

## Cuándo basta algo más simple

- Solo necesitas saber que la interfaz de red cambió: usa `navigator.onLine` o NetInfo
  directamente. offline-detector también tiene el modo `interface-only`, que no hace peticiones,
  consulta [Privacidad](./privacy.md).
- Ya tienes un diseño para el estado sin conexión y solo necesitas el estado: usa el hook sin
  interfaz `useNetworkStatus` del paquete React y renderiza tu propia pieza.

## Qué añade offline-detector

- **Una máquina de estados para web y nativo.** El núcleo, sin framework, ejecuta la misma lógica
  en ambos, así que las dos apps se comportan igual.
- **Una sonda difícil de engañar.** Comprueba dos hosts por defecto y solo informa sin conexión
  cuando fallan todas las URL. Una comprobación que falla se reintenta tras 1 segundo, con retroceso
  hasta un tope de 30 segundos, y un evento de interfaz caída se impone a una comprobación aún en
  curso.
- **Sin falsas alarmas al abrir.** El estado es `unknown` hasta que termina la primera
  comprobación, `unknown` cuenta como en línea, y "Conexión restablecida" solo aparece tras una pérdida
  real.
- **Interfaz lista y accesible.** Un snackbar con "Reintentar", un banner, un indicador y un estado
  de pantalla completa opcional, en inglés, portugués de Brasil y español, con temas por tokens o
  reemplazada por tus propios componentes mediante [slots](./slots.md).

En React Native se apoya en NetInfo: le pasas NetInfo, y la biblioteca añade la sonda y la
interfaz. Consulta el [inicio rápido nativo](./native-quick-start.md).
