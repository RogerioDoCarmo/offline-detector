---
id: dismissal
title: Dispensar
sidebar_position: 6
---

# Dispensar e a opção `dismissible`

O snackbar, o banner e o indicador podem ser dispensados por quem usa o app. O estado de tela cheia
nunca é dispensado assim: ele tem a sua própria ação "Continuar offline".

Dispensar vem **ativado por padrão**. Uma única opção o desliga:

```tsx
<OfflineDetector dismissible={false}>
  <App />
</OfflineDetector>
```

Um valor por peça tem prioridade sobre o global:

```tsx
<OfflineDetector dismissible={false} banner={{ dismissible: true }}>
  <App />
</OfflineDetector>
```

## Como uma peça é dispensada

| Peça      | Gesto                               | Sem gesto                                               |
| --------- | ----------------------------------- | ------------------------------------------------------- |
| Snackbar  | Deslizar para a esquerda ou direita | O botão Fechar (44 por 44) ou Escape com o foco nele    |
| Banner    | Deslizar para a esquerda ou direita | O botão de ícone Fechar no fim da linha, ou Escape      |
| Indicador | Deslizar para a esquerda ou direita | Escape ou Delete com foco; uma ação `dismiss` no nativo |

Deslizar é um gesto com trajetória; por isso toda peça dispensável tem uma alternativa que exige só
um toque ou uma tecla.

As regras do deslize:

- Um arrasto horizontal em qualquer direção. A peça acompanha o dedo ou o ponteiro.
- Soltar em **30 por cento** da largura ou além, ou a **0,5 px/ms** ou mais, dispensa. Menos que isso
  faz a peça voltar.
- Depois de 8 px de movimento, o arrasto trava no eixo dominante; assim, a rolagem vertical continua
  funcionando.
- Com movimento reduzido, a peça some em fade em vez de deslizar.

## O que "dispensada" significa

- Só a peça é escondida. O estado da conexão não muda, `useNetworkStatus()` e os callbacks não são
  afetados, e as outras peças continuam aparecendo.
- Uma peça dispensada fica escondida até a **próxima transição de status** (offline, depois online,
  depois offline de novo mostra as peças outra vez). O snackbar de recuperação ainda aparece na
  recuperação.
- A dispensa fica apenas na memória. Recarregar a página a reinicia. Nada é armazenado.
- Dispensar o banner reorganiza o conteúdo que está abaixo dele.
- Dispensar pelo usuário não é anunciado aos leitores de tela: foi o usuário quem fez.
- Na web, ao dispensar uma peça que tinha o foco do teclado, o foco volta ao elemento que o tinha
  antes de a peça aparecer (ao corpo da página, se esse elemento sumiu).
- Uma peça que você monta por conta própria é dispensável exatamente quando você passa
  `actions.dismiss`, tanto na web quanto no nativo.

## Reagir a uma dispensa

```tsx
<OfflineDetector onDismiss={(piece) => analytics.track('dismissed', { piece })}>
  <App />
</OfflineDetector>
```

`piece` é `'snackbar'`, `'banner'` ou `'indicator'`.

## Nos seus próprios componentes

`resolveDismissible` e `useDismissals` são exportados pelo pacote React
(`@rogeriodocarmo/offline-detector-react`, do qual os pacotes web e nativo dependem, mas que eles não
reexportam para estes dois):

```ts
resolveDismissible('banner', { dismissible: false, banner: { dismissible: true } }); // true

const { isDismissed, dismiss } = useDismissals({ onDismiss: (piece) => log(piece) });
dismiss('snackbar'); // não faz nada quando essa peça não é dispensável
```

`resolveDismissible(piece, options)` é pura: um valor por peça vence o global e o padrão é `true`.
Veja a [referência do react](./reference/react.md).
