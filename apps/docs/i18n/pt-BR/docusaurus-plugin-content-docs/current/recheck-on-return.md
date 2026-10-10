---
id: recheck-on-return
title: Verificar ao voltar
sidebar_position: 5
---

# Verificar ao voltar

Quando alguém volta ao seu app depois de um tempo (a aba fica visível de novo, a janela recebe foco
ou o `AppState` do React Native fica ativo), a última sonda pode estar velha. `useRecheckOnReturn`
faz uma nova sonda na hora, em vez de esperar a próxima verificação agendada.

Ele é **opcional, por tela**. Por padrão o detector nem sequer assina o sinal de primeiro plano;
assim, uma tela que não se importa não paga nada.

```tsx
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-web'; // ou '-native'

function Checkout() {
  const online = useRecheckOnReturn({
    checkingFeedback: 'brief',
    onResult: (isOnline) => console.log('de volta ao app, online:', isOnline),
  });
  return <Pay disabled={!online} />;
}
```

## Opções

| Opção              | Padrão   | Notas                                                                  |
| ------------------ | -------- | ---------------------------------------------------------------------- |
| `checkingFeedback` | `'none'` | `'brief'` ou `'none'`. Se a verificação ao voltar fica visível.        |
| `onResult`         | nenhum   | `(isOnline: boolean) => void`, chamado após cada verificação ao voltar |

O hook devolve o último booleano conhecido: `false` somente quando o app está offline. Ele se atualiza
a cada mudança de estado, não apenas depois de um retorno.

## `'brief'` versus `'none'`

| Origem da verificação                        | `'none'`                      | `'brief'`                                                        |
| -------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| Nova sonda ao voltar ao app                  | nada visível                  | as peças mostram um breve estado "Verificando…"                  |
| O usuário toca em Tentar novamente           | o botão mostra "Verificando…" | igual (um Tentar novamente tocado sempre o mostra)               |
| Sonda agendada com espera crescente, offline | nada visível                  | nada visível (só verificações disparadas ao voltar)              |
| Online, sem problema                         | nada visível                  | nada visível: uma verificação breve bem-sucedida não mostra nada |

Regras do `'brief'`:

- O estado "Verificando…" só aparece se a verificação ainda estiver pendente após **150 ms** e, depois
  de exibido, permanece por pelo menos **400 ms**. Isso evita um lampejo em rede rápida e uma
  cintilação em rede lenta.
- Ele nunca move o layout: um indicador de carregamento substitui o rótulo dentro da mesma caixa.

## Detalhes que vale saber

- O hook assina o adapter apenas enquanto o componente está montado e cancela a assinatura ao
  desmontar. `onResult` não é chamado depois de desmontar.
- Vários hooks montados compartilham **uma** sonda, porque o core elimina verificações simultâneas
  duplicadas.
- A opção `recheckOnForeground` do próprio core continua desligada. Este hook é o único lugar que
  verifica de novo ao voltar.
- `useCheckingFeedback()` é para pacotes de interface: informa `'brief'` enquanto uma verificação ao
  voltar iniciada por um hook `'brief'` está pendente, e `'none'` no resto do tempo.

Veja a [referência do react](./reference/react.md) para os tipos exatos.
