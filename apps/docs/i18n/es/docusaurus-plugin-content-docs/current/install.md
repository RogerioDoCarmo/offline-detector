---
id: install
title: Instalación
sidebar_position: 2
---

# Instalación

Elige el paquete de interfaz de tu plataforma e instala solo ese. Trae consigo la capa React y el
motor core, y reexporta los hooks y tipos que necesitas, así que lo importas todo desde él.

## Web

```bash
pnpm add @rogeriodocarmo/offline-detector-web
# o: npm install @rogeriodocarmo/offline-detector-web
# o: yarn add @rogeriodocarmo/offline-detector-web
```

Requiere React y react-dom 18 o superior (dependencias peer). El paquete depende de
`@rogeriodocarmo/offline-detector-react` y de `@rogeriodocarmo/offline-detector-core`, que pnpm, npm
y yarn instalan por ti.

## React Native y Expo

```bash
npm install @rogeriodocarmo/offline-detector-native
# opcional, para detección instantánea cuando la interfaz se cae:
npm install @react-native-community/netinfo
# opcional, para los márgenes de área segura:
npm install react-native-safe-area-context
```

En Expo, usa `npx expo install @react-native-community/netinfo react-native-safe-area-context` para
que Expo elija las versiones que corresponden a tu SDK. En React Native sin Expo, instala los mismos
paquetes y ejecuta `pod install` en iOS.

El paquete nativo depende de la capa React y del core, así que no hay nada más que añadir. Requiere
React 18 o superior y React Native 0.73 o superior. No hay código nativo propio, ni
Reanimated, ni dependencia de gesture-handler; por eso nada exige un development build más allá de
lo que ya exige el propio NetInfo.

## Solo el motor

Si quieres tu propia interfaz, instala la capa React o solo el core:

```bash
pnpm add @rogeriodocarmo/offline-detector-core
pnpm add @rogeriodocarmo/offline-detector-react
```

El core nunca toca `window`, `navigator` ni React Native. Consulta la
[referencia del core](./reference/core.md) y la [referencia de react](./reference/react.md).

## Comprueba que funciona

Renderiza el componente una vez cerca de la raíz (consulta los inicios rápidos) y apaga tu red o usa
la pestaña Network de las DevTools del navegador en Offline. Las piezas aparecen en menos de un
segundo. La [demo en vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) tiene un control
de **simular sin conexión** que funciona sin tocar la red.
