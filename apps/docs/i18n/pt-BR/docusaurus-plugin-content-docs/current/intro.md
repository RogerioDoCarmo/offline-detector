---
id: intro
title: Introdução
slug: /
sidebar_position: 1
---

# offline-detector

O offline-detector avisa um app React ou React Native, e a pessoa que o usa, quando **não há
internet**. Ele mostra um snackbar discreto com a ação Tentar novamente, um banner e um indicador de
status, além de um estado de tela cheia opcional. Parece parte do app que o hospeda, pode ser
re-tematizado por tokens, é acessível por padrão e fala inglês, português do Brasil e espanhol.

[Experimente a demonstração ao vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) para
ver todas as opções, ou vá direto ao [início rápido para web](./web-quick-start.md) ou ao
[início rápido para nativo](./native-quick-start.md).

## Por que não ler apenas `navigator.onLine`?

Porque "conectado" não é "tem internet". `navigator.onLine` e a sinalização de rede do sistema
operacional só dizem que uma **interface** de rede está ativa. Uma rede Wi-Fi atrás de um portal
cativo, um roteador sem link de saída e um sinal móvel sem dados informam "online" enquanto toda
requisição falha. Um app que confia nessa sinalização continua mostrando indicadores de carregamento
em vez de dizer ao usuário o que está errado.

O offline-detector combina o sinal rápido da plataforma (a interface) com uma pequena **sonda de
alcance** que confirma a internet de verdade, e informa por que acha que você está offline.

## Os três estados de "sem internet"

| Estado                      | `status`  | `reason`       | O que o usuário vê por padrão   |
| --------------------------- | --------- | -------------- | ------------------------------- |
| Sem conexão com a rede      | `offline` | `no-interface` | "Sem internet"                  |
| Conectado, mas sem internet | `offline` | `no-internet`  | "Sem internet"                  |
| Conexão restabelecida       | `online`  | `null`         | "Conexão restabelecida" por 4 s |

O detector também tem o status `unknown` antes de a primeira verificação terminar. `isOnline` o trata
como online; assim, presume-se que o app está online até prova em contrário e nada pisca na
abertura.

Por padrão, os dois motivos de offline dizem "Sem internet". Ative `distinguishReason` para dizer
"Sem conexão com a rede" ou "Conectado, mas sem internet".

## O que vem na caixa

| Pacote                                    | O que é                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `@rogeriodocarmo/offline-detector-core`   | A máquina de estados e a sonda, sem framework e sem dependências.   |
| `@rogeriodocarmo/offline-detector-react`  | Provider, hooks, estado de dispensa e os textos incluídos.          |
| `@rogeriodocarmo/offline-detector-web`    | A interface web: snackbar, banner, indicador, tela cheia, `--od-*`. |
| `@rogeriodocarmo/offline-detector-native` | A interface React Native. Sem código nativo, sem Reanimated.        |

A maioria dos apps instala um pacote de interface (web ou nativo) e nunca usa os outros diretamente.

## Como se comporta

- O app abre online e não mostra nada. As peças só aparecem quando a conexão se perde.
- Cada transição é anunciada uma única vez aos leitores de tela, de forma educada, e nunca com
  `role="alert"`.
- Toda peça pode ser dispensada deslizando (para a esquerda ou a direita) e também com um botão ou o
  teclado. Uma peça dispensada volta na próxima mudança de status. Veja [Dispensar](./dismissal.md).
- Verificar de novo quando o usuário volta ao app é opcional, por tela. Veja
  [Verificar ao voltar](./recheck-on-return.md).
- O único tráfego de rede é a sonda de alcance configurável. Veja [Privacidade](./privacy.md).

## Para onde ir em seguida

1. [Instale](./install.md) os pacotes da sua plataforma.
2. Siga o início rápido para [web](./web-quick-start.md) ou [nativo](./native-quick-start.md).
3. Consulte qualquer prop ou hook na [referência](./reference/web.md).
4. Leia as [perguntas frequentes](./faq.md) se algo surpreender você.
