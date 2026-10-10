---
id: privacy
title: Privacidade
sidebar_position: 12
---

# Privacidade

**O único tráfego de rede que o offline-detector cria é a sonda de alcance configurável.** Nada mais
é coletado, armazenado ou enviado a qualquer lugar. Não há análise de uso, relatório de falhas nem
conta, e os pacotes não definem cookie nem gravam nada em armazenamento: até a dispensa fica só na
memória.

## O que a sonda contata

Para distinguir "conectado" de "tem internet", o detector requisita uma URL minúscula que responde
com um `204 No Content` vazio. Por padrão ele tenta estas, em ordem, e o primeiro sucesso vale:

1. `https://cp.cloudflare.com/generate_204`
2. `https://www.gstatic.com/generate_204`

São os endpoints de verificação de conectividade que sistemas operacionais e navegadores usam. A
requisição não leva corpo nem cabeçalhos personalizados desta biblioteca, nem identificador. Como
qualquer requisição web, ela revela o endereço IP do dispositivo e os metadados usuais da requisição
ao host que responde, que é o operador dessa URL, e não os autores deste projeto.

| Opção              | Padrão             | Significado                                                               |
| ------------------ | ------------------ | ------------------------------------------------------------------------- |
| `probe.urls`       | as duas URLs acima | Tentadas em ordem. Não podem ser vazias, exceto no modo `interface-only`. |
| `probe.method`     | `'HEAD'`           | `'HEAD'` ou `'GET'`.                                                      |
| `probe.timeoutMs`  | `5000`             | Por URL. A requisição é abortada no tempo limite.                         |
| `probe.intervalMs` | `30000`            | Com que frequência repete a sonda enquanto online.                        |
| `probe.mode`       | `'probe'`          | `'interface-only'` não faz nenhuma requisição.                            |

Offline, ele tenta de novo após 1 segundo, dobrando até um teto de 30 segundos. Uma sonda conta como
alcançável quando qualquer resposta HTTP é concluída, qualquer que seja o status: um `404` ou `500`
ainda prova que um servidor respondeu. Só uma requisição que falha (sem conexão, falha de TLS, tempo
esgotado ou aborto) conta como inalcançável. A resposta nunca é lida.

A sonda não envia cookies (`credentials: 'omit'`, então nem um endpoint de mesma origem recebe algum)
nem o cabeçalho `Referer` (`referrerPolicy: 'no-referrer'`).

## Use o seu próprio endpoint

Você pode apontar a sonda para um servidor que controla, para que nenhum terceiro veja a requisição.

```tsx
<OfflineDetector probe={{ urls: ['https://status.example.com/generate_204'] }}>
  <App />
</OfflineDetector>
```

O que o seu endpoint precisa fazer:

- Responder rápido a `HEAD` e `GET`, de preferência com `204 No Content` e corpo vazio. O status não
  é inspecionado (qualquer resposta prova que a rede funciona), mas uma resposta pequena e vazia
  mantém a verificação barata.
- Ser servido por HTTPS (uma página servida por HTTPS não pode chamar uma URL HTTP).
- Não ser colocado em cache por um service worker ou CDN: o fetch de sonda da web já envia
  `cache: 'no-store'`.
- Ser alcançável de onde estão os seus usuários. Se você serve uma origem diferente da página, uma
  política de segurança de conteúdo com `connect-src` precisa permiti-la.

CORS: o fetch de sonda padrão da web usa `mode: 'no-cors'`; portanto o seu endpoint não precisa
enviar `Access-Control-Allow-Origin`. Você só precisa desse cabeçalho se fornecer o seu próprio
`fetch` que não use `no-cors` e leia a resposta.

Um endpoint mínimo, por exemplo em Node:

```js
import { createServer } from 'node:http';

createServer((req, res) => {
  res.writeHead(204, { 'Cache-Control': 'no-store' });
  res.end();
}).listen(8080);
```

## Modo só interface: nenhuma requisição

Se você não quer nenhuma requisição, use apenas o sinal da interface da plataforma:

```tsx
<OfflineDetector probe={{ mode: 'interface-only' }}>
  <App />
</OfflineDetector>
```

Nesse modo, `fetch` nunca é chamado e nenhum temporizador é agendado. O custo é a precisão: uma rede
conectada sem internet (um portal cativo, um roteador sem saída) parece online; portanto o motivo
`no-internet` nunca ocorre.

## React Native: o que o NetInfo faz

No React Native você passa um módulo NetInfo (`@react-native-community/netinfo`) ao componente. Ele
não faz parte do offline-detector, e o offline-detector não controla nem vê o que ele requisita.
Segundo a documentação dele, em plataformas sem alcance de internet nativo, ou quando
`useNativeReachability` é desligado, o NetInfo faz a sua própria requisição periódica: por padrão uma
requisição `HEAD` para `https://clients3.google.com/generate_204`, a cada 5 segundos quando a internet
não estava acessível e a cada 60 segundos quando estava. Mude ou desative isso com o `configure()` do
NetInfo. Os sistemas operacionais móveis também fazem as suas próprias verificações de conectividade,
independentes de qualquer app.

## A situação deste site de documentação

Este site de documentação é estático. Não define cookies, não carrega análise de uso e não busca
fontes nem scripts de outros hosts. Ele pode guardar preferências de interface, como o tema claro ou
escuro que você escolher, no armazenamento local do navegador; elas ficam no seu dispositivo e nunca
são enviadas. A demonstração ao vivo tem um controle de simular offline que aciona uma sonda de
mentira; assim, dá para testá-la sem nenhuma requisição de rede.

A página da política de privacidade do projeto é publicada ao lado deste site em
`/privacy-policy.html`, e o `PRIVACY.md` do repositório contém a mesma política.
