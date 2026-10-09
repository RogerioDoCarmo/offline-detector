---
id: web-quick-start
title: Início rápido para web
sidebar_position: 3
---

# Início rápido para web

Renderize `<OfflineDetector>` uma vez, perto da raiz. Ele não precisa de provider nem de adapter.

```tsx
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Root() {
  return (
    <OfflineDetector>
      <App />
    </OfflineDetector>
  );
}
```

Essa é toda a configuração. O app abre online e não mostra nada. Quando a conexão cai, aparecem um
snackbar ("Sem internet", com Tentar novamente), um banner e um indicador. Quando ela volta, um
snackbar "Conexão restabelecida" aparece por quatro segundos.

Experimente na [demonstração ao vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) ou
abra o DevTools do navegador, aba Network, e escolha Offline.

## Leia o status em qualquer lugar

Os hooks do pacote React funcionam em qualquer ponto dentro de `<OfflineDetector>`:

```tsx
import { useNetworkStatus } from '@rogeriodocarmo/offline-detector-react';

function SaveButton() {
  const { isOnline, reason, checkNow } = useNetworkStatus();
  return (
    <button disabled={!isOnline} onClick={() => void checkNow()}>
      {isOnline ? 'Salvar' : `Offline (${reason})`}
    </button>
  );
}
```

`@rogeriodocarmo/offline-detector-react` é instalado junto com o pacote web. Veja a
[referência do react](./reference/react.md) para todos os hooks.

## Opções comuns

```tsx
<OfflineDetector
  locale="pt-BR"
  distinguishReason
  fullScreen={{ continueOffline: true }}
  probe={{ urls: ['https://example.com/health'], intervalMs: 60000 }}
  onOffline={(state) => console.log('offline', state.reason)}
>
  <App />
</OfflineDetector>
```

| Opção               | O que faz                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `locale`            | `en`, `pt-BR` ou `es`. Variantes como `pt` e `es-MX` são resolvidas.                     |
| `distinguishReason` | Diz o motivo: "Sem conexão com a rede" ou "Conectado, mas sem internet".                 |
| `fullScreen`        | Um estado de tela cheia opcional, com Tentar novamente e, se quiser, uma saída.          |
| `probe`             | URLs da sonda, tempo limite, intervalo, método e modo. Veja [Privacidade](./privacy.md). |
| `dismissible`       | Desliga o deslizar e o Fechar em todas as peças. Veja [Dispensar](./dismissal.md).       |

A lista completa está na [referência web](./reference/web.md). No Next.js, leia as notas sobre
[renderização no servidor](./ssr.md): o componente precisa ficar em um componente cliente.
