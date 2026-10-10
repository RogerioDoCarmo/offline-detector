# Privacy Policy

offline-detector · Last updated: 9 October 2026

> **Short version:** offline-detector is a set of open-source libraries that tell an app whether it
> has internet. They collect, store and send **no** personal data: no accounts, analytics,
> advertising, cookies or identifiers, and no servers of ours. They do make one kind of network
> request, a small connectivity check to a public address (by default Cloudflare, then Google),
> which, like any web request, lets that address see the device's IP address. You can change the
> addresses, point them at your own server, or switch the check off entirely.

The hosted version of this policy is published at:
**<https://rogeriodocarmo.github.io/offline-detector/privacy-policy.html>**

## 1. Who we are

offline-detector ("the project", "we", "us") is a set of open-source packages for React and React
Native (`@rogeriodocarmo/offline-detector-core`, `-react`, `-web` and `-native`), maintained by
Rogério do Carmo, together with the documentation site and the demo app published with them. The
packages run inside other developers' apps, on those apps' users' devices. This policy explains what
the packages and our sites do with information. An app built with the packages has its own privacy
policy, written by its own developer (see section 10).

## 2. Information we collect

**None.** The project runs no server that receives data from the packages, and the published
packages contain no analytics, advertising, crash reporting, tracking or telemetry. They do not read
or store contacts, location, identifiers, photos, files or credentials. The only network activity
the packages perform is the connectivity check in section 3, plus whatever the NetInfo module does
on React Native (section 4).

## 3. The connectivity check

This is the one request the packages make, and the reason this policy exists.

- **What is sent:** an HTTP request (`HEAD` by default) with no body to an address that answers with
  an empty response. In a browser it is sent in `no-cors` mode with caching off, so the page can
  tell that an answer arrived but cannot read it. The packages send no cookies (credentials are
  omitted, so even a same-origin address you configure receives none) and no `Referer` header (the
  referrer policy is `no-referrer`), and add no custom headers or identifiers; the platform's HTTP
  stack adds its normal headers, such as the user agent.
- **What counts as reachable:** any completed HTTP response, whatever its status. Even a `404` or
  `500` shows that a server answered, so the network works. Only a request that fails (no
  connection, a TLS failure, a timeout or an abort) means unreachable. The response is never read.
- **Where, by default:** two addresses, tried in order, the second only if the first fails:
  `https://cp.cloudflare.com/generate_204` (Cloudflare) and `https://www.gstatic.com/generate_204`
  (Google).
- **What the address operators can see:** as with any web request, the device's IP address, the time
  and the standard request headers. Their own privacy policies apply to that. We receive none of it.
- **When:** when the app starts, when the device reports a network change, every 30 seconds while
  the connection is up, and, while it is down, retrying after 1, 2, 4, 8 and 16 seconds and then
  every 30 seconds. It also runs when the user presses Retry, and when the app has chosen to
  re-check as the user returns to it. Each attempt times out after 5 seconds.
- **What the packages do with the result:** they keep "online" or "offline" in memory to show the
  notice and to call the app's callbacks. The result is not sent anywhere, stored or logged.
- **Your control:** a developer can change the addresses (including to your own server), the
  interval, the timeout and the method, or choose the `interface-only` mode, in which the packages
  send no request at all and rely only on what the device reports about its network interface.

## 4. Native apps and NetInfo

On React Native, the native package asks a NetInfo module that the app developer supplies
(`@react-native-community/netinfo`) whether the device has a network connection. That module is not
part of this project. According to its documentation, on platforms without native internet
reachability, or when the app turns native reachability off, it makes its own periodic request: by
default a `HEAD` request to `https://clients3.google.com/generate_204`, every 5 seconds when the
internet was not reachable and every 60 seconds when it was. The app developer can change or disable
this with NetInfo's `configure()`. Mobile operating systems also run their own connectivity checks,
independent of any app. This project controls none of these and does not receive their results.

## 5. Device language and data kept on the device

On React Native the package reads the device's language through `I18nManager`, locally, to choose
between English, Portuguese and Spanish. In a browser it does not read the browser's language unless
the developer passes one. The connection status and which notices you dismissed are kept in memory
only: the packages write nothing to storage and set no cookies, and the state is gone when the app
closes.

## 6. Documentation site and demo

The documentation site and the web demo are hosted on GitHub Pages. As the host, GitHub may log
visitor data such as the IP address under its own privacy statement; we do not receive that data.
The sites set no cookies, run no analytics or advertising, and load no third-party scripts, fonts or
images. The documentation site may keep interface preferences, such as the light or dark theme you
pick, in your browser's local storage; they stay on your device and are never sent. The demo uses a
simulated connectivity check by default; if you tick "Use the real network probe", it sends the
check described in section 3 from your browser. Links to other sites are governed by those sites'
policies.

## 7. Data sharing and selling

Because the project collects no data, there is nothing to share, sell or disclose. The operators of
a connectivity address (section 3) and of NetInfo's address (section 4) receive the requests
described there, as with any web request.

## 8. Data retention and security

The project stores no personal data, so there is nothing to retain, delete or secure on a server.
The packages hold the connection status in memory only.

## 9. Children's privacy

The project collects no data from anyone, including children. The packages contain no ads, no
purchases and no tracking.

## 10. If you build an app with these packages

You decide what your app does with the check, and you are responsible for your own app's privacy
policy and any store data-safety declarations. Points to consider mentioning: your app makes a
connectivity request to the address you configured (by default Cloudflare's and Google's public
addresses), which reveals the device's IP address to that operator; whether you pass NetInfo, and
how you configured it; and what your own code does with the online or offline status. To avoid
contacting any third party, point the check at your own server or use the `interface-only` mode.
This section is practical guidance, not legal advice.

## 11. Changes to this policy

If this policy changes, the updated version will be posted at the same URL with a revised "Last
updated" date. A change to what the packages send over the network is made in the same commit as the
policy change.

## 12. Contact

Questions about this policy? Contact <contact@rogeriodocarmo.com>.

---

© 2026 Rogério do Carmo. This document is the official privacy policy for the offline-detector
project.
