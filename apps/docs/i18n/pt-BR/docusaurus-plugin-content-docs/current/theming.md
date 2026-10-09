---
id: theming
title: Temas
sidebar_position: 7
---

# Temas

A interface dos pacotes é neutra de propósito: deve parecer parte do seu app. Você muda o visual por
meio de tokens de design, nunca editando os componentes.

## Web: os tokens `--od-*`

`<OfflineDetector>` renderiza um único elemento `<style>` em linha com as propriedades
personalizadas `--od-*` (claro, e escuro por meio de `prefers-color-scheme`). Sobrescreva qualquer
uma no seu CSS:

```css
:root {
  --od-color-action: #6d28d9;
  --od-radius-md: 2px;
  --od-font-family: 'Inter', system-ui, sans-serif;
}
```

Force um esquema com a prop `colorScheme` (`'auto'`, `'light'` ou `'dark'`). Qualquer valor diferente de
`'auto'` envolve a árvore em um elemento com `data-od-theme` e `display: contents`. Você também pode
definir `data-od-theme="light"` ou `"dark"` em `<html>`, em um elemento `[data-od-root]` ou em qualquer
subárvore.

Alguns tokens servem ao layout, não ao visual: `--od-offset-top` e
`--od-offset-bottom` afastam as peças das suas próprias barras fixas, e `--od-banner-height` é
publicada enquanto o banner aparece, para que outros elementos se posicionem em relação a ele.

Nenhuma fonte é baixada. Personalizar a tipografia é tarefa sua, por meio de `--od-font-family`.

### Todos os tokens

Os valores são os padrões. O sinal de igual significa que o valor escuro é igual ao claro.

#### Cor

| Token                              | Claro                | Escuro               |
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

#### Espaçamento

| Token            | Claro  | Escuro |
| ---------------- | ------ | ------ |
| `--od-space-xs`  | `4px`  | =      |
| `--od-space-sm`  | `8px`  | =      |
| `--od-space-md`  | `12px` | =      |
| `--od-space-lg`  | `16px` | =      |
| `--od-space-xl`  | `24px` | =      |
| `--od-space-2xl` | `32px` | =      |

#### Raio

| Token              | Claro   | Escuro |
| ------------------ | ------- | ------ |
| `--od-radius-sm`   | `4px`   | =      |
| `--od-radius-md`   | `8px`   | =      |
| `--od-radius-lg`   | `12px`  | =      |
| `--od-radius-full` | `999px` | =      |

#### Sombra

| Token                  | Claro                                                          | Escuro |
| ---------------------- | -------------------------------------------------------------- | ------ |
| `--od-shadow-none`     | `none`                                                         | =      |
| `--od-shadow-chip`     | `0 1px 3px rgba(0, 0, 0, 0.2)`                                 | =      |
| `--od-shadow-snackbar` | `0 2px 8px rgba(0, 0, 0, 0.24), 0 1px 2px rgba(0, 0, 0, 0.16)` | =      |

#### Tipografia

| Token                       | Claro                                                                               | Escuro |
| --------------------------- | ----------------------------------------------------------------------------------- | ------ |
| `--od-font-family`          | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | =      |
| `--od-font-size-label`      | `12px`                                                                              | =      |
| `--od-font-size-body`       | `14px`                                                                              | =      |
| `--od-font-size-title`      | `16px`                                                                              | =      |
| `--od-font-size-headline`   | `22px`                                                                              | =      |
| `--od-font-weight-regular`  | `400`                                                                               | =      |
| `--od-font-weight-medium`   | `500`                                                                               | =      |
| `--od-font-weight-semibold` | `600`                                                                               | =      |

#### Altura de linha

| Token                       | Claro  | Escuro |
| --------------------------- | ------ | ------ |
| `--od-line-height-label`    | `16px` | =      |
| `--od-line-height-body`     | `20px` | =      |
| `--od-line-height-title`    | `24px` | =      |
| `--od-line-height-headline` | `28px` | =      |

#### Tamanho e borda

| Token                           | Claro   | Escuro |
| ------------------------------- | ------- | ------ |
| `--od-size-touch-target`        | `44px`  | =      |
| `--od-size-indicator-dot`       | `14px`  | =      |
| `--od-size-icon`                | `20px`  | =      |
| `--od-size-snackbar-min-height` | `48px`  | =      |
| `--od-size-snackbar-max-width`  | `560px` | =      |
| `--od-size-fullscreen-measure`  | `36ch`  | =      |
| `--od-border-width`             | `1px`   | =      |
| `--od-focus-ring-width`         | `2px`   | =      |

#### Movimento

| Token                 | Claro                           | Escuro |
| --------------------- | ------------------------------- | ------ |
| `--od-duration-fast`  | `120ms`                         | =      |
| `--od-duration-base`  | `200ms`                         | =      |
| `--od-duration-slow`  | `320ms`                         | =      |
| `--od-duration-exit`  | `150ms`                         | =      |
| `--od-duration-pulse` | `1200ms`                        | =      |
| `--od-ease-out`       | `cubic-bezier(0.16, 1, 0.3, 1)` | =      |
| `--od-ease-in`        | `cubic-bezier(0.7, 0, 0.84, 0)` | =      |
| `--od-ease-standard`  | `cubic-bezier(0.4, 0, 0.2, 1)`  | =      |

#### Camadas

| Token               | Claro  | Escuro |
| ------------------- | ------ | ------ |
| `--od-z-banner`     | `1000` | =      |
| `--od-z-indicator`  | `1010` | =      |
| `--od-z-snackbar`   | `1020` | =      |
| `--od-z-fullscreen` | `1100` | =      |

#### Deslocamentos

| Token                | Claro | Escuro |
| -------------------- | ----- | ------ |
| `--od-offset-top`    | `0px` | =      |
| `--od-offset-bottom` | `0px` | =      |

## Nativo: o objeto `OfflineTheme`

O React Native não tem variáveis CSS. Os mesmos tokens existem como um objeto tipado, com os nomes em
camelCase e sem o prefixo (`--od-color-action` vira `colorAction`). Passe sobrescritas com a prop
`theme`, monte um tema com `createTheme` ou parta de `lightTheme` e `darkTheme`:

```tsx
import { OfflineDetector, createTheme } from '@rogeriodocarmo/offline-detector-native';

const theme = createTheme({ colorAction: '#6d28d9', radiusMd: 2 });

<OfflineDetector netInfo={NetInfo} theme={theme}>
  <App />
</OfflineDetector>;
```

`useOfflineTheme` devolve o tema resolvido dentro dos seus próprios componentes. Todas as chaves de
`OfflineTheme`:

| Chave                      | Tipo                  |
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

## Mantenha o contraste

Se você mudar as cores, mantenha o texto em 4,5 para 1 e os componentes de interface em 3 para 1, nos
dois esquemas. As cores de status (offline, online, verificando) marcam um glifo ou um ponto; não as
use em frases. Veja [Acessibilidade](./accessibility.md).
