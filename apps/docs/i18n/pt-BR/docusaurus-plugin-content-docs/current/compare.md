---
id: compare
title: Comparação com as alternativas
sidebar_position: 1.5
---

# Comparação com as alternativas

Há algumas formas comuns de saber se um app está online. Cada uma é a resposta certa para algum
app. Esta página diz o que cada uma informa, para você escolher.

## O que cada opção informa

| Opção                              | O que informa                                                        | O que sobra para você                                    |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `navigator.onLine` e seus eventos  | Uma interface de rede está ativa                                     | Saber se alguma requisição funciona, e toda a interface  |
| NetInfo sozinho (React Native)     | O tipo de interface e `isInternetReachable`, de uma checagem própria | A interface, e uma versão web                            |
| Seu próprio hook com sonda `fetch` | O que você construir                                                 | Recuo, checagens sobrepostas, hidratação, acessibilidade |
| offline-detector                   | Internet de verdade, com o motivo, na web e no React Native          | Nada a construir no caso comum; slots para o resto       |

A checagem do NetInfo envia uma requisição, um `HEAD` para `https://clients3.google.com/generate_204`
por padrão, e a repete a cada 5 segundos enquanto a internet não estava acessível e a cada 60
segundos enquanto estava. Tudo isso é configurável com `NetInfo.configure`.

## Quando algo mais simples basta

- Você só precisa saber que a interface de rede mudou: use `navigator.onLine` ou o NetInfo
  diretamente. O offline-detector também tem o modo `interface-only`, que não faz requisições, veja
  [Privacidade](./privacy.md).
- Você já tem um design para o estado offline e só precisa do status: use o hook sem interface
  `useNetworkStatus` do pacote React e renderize a sua própria peça.

## O que o offline-detector acrescenta

- **Uma máquina de estados para web e nativo.** O núcleo, sem framework, roda a mesma lógica nos
  dois, então os dois apps se comportam do mesmo jeito.
- **Uma sonda difícil de enganar.** Ela checa dois hosts por padrão e só informa offline quando
  todas as URLs falham. Uma checagem que falha é repetida após 1 segundo, com recuo até o teto de
  30 segundos, e um evento de interface desligada se sobrepõe a uma checagem ainda em andamento.
- **Sem alarme falso ao abrir.** O estado é `unknown` até a primeira checagem terminar, `unknown`
  conta como online, e "Conexão restabelecida" só aparece depois de uma perda real.
- **Interface pronta e acessível.** Um snackbar com "Tentar novamente", um banner, um indicador e um
  estado de tela cheia opcional, em inglês, português do Brasil e espanhol, com tema por tokens ou
  trocada pelos seus componentes por meio de [slots](./slots.md).

No React Native ele se apoia no NetInfo: você passa o NetInfo, e a biblioteca acrescenta a sonda e
a interface. Veja o [início rápido nativo](./native-quick-start.md).
