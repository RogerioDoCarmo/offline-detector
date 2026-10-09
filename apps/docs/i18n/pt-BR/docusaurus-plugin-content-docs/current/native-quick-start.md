---
id: native-quick-start
title: Início rápido para nativo
sidebar_position: 4
---

# Início rápido para nativo

Passe o NetInfo do seu app e as margens de área segura do seu layout. Funciona do mesmo jeito no
Expo e no React Native puro.

```tsx
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-native';

function Root() {
  const insets = useSafeAreaInsets();
  return (
    <OfflineDetector netInfo={NetInfo} insets={insets}>
      <App />
    </OfflineDetector>
  );
}

export default function Main() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}
```

Ao abrir online, nada é mostrado. Quando o app fica offline, as três peças aparecem com "Sem
internet". Quando ele volta, "Conexão restabelecida" aparece por `recoveryMs` (4 segundos) e nunca na
abertura. A [demonstração ao vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) mostra a
versão web do mesmo comportamento.

## O NetInfo é passado, não exigido

O pacote nunca importa `@react-native-community/netinfo` por conta própria; assim, o Metro nunca o
trata como uma dependência que você não instalou. Passe o módulo na prop `netInfo`, como acima.

Sem ele, presume-se que a interface de rede está ativa e só a sonda de alcance decide, o que demora
mais para perceber que você ficou offline. Builds de desenvolvimento registram um aviso. Para ter
controle total, passe o seu próprio `adapter` (veja `createNativeAdapter` na
[referência nativa](./reference/native.md)).

## Margens de área segura

Passe `insets` vindo de `useSafeAreaInsets()`. O padrão é `defaultInsets()`: a altura da barra de
status do Android no topo e zero nos demais lados. Isso está errado em iPhones com notch; portanto,
passe as margens neles.

## Verificar de novo ao voltar

Tentar novamente sempre mostra "Verificando…" na hora. Uma nova verificação em segundo plano, ao
voltar ao app, só a mostra quando uma tela opta por isso:

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-react';

function Checkout() {
  useRecheckOnReturn({ checkingFeedback: 'brief' });
  return <Pay />;
}
```

Veja [Verificar ao voltar](./recheck-on-return.md).

## Não verificado em dispositivo

O comportamento é coberto por testes de integração em Jest com o pacote React real. Os fluxos em
dispositivo ou emulador (Maestro) pertencem ao app de demonstração em Expo e não foram executados
para esta versão da documentação.
