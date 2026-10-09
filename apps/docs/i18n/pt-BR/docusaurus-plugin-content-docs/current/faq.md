---
id: faq
title: Perguntas frequentes
sidebar_position: 11
---

# Perguntas frequentes

## Mostra algo quando o app abre online?

Não. O status é `unknown` até a primeira verificação terminar, e `isOnline` trata `unknown` como
online. "Conexão restabelecida" só aparece depois de uma perda real: nunca na abertura.

## Por que diz offline se o meu Wi-Fi está conectado?

Porque "conectado" não é "tem internet". Se a interface está ativa mas a sonda falha em todas as
URLs, o estado é `offline` com o motivo `no-internet`. Um portal cativo, um roteador sem saída ou
um firewall que bloqueia os hosts da sonda têm essa aparência. Uma sonda só falha quando a própria
requisição falha (sem conexão, erro de TLS, tempo esgotado);
qualquer resposta HTTP, mesmo um 404 ou um 500, conta como alcançável. Use a sua própria URL de
sonda se as
padrão estiverem bloqueadas. Veja [Privacidade](./privacy.md).

## Quanto tempo leva para perceber?

Quando a interface cai, é imediato: nenhuma sonda é necessária. Quando a interface continua ativa mas
a internet some, a próxima sonda decide: a cada 30 segundos por padrão, enquanto online. Offline, ele
tenta de novo após 1 segundo, dobrando até um teto de 30 segundos, e voltar a ficar online zera isso.

## Posso rodar sem nenhuma requisição de rede?

Sim. Use `probe={{ mode: 'interface-only' }}`. Ele nunca chama `fetch`, não agenda temporizadores e
depende só do sinal da interface da plataforma. Veja [Privacidade](./privacy.md).

## Posso deixar com a cara do meu app?

Sim. Sobrescreva os tokens `--od-*` no CSS na web, ou passe um `theme` no nativo. Veja
[Temas](./theming.md). Para substituir uma peça por completo, use [slots](./slots.md).

## Posso desligar o deslizar?

Sim: `dismissible={false}` para todas as peças, ou as opções `snackbar`, `banner` e `indicator` para
uma só. Toda peça também tem uma alternativa por botão ou tecla. Veja [Dispensar](./dismissal.md).

## O banner empurra o meu conteúdo para baixo?

Por padrão, sim: o banner fica no fluxo. Use `banner={{ overlay: true }}` para flutuar sobre o
conteúdo. Na web, `--od-banner-height` informa a altura dele enquanto aparece.

## Funciona com Next.js, Expo ou React Native Web?

Next.js: sim, a partir de um componente cliente ([notas](./ssr.md)). Expo e React Native puro: sim,
passando o NetInfo ([início rápido para nativo](./native-quick-start.md)). O pacote web renderiza
elementos DOM e não depende de `react-native-web`; o pacote nativo mira somente o React Native.

## Por que preciso passar o NetInfo eu mesmo?

Para que o Metro nunca trate `@react-native-community/netinfo` como uma dependência obrigatória que
você não instalou. Sem ele, só a sonda decide.

## Funciona em web worker, Node ou testes?

O core não tem imports de DOM nem de React Native e aceita `fetch`, `now` e temporizadores
injetáveis, que é como os próprios testes dele rodam. Os pacotes de interface precisam de um
renderizador React.

## O texto em português e espanhol foi revisado por falantes nativos?

Os textos incluídos seguem as notas de design para o português do Brasil e o espanhol internacional
neutro. As traduções da documentação ainda precisam de revisão por falantes nativos. Correções são
bem-vindas.

## Onde está o código-fonte?

No [GitHub](https://github.com/RogerioDoCarmo/offline-detector). Os pacotes têm licença MIT.
