---
id: slots
title: Slots e render props
sidebar_position: 7
---

# Slots e render props

Um **slot** substitui uma peça (snackbar, banner, indicador ou tela cheia) pelo seu próprio
componente. Todo o resto continua funcionando: detecção, estado de dispensa, anúncios e tokens.

```tsx
<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>
```

As chaves de `slots` são `snackbar`, `banner`, `indicator` e `fullScreen`.

## O que um slot recebe

Um slot recebe o contrato `PieceRenderProps` do pacote React:

| Prop        | O que é                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `state`     | O `OfflineState` atual.                                                           |
| `phase`     | `'offline'`, `'checking'` ou `'recovered'`.                                       |
| `message`   | A mensagem já traduzida e ciente do motivo.                                       |
| `strings`   | Os `OfflineStrings` resolvidos para o idioma, com as suas sobrescritas.           |
| `actions`   | `retry`; `dismiss` quando dispensar é permitido; `continueOffline` na tela cheia. |
| `visible`   | Falso enquanto a animação de saída roda.                                          |
| `theme`     | O `OfflineTheme` no nativo, `undefined` na web.                                   |
| `rootProps` | Props de papel, região viva e direção para espalhar no seu elemento raiz.         |

## Exemplo para web

```tsx
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

function Toast({ message, phase, actions, rootProps }: PieceRenderProps) {
  return (
    <div {...rootProps} className="my-toast">
      {message}
      {phase !== 'recovered' && <button onClick={actions.retry}>Tentar novamente</button>}
      {actions.dismiss && <button onClick={actions.dismiss}>Fechar</button>}
    </div>
  );
}

<OfflineDetector slots={{ snackbar: Toast }}>
  <App />
</OfflineDetector>;
```

Os tokens `--od-*` continuam sendo renderizados; portanto `var(--od-color-surface-inverse)` e
companhia funcionam no seu CSS. Veja [Temas](./theming.md).

## Exemplo para nativo

```tsx
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import type { OfflineTheme } from '@rogeriodocarmo/offline-detector-native';

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

## Mantenha acessível

- Espalhe `rootProps` na sua raiz. Ele carrega o papel e a configuração de região viva que fazem a
  transição ser anunciada exatamente uma vez. Não há alternativa: um slot que omite `rootProps` não
  é coberto por mais nada, então um leitor de tela não fala nada para ele. O iOS não tem região viva
  alguma; portanto, um slot nativo também precisa chamar
  `AccessibilityInfo.announceForAccessibility(message)` por conta própria quando aparece ou quando a
  mensagem muda.
- Coloque `aria-label` apenas em um elemento com papel que aceite nome (`role="status"`,
  `role="region"`, `role="img"`), nunca em um `div` ou `span` sem papel.
- Mantenha os alvos com pelo menos 44 por 44 e ofereça uma forma de dispensar que não seja deslizar.
- Respeite o movimento reduzido. Veja [Acessibilidade](./accessibility.md).

## Reaproveitar as peças incluídas

`Snackbar`, `Banner`, `Indicator` e `FullScreen` são exportados pelos pacotes web e nativo. Um slot
pode repassar as suas props a uma delas para mudar só um pouco (por exemplo, os ícones). Veja as
referências [web](./reference/web.md) e [nativa](./reference/native.md).
