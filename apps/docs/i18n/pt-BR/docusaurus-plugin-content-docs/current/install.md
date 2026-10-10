---
id: install
title: Instalação
sidebar_position: 2
---

# Instalação

Escolha o pacote de interface da sua plataforma e instale somente ele. Ele traz junto a camada
React e o motor core, e reexporta os hooks e tipos de que você precisa, então você importa tudo
dele.

## Web

```bash
pnpm add @rogeriodocarmo/offline-detector-web
# ou: npm install @rogeriodocarmo/offline-detector-web
# ou: yarn add @rogeriodocarmo/offline-detector-web
```

Exige React e react-dom 18 ou mais recente (dependências peer). O pacote depende de
`@rogeriodocarmo/offline-detector-react` e de `@rogeriodocarmo/offline-detector-core`, que pnpm, npm
e yarn instalam para você.

## React Native e Expo

```bash
npm install @rogeriodocarmo/offline-detector-native
# opcional, para detecção instantânea quando a interface cai:
npm install @react-native-community/netinfo
# opcional, para as margens de área segura:
npm install react-native-safe-area-context
```

No Expo, use `npx expo install @react-native-community/netinfo react-native-safe-area-context` para
que o Expo escolha as versões compatíveis com o seu SDK. No React Native puro, instale os mesmos
pacotes e rode `pod install` no iOS.

O pacote nativo depende da camada React e do core, então não há mais nada a acrescentar. Exige
React 18 ou mais recente e React Native 0.73 ou mais recente. Não há código nativo próprio,
nem Reanimated, nem dependência de gesture-handler; portanto nada exige um development build além do
que o próprio NetInfo exige.

## Só o motor

Se quiser a sua própria interface, instale a camada React ou apenas o core:

```bash
pnpm add @rogeriodocarmo/offline-detector-core
pnpm add @rogeriodocarmo/offline-detector-react
```

O core nunca toca em `window`, `navigator` nem no React Native. Veja a
[referência do core](./reference/core.md) e a [referência do react](./reference/react.md).

## Confira se funciona

Renderize o componente uma vez perto da raiz (veja os inícios rápidos) e desligue a rede ou use a
aba Network do DevTools do navegador em Offline. As peças aparecem em até um segundo. A
[demonstração ao vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) tem um controle de
**simular offline** que funciona sem tocar na rede.
