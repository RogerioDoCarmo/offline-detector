---
id: ssr
title: Renderização no servidor e Next.js
sidebar_position: 10
---

# Renderização no servidor e Next.js

Importar os pacotes, criar o adapter e renderizar no servidor nunca tocam em `window`, `document` nem
`navigator`. O servidor renderiza os tokens e os seus filhos, e nenhuma peça (a menos que você passe
`initialStatus="offline"`). A primeira verificação de conectividade roda em um efeito após a
montagem; assim, a hidratação produz o mesmo HTML do servidor e nada pisca.

## Next.js App Router

O componente usa estado e efeitos; portanto coloque-o em um componente cliente:

```tsx
'use client';

import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';

export function Offline({ children }: { children: React.ReactNode }) {
  return <OfflineDetector>{children}</OfflineDetector>;
}
```

Depois use `<Offline>` no seu layout raiz. O mesmo vale para qualquer hook do pacote React: ele roda
apenas em componentes cliente.

## `initialStatus`

Sem `initialStatus`, a primeira renderização no servidor e no cliente mostra o estado `unknown`, que
`isOnline` trata como online. Passe `initialStatus="offline"` quando você souber mais, por exemplo
por um cookie ou um cabeçalho da requisição:

```tsx
<OfflineDetector initialStatus="offline">{children}</OfflineDetector>
```

Assim, o HTML do servidor e a primeira renderização no cliente concordam, e a dica vale até a
primeira verificação real terminar. É apenas uma dica para a primeira pintura: se a primeira
verificação real achar o app online, as peças simplesmente somem, **sem** a mensagem "Conexão
restabelecida".

## Exportação estática

Um site exportado estaticamente (`output: 'export'` do Next.js, Docusaurus, ilhas do Astro) funciona
do mesmo jeito: nada roda até a página estar em um navegador. A
[demonstração ao vivo](https://rogeriodocarmo.github.io/offline-detector/demo/) é uma exportação
estática.

## Política de segurança de conteúdo

`<OfflineDetector>` renderiza um elemento `<style>` em linha com os tokens `--od-*` e os estilos das
peças, e não aceita uma prop `nonce`. Um `style-src` estrito, sem `unsafe-inline`, portanto o
bloqueia. Os blocos de construção são exportados caso você precise montar o seu: `OfflineTokens`
(aceita um `nonce`), `offlineTokensCss` e `offlineCss` (o CSS como strings). Veja a
[referência web](./reference/web.md). Esse caminho não foi testado contra uma política real.
