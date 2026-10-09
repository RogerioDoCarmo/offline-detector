---
id: native-quick-start
title: Inicio rápido para nativo
sidebar_position: 4
---

# Inicio rápido para nativo

Pasa NetInfo desde tu app y los márgenes de área segura desde tu diseño. Funciona igual en Expo y en
React Native sin Expo.

```tsx
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-native';

function Root() {
  const insets = useSafeAreaInsets();
  return (
    <OfflineDetector netInfo={NetInfo} insets={insets}>
      <App />
    </OfflineDetector>
  );
}

export default function Main() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
```

Al abrir en línea no se muestra nada. Cuando la app se queda sin conexión, aparecen las tres piezas
con "Sin internet". Cuando regresa, "Conexión restablecida" se muestra durante `recoveryMs` (4
segundos) y nunca al arrancar. La [demo en vivo](https://rogeriodocarmo.github.io/offline-detector/demo/)
muestra la versión web del mismo comportamiento.

## NetInfo se pasa, no se exige

El paquete nunca importa `@react-native-community/netinfo` por su cuenta; así, Metro nunca lo trata
como una dependencia que no instalaste. Pasa el módulo en la prop `netInfo`, como arriba.

Sin él se supone que la interfaz de red está activa y solo la sonda de alcance decide, lo que tarda
más en notar que te quedaste sin conexión. Las builds de desarrollo registran un aviso. Para tener
control total, pasa tu propio `adapter` (consulta `createNativeAdapter` en la
[referencia nativa](./reference/native.md)).

## Márgenes de área segura

Pasa `insets` desde `useSafeAreaInsets()`. El valor por defecto es la altura de la barra de estado de
Android arriba y cero en los demás lados. Eso es incorrecto en iPhones con notch; por eso pasa los
márgenes allí.

## Volver a comprobar al regresar

Reintentar siempre muestra "Verificando…" al instante. Una nueva comprobación en segundo plano al
volver a la app solo la muestra cuando una pantalla lo activa:

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-native';

function Checkout() {
  useRecheckOnReturn({ checkingFeedback: 'brief' });
  return <Pay />;
}
```

El paquete nativo reexporta los hooks de la capa React, así que es el único paquete que hay que
instalar y desde el que importar. Consulta [Comprobar al volver](./recheck-on-return.md).

## No verificado en un dispositivo

El comportamiento está cubierto por pruebas de integración de Jest con el paquete React real. Los
flujos en dispositivo o emulador (Maestro) pertenecen a la app de demostración en Expo y no se
ejecutaron para esta versión de la documentación.
