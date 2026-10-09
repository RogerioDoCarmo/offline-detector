---
id: accessibility
title: Acessibilidade
sidebar_position: 8
---

# Acessibilidade

A meta é WCAG 2.2 AA em todos os estados de todas as peças, nos modos claro e escuro, na web e no
nativo. A cor nunca é o único sinal: cada estado é transmitido por palavras mais uma forma, e a cor
é um terceiro sinal, de apoio.

## Anúncios: uma vez, e com educação

A falha a evitar é a fala duplicada: um banner e um snackbar aparecendo juntos e um leitor de tela
lendo "Sem internet" duas vezes. Por isso **cada transição é anunciada uma única vez**. A primeira
peça visível, nesta ordem, é dona do anúncio e as outras ficam em silêncio: snackbar, banner,
indicador e, por fim, um anunciador visualmente oculto quando nenhuma peça visível está ativada.

| Peça              | Web                                            | Nativo                                                           |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Snackbar e banner | `role="status"` (uma região viva educada)      | `accessibilityLiveRegion="polite"` no Android; um anúncio no iOS |
| Indicador         | `role="img"` com nome acessível, nunca ao vivo | `accessibilityRole="image"` com um rótulo                        |
| Tela cheia        | O foco vai para o título; sem região viva      | O foco de acessibilidade vai para o título                       |

- As mensagens são **educadas** (polite), nunca `role="alert"`: ficar offline é informação, não uma
  emergência, e não deve interromper uma frase sendo lida nem um formulário sendo preenchido.
- O texto anunciado é a mesma mensagem traduzida que a peça mostra ("Sem internet", "Conexão
  restabelecida").
- A recuperação é anunciada uma vez. O desaparecimento do snackbar após quatro segundos não é
  anunciado.
- "Verificando…" não é anunciado como mensagem própria. O controle Tentar novamente o reflete com
  `aria-busy`, e o seu nome muda.
- Os callbacks disparam só em transições; os anúncios também. Uma nova verificação que encontra o
  estado inalterado não anuncia nada.

## Movimento reduzido

O movimento é curto, apenas vertical e vira um fade com movimento reduzido. A prop `motion` é
`'auto'` (segue `prefers-reduced-motion` ou a configuração do sistema), `'reduced'` ou `'full'`. Com
movimento reduzido, uma peça deslizada some em fade em vez de deslizar, e o indicador de verificação
continua.

## Alternativas ao deslizar

Deslizar é um gesto com trajetória (WCAG 2.5.1); por isso uma peça dispensável sempre tem outro
caminho:

- Snackbar e banner: um botão Fechar visível de pelo menos 44 por 44, na ordem de tabulação, e Escape
  com o foco dentro da peça.
- Indicador: recebe foco quando é dispensável; Escape ou Delete o dispensa e, no nativo, ele expõe
  uma ação de acessibilidade `dismiss` descrita pelo texto `dismissHint`.

Desligue o deslizar com `dismissible={false}`. Veja [Dispensar](./dismissal.md).

## O estado de tela cheia

A tela cheia é opcional e substitui a visão do app; por isso, deliberadamente, **não** é um `dialog`.

- O foco vai para o título, e o conteúdo do app que fica por baixo se torna inerte (`inert` mais
  `aria-hidden` como alternativa na web; oculto para a tecnologia assistiva no nativo).
- Escape aciona "Continuar offline" quando essa ação existe. Sem `continueOffline` não há saída;
  portanto use-o, a menos que o app realmente não funcione offline.
- Ao sair, o foco volta ao elemento que o tinha antes, se ele ainda existir.
- No nativo, espalhe `hostContentAccessibilityProps(visible)` na sua view raiz se você renderizar a
  peça de tela cheia por conta própria.

## Contraste, alvos, tamanho do texto e direção

- Todo texto atinge 4,5 para 1 e os componentes de interface atingem 3 para 1, nos dois esquemas de
  cor. As cores de status marcam um glifo ou ponto; nunca colorem uma frase.
- Todo elemento interativo tem pelo menos 44 por 44.
- Os layouts quebram linha para texto grande e para os textos mais longos em português e espanhol, e
  usam propriedades lógicas de início e fim; portanto hospedeiros da direita para a esquerda
  funcionam.

## Nomes

`aria-label` e `aria-labelledby` só são colocados em elementos com papel que aceite nome: o banner é
`role="region"` ou `role="status"`, o indicador é `role="img"` ou contém texto visível. Se você
escrever um [slot](./slots.md), faça o mesmo.

## O que não foi verificado aqui

Verificações automáticas e testes unitários cobrem a estrutura. A fala real precisa ser confirmada
com VoiceOver, TalkBack, NVDA e JAWS. O contrato que importa é "falado exatamente uma vez, com
educação, em cerca de um segundo".
