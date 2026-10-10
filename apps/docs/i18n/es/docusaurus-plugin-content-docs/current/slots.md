---
id: slots
title: Slots y render props
sidebar_position: 7
---

# Slots y render props

Un **slot** reemplaza una pieza (snackbar, banner, indicador o pantalla completa) por tu propio
componente. Todo lo demás sigue funcionando: detección, estado de descarte, anuncios y tokens.

```tsx
<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>
```

Las claves de `slots` son `snackbar`, `banner`, `indicator` y `fullScreen`.

## Qué recibe un slot

Un slot recibe el contrato `PieceRenderProps`. Los paquetes web y nativo exportan el tipo:

| Prop        | Qué es                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| `state`     | El `OfflineState` actual.                                                                  |
| `phase`     | `'offline'`, `'checking'` o `'recovered'`.                                                 |
| `message`   | El mensaje ya traducido y consciente del motivo.                                           |
| `strings`   | Los `OfflineStrings` resueltos para el idioma, con tus sobrescrituras.                     |
| `actions`   | `retry`; `dismiss` cuando se permite descartar; `continueOffline` en la pantalla completa. |
| `visible`   | Falso mientras se reproduce la animación de salida.                                        |
| `theme`     | El `OfflineTheme` en nativo, `undefined` en web.                                           |
| `rootProps` | Props de rol, región viva y dirección para esparcir en tu elemento raíz.                   |

## Ejemplo para web

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-web';

function Toast({ message, phase, actions, rootProps }: PieceRenderProps) {
  return (
    <div {...rootProps} className="my-toast">
      {message}
      {phase !== 'recovered' && (
        <button onClick={actions.retry}>Intentar de nuevo</button>
      )}
      {actions.dismiss && <button onClick={actions.dismiss}>Cerrar</button>}
    </div>
  );
}

<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>;
```

Los tokens `--od-*` se siguen renderizando, así que `var(--od-color-surface-inverse)` y compañía
funcionan en tu CSS. Consulta [Temas](./theming.md).

## Ejemplo para nativo

```tsx
import type {
  OfflineTheme,
  PieceRenderProps,
} from '@rogeriodocarmo/offline-detector-native';

function MyToast({ message, actions, rootProps }: PieceRenderProps<OfflineTheme>) {
  return (
    <Pressable {...rootProps} onPress={actions.retry}>
      <Text>{message}</Text>
    </Pressable>
  );
}

<OfflineDetector netInfo={NetInfo} slots={{ snackbar: MyToast }}>
  <App />
</OfflineDetector>;
```

## Mantenlo accesible

- Esparce `rootProps` en tu raíz. Lleva el rol y la configuración de región viva que hacen que la
  transición se anuncie exactamente una vez. No hay alternativa: un slot que omite `rootProps` no lo
  cubre nada más, así que un lector de pantalla no lee nada para él. iOS no tiene ninguna región
  viva; por eso un slot nativo debe además llamar a `AccessibilityInfo.announceForAccessibility(message)`
  por su cuenta cuando aparece o cambia su mensaje.
- Pon `aria-label` solo en un elemento con un rol que admita nombre (`role="status"`,
  `role="region"`, `role="img"`), nunca en un `div` o `span` sin rol.
- Mantén los objetivos de al menos 44 por 44 y ofrece una forma de descartar que no sea deslizar.
- Respeta el movimiento reducido. Consulta [Accesibilidad](./accessibility.md).

## Reutilizar las piezas incluidas

`Snackbar`, `Banner`, `Indicator` y `FullScreen` se exportan desde los paquetes web y nativo. Un slot
puede reenviar sus props a una de ellas para cambiar solo un poco (por ejemplo, los iconos).
Consulta las referencias [web](./reference/web.md) y [nativa](./reference/native.md).
