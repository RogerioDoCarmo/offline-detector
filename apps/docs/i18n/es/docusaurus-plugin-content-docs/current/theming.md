---
id: theming
title: Temas
sidebar_position: 7
---

# Temas

La interfaz de los paquetes es neutra a propósito: debe parecer parte de tu app. Cambias su aspecto
mediante tokens de diseño, nunca editando los componentes.

## Web: los tokens `--od-*`

`<OfflineDetector>` renderiza un único elemento `<style>` en línea con las propiedades
personalizadas `--od-*` (claro, y oscuro mediante `prefers-color-scheme`). Sobrescribe cualquiera
en tu CSS:

```css
:root {
  --od-color-action: #6d28d9;
  --od-radius-md: 2px;
  --od-font-family: 'Inter', system-ui, sans-serif;
}
```

Las declaraciones `--od-*` del propio paquete van bajo selectores `:where()`, que no pesan nada; así,
una regla tuya `:root { ... }` como la de arriba gana dondequiera que esté en la cascada. Bajo una
Content Security Policy, pasa el mismo nonce que usan tus otros estilos en línea:
`<OfflineDetector nonce={nonce}>` (o `<OfflineTokens nonce={nonce} />`).

Fuerza un esquema con la prop `colorScheme` (`'auto'`, `'light'` o `'dark'`). Cualquier valor
distinto de `'auto'` envuelve el árbol en un elemento con `data-od-theme` y `display: contents`.
También puedes definir `data-od-theme="light"` o `"dark"` en `<html>`, en un elemento
`[data-od-root]` o en cualquier subárbol.

Algunos tokens son para el diseño, no para el aspecto: `--od-offset-top` y
`--od-offset-bottom` alejan las piezas de tus propias barras fijas, y `--od-banner-height` se publica
mientras se muestra el banner, para que otros elementos se coloquen respecto a él.

Nunca se descarga ninguna fuente. Personalizar la tipografía te corresponde a ti, mediante
`--od-font-family`.

### Todos los tokens

Los valores son los predeterminados. El signo igual significa que el valor oscuro es el mismo que el
claro.

#### Color

| Token                              | Claro                | Oscuro               |
| ---------------------------------- | -------------------- | -------------------- |
| `--od-color-surface`               | `#ffffff`            | `#1c1c1e`            |
| `--od-color-surface-raised`        | `#f4f5f7`            | `#2c2c2e`            |
| `--od-color-surface-inverse`       | `#1f2328`            | `#f2f3f5`            |
| `--od-color-text`                  | `#1b1f23`            | `#f2f3f5`            |
| `--od-color-text-muted`            | `#545b64`            | `#a8aeb7`            |
| `--od-color-text-inverse`          | `#ffffff`            | `#1b1f23`            |
| `--od-color-text-muted-inverse`    | `#c4c9d0`            | `#4a5058`            |
| `--od-color-border`                | `#80878f`            | `#8a9099`            |
| `--od-color-border-subtle`         | `#d9dce1`            | `#3a3a3c`            |
| `--od-color-status-offline`        | `#b3261e`            | `#ff8a80`            |
| `--od-color-status-offline-subtle` | `#fdecea`            | `#4a1f1c`            |
| `--od-color-status-online`         | `#1a7f37`            | `#4cc38a`            |
| `--od-color-status-checking`       | `#8a5a00`            | `#f0b429`            |
| `--od-color-action`                | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-on-action`             | `#ffffff`            | `#0b1b33`            |
| `--od-color-action-inverse`        | `#8ab4ff`            | `#0b5fd1`            |
| `--od-color-focus-ring`            | `#0b5fd1`            | `#8ab4ff`            |
| `--od-color-scrim`                 | `rgba(0, 0, 0, 0.4)` | `rgba(0, 0, 0, 0.6)` |

#### Espaciado

| Token            | Claro  | Oscuro |
| ---------------- | ------ | ------ |
| `--od-space-xs`  | `4px`  | =      |
| `--od-space-sm`  | `8px`  | =      |
| `--od-space-md`  | `12px` | =      |
| `--od-space-lg`  | `16px` | =      |
| `--od-space-xl`  | `24px` | =      |
| `--od-space-2xl` | `32px` | =      |

#### Radio

| Token              | Claro   | Oscuro |
| ------------------ | ------- | ------ |
| `--od-radius-sm`   | `4px`   | =      |
| `--od-radius-md`   | `8px`   | =      |
| `--od-radius-lg`   | `12px`  | =      |
| `--od-radius-full` | `999px` | =      |

#### Sombra

| Token                  | Claro                                                          | Oscuro |
| ---------------------- | -------------------------------------------------------------- | ------ |
| `--od-shadow-none`     | `none`                                                         | =      |
| `--od-shadow-chip`     | `0 1px 3px rgba(0, 0, 0, 0.2)`                                 | =      |
| `--od-shadow-snackbar` | `0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)` | =      |

#### Tipografía

| Token                       | Claro                                                                               | Oscuro |
| --------------------------- | ----------------------------------------------------------------------------------- | ------ |
| `--od-font-family`          | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | =      |
| `--od-font-size-label`      | `12px`                                                                              | =      |
| `--od-font-size-body`       | `14px`                                                                              | =      |
| `--od-font-size-title`      | `16px`                                                                              | =      |
| `--od-font-size-headline`   | `22px`                                                                              | =      |
| `--od-font-weight-regular`  | `400`                                                                               | =      |
| `--od-font-weight-medium`   | `500`                                                                               | =      |
| `--od-font-weight-semibold` | `600`                                                                               | =      |

#### Altura de línea

| Token                       | Claro  | Oscuro |
| --------------------------- | ------ | ------ |
| `--od-line-height-label`    | `16px` | =      |
| `--od-line-height-body`     | `20px` | =      |
| `--od-line-height-title`    | `24px` | =      |
| `--od-line-height-headline` | `28px` | =      |

#### Tamaño y borde

| Token                           | Claro   | Oscuro |
| ------------------------------- | ------- | ------ |
| `--od-size-touch-target`        | `44px`  | =      |
| `--od-size-indicator-dot`       | `14px`  | =      |
| `--od-size-icon`                | `20px`  | =      |
| `--od-size-snackbar-min-height` | `48px`  | =      |
| `--od-size-snackbar-max-width`  | `560px` | =      |
| `--od-size-fullscreen-measure`  | `36ch`  | =      |
| `--od-border-width`             | `1px`   | =      |
| `--od-focus-ring-width`         | `2px`   | =      |

#### Movimiento

| Token                 | Claro                           | Oscuro |
| --------------------- | ------------------------------- | ------ |
| `--od-duration-fast`  | `120ms`                         | =      |
| `--od-duration-base`  | `200ms`                         | =      |
| `--od-duration-slow`  | `320ms`                         | =      |
| `--od-duration-exit`  | `150ms`                         | =      |
| `--od-duration-pulse` | `1200ms`                        | =      |
| `--od-ease-out`       | `cubic-bezier(0.16, 1, 0.3, 1)` | =      |
| `--od-ease-in`        | `cubic-bezier(0.7, 0, 0.84, 0)` | =      |
| `--od-ease-standard`  | `cubic-bezier(0.4, 0, 0.2, 1)`  | =      |

#### Capas

| Token               | Claro  | Oscuro |
| ------------------- | ------ | ------ |
| `--od-z-banner`     | `1000` | =      |
| `--od-z-indicator`  | `1010` | =      |
| `--od-z-snackbar`   | `1020` | =      |
| `--od-z-fullscreen` | `1100` | =      |

#### Desplazamientos

| Token                | Claro | Oscuro |
| -------------------- | ----- | ------ |
| `--od-offset-top`    | `0px` | =      |
| `--od-offset-bottom` | `0px` | =      |

## Nativo: el objeto `OfflineTheme`

React Native no tiene variables CSS. Los mismos tokens existen como un objeto tipado, con los nombres
en camelCase y sin el prefijo (`--od-color-action` es `colorAction`). Pasa sobrescrituras con la prop
`theme`, crea un tema con `createTheme` o parte de `lightTheme` y `darkTheme`:

```tsx
import { OfflineDetector, createTheme } from '@rogeriodocarmo/offline-detector-native';

const theme = createTheme({ colorAction: '#6d28d9', radiusMd: 2 });

<OfflineDetector netInfo={NetInfo} theme={theme}>
  <App />
</OfflineDetector>;
```

`useOfflineTheme` devuelve el tema resuelto dentro de tus propios componentes. Todas las claves de
`OfflineTheme`:

| Clave                      | Tipo                  |
| -------------------------- | --------------------- |
| `colorSurface`             | `string`              |
| `colorSurfaceRaised`       | `string`              |
| `colorSurfaceInverse`      | `string`              |
| `colorText`                | `string`              |
| `colorTextMuted`           | `string`              |
| `colorTextInverse`         | `string`              |
| `colorTextMutedInverse`    | `string`              |
| `colorBorder`              | `string`              |
| `colorBorderSubtle`        | `string`              |
| `colorStatusOffline`       | `string`              |
| `colorStatusOfflineSubtle` | `string`              |
| `colorStatusOnline`        | `string`              |
| `colorStatusChecking`      | `string`              |
| `colorAction`              | `string`              |
| `colorOnAction`            | `string`              |
| `colorActionInverse`       | `string`              |
| `colorFocusRing`           | `string`              |
| `colorScrim`               | `string`              |
| `spaceXs`                  | `number`              |
| `spaceSm`                  | `number`              |
| `spaceMd`                  | `number`              |
| `spaceLg`                  | `number`              |
| `spaceXl`                  | `number`              |
| `space2xl`                 | `number`              |
| `radiusSm`                 | `number`              |
| `radiusMd`                 | `number`              |
| `radiusLg`                 | `number`              |
| `radiusFull`               | `number`              |
| `fontFamily`               | `string \| undefined` |
| `fontSizeLabel`            | `number`              |
| `fontSizeBody`             | `number`              |
| `fontSizeTitle`            | `number`              |
| `fontSizeHeadline`         | `number`              |
| `lineHeightLabel`          | `number`              |
| `lineHeightBody`           | `number`              |
| `lineHeightTitle`          | `number`              |
| `lineHeightHeadline`       | `number`              |
| `fontWeightRegular`        | `'400'`               |
| `fontWeightMedium`         | `'500'`               |
| `fontWeightSemibold`       | `'600'`               |
| `sizeTouchTarget`          | `number`              |
| `sizeIndicatorDot`         | `number`              |
| `sizeIcon`                 | `number`              |
| `sizeSnackbarMinHeight`    | `number`              |
| `sizeSnackbarMaxWidth`     | `number`              |
| `sizeFullscreenMeasure`    | `number`              |
| `focusRingWidth`           | `number`              |
| `durationFast`             | `number`              |
| `durationBase`             | `number`              |
| `durationSlow`             | `number`              |
| `durationExit`             | `number`              |
| `durationPulse`            | `number`              |
| `easeOut`                  | `Bezier`              |
| `easeIn`                   | `Bezier`              |
| `easeStandard`             | `Bezier`              |
| `zBanner`                  | `number`              |
| `zIndicator`               | `number`              |
| `zSnackbar`                | `number`              |
| `zFullscreen`              | `number`              |
| `shadowChip`               | `ShadowStyle`         |
| `shadowSnackbar`           | `ShadowStyle`         |

## Mantén el contraste

Si cambias los colores, mantén el texto en 4,5 a 1 y los componentes de interfaz en 3 a 1, en ambos
esquemas. Los colores de estado (sin conexión, en línea, verificando) marcan un glifo o un punto; no
los uses en frases. Consulta [Accesibilidad](./accessibility.md).
