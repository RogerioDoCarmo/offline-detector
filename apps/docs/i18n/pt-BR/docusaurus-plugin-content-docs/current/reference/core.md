---
id: core
title: Referência do core
sidebar_label: core
sidebar_position: 1
---

# `@rogeriodocarmo/offline-detector-core`

O motor de detecção sem framework: uma pequena máquina de estados que diz se o app tem **internet de
verdade**. Não tem dependências em tempo de execução e nunca toca no DOM, em `window`, em
`navigator` nem no React Native. As plataformas se conectam por meio de um `PlatformAdapter`; os
pacotes React, web e nativo são construídos sobre ele.

"Offline" significa sem internet de verdade. Wi-Fi, Ethernet ou celular conectados, mas sem tráfego
de dados, contam como offline.

## Como a detecção funciona

- O **sinal da interface**, vindo do adapter, é o rápido. Interface fora do ar significa `offline`
  com o motivo `no-interface`, sem precisar de sonda.
- Com a interface ativa, uma **sonda** confirma o alcance real. As URLs são tentadas em ordem e o
  primeiro sucesso vale (`online`). Se todas falharem ou esgotarem o tempo, o estado é `offline` com
  o motivo `no-internet`.
- Enquanto **online**, a sonda se repete a cada `intervalMs` (padrão 30000 ms).
- Enquanto **offline**, ele tenta de novo após 1000 ms, dobrando até um teto de 30000 ms. Voltar a
  ficar online zera a espera.
- O modo `interface-only` nunca chama `fetch`.

## Uso

```ts
import { createOfflineDetector, isOnline } from '@rogeriodocarmo/offline-detector-core';

const detector = createOfflineDetector({
  adapter, // um PlatformAdapter, veja abaixo
  probe: { urls: ['https://cp.cloudflare.com/generate_204'], timeoutMs: 5000 },
  onOffline: (state) => console.log('offline', state.reason),
  onOnline: (state) => console.log('de volta online', state.lastOnlineAt),
  onChange: (state, previous) => console.log(previous.status, '->', state.status),
});

const unsubscribe = detector.subscribe((state) => render(isOnline(state)));
detector.start();
// depois
detector.stop();
unsubscribe();
```

## `createOfflineDetector(options)`

| Opção                                        | Padrão               | Notas                                                                             |
| -------------------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `adapter`                                    | obrigatório          | Um `PlatformAdapter`.                                                             |
| `probe.urls`                                 | `DEFAULT_PROBE_URLS` | Tentadas em ordem. Não vazia, exceto se `mode` for `interface-only`.              |
| `probe.timeoutMs`                            | `5000`               | Por URL. A requisição é abortada no tempo limite.                                 |
| `probe.intervalMs`                           | `30000`              | Período da nova sonda enquanto online.                                            |
| `probe.method`                               | `'HEAD'`             | `'HEAD'` ou `'GET'`.                                                              |
| `probe.mode`                                 | `'probe'`            | `'interface-only'` nunca chama `fetch` e não agenda temporizadores.               |
| `onOffline(state)`                           | nenhum               | Veja os callbacks abaixo.                                                         |
| `onOnline(state)`                            | nenhum               | Veja os callbacks abaixo.                                                         |
| `onChange(state, previous)`                  | nenhum               | Veja os callbacks abaixo.                                                         |
| `onError(error)`                             | nenhum               | Recebe as exceções lançadas por ouvintes e callbacks.                             |
| `fetch`, `now`, `setTimeout`, `clearTimeout` | os globais           | Injetáveis para testes. Na web, envolva `fetch` para adicionar `mode: 'no-cors'`. |

`DEFAULT_PROBE_URLS` é `['https://cp.cloudflare.com/generate_204',
'https://www.gstatic.com/generate_204']`. Criar um detector no modo sonda sem `fetch` disponível, ou
com uma lista `urls` vazia, lança um erro.

Uma sonda tem sucesso quando `fetch` resolve com `ok: true` ou `type: 'opaque'` (o que `no-cors`
produz). Uma rejeição, uma resposta não ok ou um tempo esgotado contam como falha.

## `OfflineDetector`

| Membro                              | Comportamento                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `getState(): OfflineState`          | O estado atual. Um objeto novo a cada mudança.                                                      |
| `subscribe(listener)`               | `listener(state, previous)` roda a cada mudança. Devolve uma função para cancelar.                  |
| `start()`                           | Assina o adapter, faz uma verificação agora e agenda as demais. Idempotente.                        |
| `stop()`                            | Limpa o temporizador, cancela a assinatura, descarta qualquer resultado em andamento. Pode repetir. |
| `checkNow(): Promise<OfflineState>` | Força uma verificação. Chamadas simultâneas compartilham uma sonda. Funciona sem `start()`.         |

## `OfflineState`

```ts
type OfflineState = {
  status: 'online' | 'offline' | 'unknown'; // unknown só até a primeira verificação terminar
  reason: 'no-interface' | 'no-internet' | null; // não nulo exatamente quando offline
  checking: boolean;
  lastChecked: number | null; // now() quando a última verificação terminou
  lastOnlineAt: number | null; // now() quando foi visto online pela última vez
};
```

`isOnline(state)` é `true` enquanto o status é `unknown`: presume-se que um app está online até prova
em contrário.

## Callbacks

Eles disparam apenas em **transições de status** reais, nunca a cada sonda:

- `onChange(state, previous)` dispara a cada mudança de status, inclusive no primeiro resultado.
- `onOffline(state)` dispara quando o status passa a `offline`, inclusive se o primeiro resultado for
  offline.
- `onOnline(state)` dispara quando o status vai de `offline` de volta a `online`. Ele **não** dispara
  quando o primeiro resultado é `online`: nada foi perdido.
- Uma mudança só de motivo (`no-interface` para `no-internet`) não é uma transição de status. Os
  assinantes ficam sabendo; os callbacks não.

As exceções lançadas por um ouvinte ou callback são capturadas e passadas a `onError`; assim, um
consumidor defeituoso não consegue quebrar a detecção.

## `PlatformAdapter`

```ts
interface PlatformAdapter {
  isInterfaceUp(): boolean | Promise<boolean>;
  subscribeInterface(listener: (up: boolean) => void): () => void;
  subscribeForeground(listener: () => void): () => void;
}
```

- Um evento de interface fora do ar é aplicado na hora e se sobrepõe a qualquer sonda em andamento.
  Um evento de interface ativa dispara uma verificação imediata.
- Um retorno ao primeiro plano dispara `checkNow()` somente quando `recheckOnForeground: true` é
  informado (padrão `false`). A camada React liga isso por tela com `useRecheckOnReturn`.
- Se `isInterfaceUp()` lançar erro ou for rejeitada, trata-se como "ativa" e a sonda decide.

## Índice de exportações {#export-index}

Tudo o que o pacote exporta, valores e tipos.

<!--EXPORTS-->

- `ClearTimeoutFn` (tipo)
- `createOfflineDetector` (função)
- `DEFAULT_PROBE_URLS` (constante)
- `isOnline` (função)
- `OfflineDetector` (tipo)
- `OfflineDetectorOptions` (tipo)
- `OfflineReason` (tipo)
- `OfflineState` (tipo)
- `OfflineStatus` (tipo)
- `packageName` (constante)
- `PlatformAdapter` (tipo)
- `ProbeFetch` (tipo)
- `ProbeOptions` (tipo)
- `ProbeResponse` (tipo)
- `SetTimeoutFn` (tipo)
- `StateListener` (tipo)
- `TimerHandle` (tipo)

<!--/EXPORTS-->
