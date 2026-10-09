---
id: accessibility
title: Accesibilidad
sidebar_position: 8
---

# Accesibilidad

El objetivo es WCAG 2.2 AA en todos los estados de todas las piezas, en modo claro y oscuro, en web
y en nativo. El color nunca es la única señal: cada estado se comunica con palabras más una forma, y
el color es una tercera señal, de apoyo.

## Anuncios: una vez, y con cortesía

El fallo que hay que evitar es la voz duplicada: un banner y un snackbar que aparecen a la vez y un
lector de pantalla que lee "Sin internet" dos veces. Por eso **cada transición se anuncia una sola
vez**. La primera pieza visible, en este orden, es dueña del anuncio y las demás quedan en silencio:
snackbar, banner, indicador. Si ninguno está activado, no se anuncia nada. No existe un anunciador
oculto de reserva. Un slot personalizado asume el anuncio de su pieza, así que debe esparcir
`rootProps` (y, en iOS, llamar a `AccessibilityInfo.announceForAccessibility` por su cuenta);
consulta [Slots](./slots.md).

| Pieza             | Web                                              | Nativo                                                           |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Snackbar y banner | `role="status"` (una región viva cortés)         | `accessibilityLiveRegion="polite"` en Android; un anuncio en iOS |
| Indicador         | `role="img"` con nombre accesible, nunca en vivo | `accessibilityRole="image"` con una etiqueta                     |
| Pantalla completa | El foco pasa al título; sin región viva          | El foco de accesibilidad pasa al título                          |

- Los mensajes son **corteses** (polite), nunca `role="alert"`: quedarse sin conexión es información,
  no una emergencia, y no debe interrumpir una frase que se está leyendo ni un formulario que se está
  escribiendo.
- El texto anunciado es el mismo mensaje traducido que muestra la pieza ("Sin internet", "Conexión
  restablecida").
- La recuperación se anuncia una vez. Que el snackbar desaparezca a los cuatro segundos no se anuncia.
- "Verificando…" no se anuncia como mensaje propio. El control Reintentar lo refleja con `aria-busy`,
  y su nombre cambia.
- Los callbacks se disparan solo en transiciones, y por tanto los anuncios también. Una nueva
  comprobación que encuentra el estado sin cambios no anuncia nada.

## Movimiento reducido

El movimiento es corto, solo vertical y pasa a un desvanecimiento con movimiento reducido. La prop
`motion` es `'auto'` (sigue `prefers-reduced-motion` o el ajuste del sistema), `'reduced'` o
`'full'`. Con movimiento reducido, una pieza deslizada se desvanece en lugar de deslizarse, y el
indicador de verificación se mantiene.

## Alternativas al deslizamiento

Deslizar es un gesto con trayectoria (WCAG 2.5.1), así que una pieza descartable siempre tiene otro
camino:

- Snackbar y banner: un botón Cerrar visible de al menos 44 por 44, en el orden de tabulación, y
  Escape con el foco dentro de la pieza.
- Indicador: recibe foco cuando es descartable; Escape o Delete lo descartan y, en nativo, expone una
  acción de accesibilidad `dismiss` descrita por el texto `dismissHint`.

Desactiva el deslizamiento con `dismissible={false}`. Consulta [Descartar](./dismissal.md).

## El estado de pantalla completa

La pantalla completa es opcional y reemplaza la vista de la app; por eso, deliberadamente, **no** es
un `dialog`.

- El foco pasa al título, y el contenido de la app que queda debajo se vuelve inerte (`inert` más
  `aria-hidden` como alternativa en web; oculto para la tecnología de asistencia en nativo).
- Escape activa "Continuar sin conexión" cuando esa acción existe. Sin `continueOffline` no hay
  salida, así que úsalo salvo que la app realmente no pueda funcionar sin conexión.
- Al salir, el foco vuelve al elemento que lo tenía antes, si todavía existe.
- En nativo, esparce `hostContentAccessibilityProps(visible)` en tu vista raíz si renderizas tú mismo
  la pieza de pantalla completa.

## Contraste, objetivos, tamaño del texto y dirección

- Todo el texto alcanza 4,5 a 1 y los componentes de interfaz alcanzan 3 a 1, en ambos esquemas de
  color. Los colores de estado marcan un glifo o un punto; nunca colorean una frase.
- Todo elemento interactivo mide al menos 44 por 44.
- Los diseños se ajustan al texto grande y a los textos más largos en portugués y español, y usan
  propiedades lógicas de inicio y fin, así que los anfitriones de derecha a izquierda funcionan.

## Nombres

`aria-label` y `aria-labelledby` solo se colocan en elementos con un rol que admita nombre: el banner
es `role="region"` o `role="status"`, el indicador es `role="img"` o contiene texto visible. Si
escribes un [slot](./slots.md), haz lo mismo.

## Lo que no se ha verificado aquí

Las comprobaciones automáticas y las pruebas unitarias cubren la estructura. La salida hablada hay
que confirmarla con VoiceOver, TalkBack, NVDA y JAWS. El contrato que importa es "leído exactamente
una vez, con cortesía, en aproximadamente un segundo".
