---
id: dismissal
title: Descartar
sidebar_position: 6
---

# Descartar y la opción `dismissible`

El snackbar, el banner y el indicador pueden ser descartados por quien usa la app. El estado de
pantalla completa nunca se descarta así: tiene su propia acción "Continuar sin conexión".

Descartar viene **activado por defecto**. Una sola opción lo desactiva:

```tsx
<OfflineDetector dismissible={false}>
  <App />
</OfflineDetector>
```

Un valor por pieza prevalece sobre el global:

```tsx
<OfflineDetector dismissible={false} banner={{ dismissible: true }}>
  <App />
</OfflineDetector>
```

## Cómo se descarta una pieza

| Pieza     | Gesto                          | Sin gesto                                                |
| --------- | ------------------------------ | -------------------------------------------------------- |
| Snackbar  | Deslizar a izquierda o derecha | El botón Cerrar (44 por 44) o Escape con el foco en él   |
| Banner    | Deslizar a izquierda o derecha | El botón de icono Cerrar al final de la línea, o Escape  |
| Indicador | Deslizar a izquierda o derecha | Escape o Delete con foco; una acción `dismiss` en nativo |

Deslizar es un gesto con trayectoria, así que toda pieza descartable tiene una alternativa que exige
solo una pulsación o una tecla.

Las reglas del deslizamiento:

- Un arrastre horizontal en cualquier dirección. La pieza sigue al dedo o al puntero.
- Soltar en el **30 por ciento** del ancho o más allá, o a **0,5 px/ms** o más, la descarta. Menos que
  eso la hace volver.
- Tras 8 px de movimiento el arrastre se fija al eje dominante; así el desplazamiento vertical sigue
  funcionando.
- Con movimiento reducido la pieza se desvanece en lugar de deslizarse.

## Qué significa "descartada"

- Solo se oculta la pieza. El estado de la conexión no cambia, `useNetworkStatus()` y los callbacks
  no se ven afectados, y las demás piezas siguen mostrándose.
- Una pieza descartada permanece oculta hasta la **siguiente transición de estado** (sin conexión,
  luego en línea, luego sin conexión otra vez vuelve a mostrar las piezas). El snackbar de
  recuperación sigue apareciendo al recuperarse.
- El descarte se guarda solo en memoria. Recargar lo reinicia. No se almacena nada.
- Descartar el banner reorganiza el contenido que está debajo.
- Lo que el usuario descarta no se anuncia a los lectores de pantalla: lo provocó él.

## Reaccionar a un descarte

```tsx
<OfflineDetector onDismiss={(piece) => analytics.track('dismissed', { piece })}>
  <App />
</OfflineDetector>
```

`piece` es `'snackbar'`, `'banner'` o `'indicator'`.

## En tus propios componentes

`resolveDismissible` y `useDismissals` se exportan desde el paquete React:

```ts
resolveDismissible('banner', { dismissible: false, banner: { dismissible: true } }); // true

const { isDismissed, dismiss } = useDismissals({ onDismiss: (piece) => log(piece) });
dismiss('snackbar'); // no hace nada cuando esa pieza no es descartable
```

`resolveDismissible(piece, options)` es pura: un valor por pieza prevalece sobre el global y el valor
por defecto es `true`. Consulta la [referencia de react](./reference/react.md).
