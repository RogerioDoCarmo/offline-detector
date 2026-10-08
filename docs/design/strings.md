# Strings

Bundled locales: `en`, `pt-BR`, `es`. Every key is overridable through the `strings` prop (partial
object, merged over the locale). Selection: `locale` prop, then the host document / device
locale, then `en`. Any `pt` variant resolves to `pt-BR`; any `es-*` resolves to `es`.

Tone: plain, short, calm, second person only where an instruction is needed. No exclamation marks,
no apologies, no jargon ("offline" is used only inside the bundled `continueOffline` and labels
where it is the established word). Sentence case. The ellipsis is the single character `…`.

## Copy table

| Key                       | en                                   | pt-BR                                          | es                                             |
| ------------------------- | ------------------------------------ | ---------------------------------------------- | ---------------------------------------------- |
| `offline`                 | No internet                          | Sem internet                                   | Sin internet                                   |
| `offlineNoInterface`      | No network connection                | Sem conexão com a rede                         | Sin conexión de red                            |
| `offlineNoInternet`       | Connected, but no internet           | Conectado, mas sem internet                    | Conectado, pero sin internet                   |
| `online`                  | Back online                          | Conexão restabelecida                          | Conexión restablecida                          |
| `retry`                   | Retry                                | Tentar novamente                               | Reintentar                                     |
| `checking`                | Checking…                            | Verificando…                                   | Verificando…                                   |
| `continueOffline`         | Continue offline                     | Continuar offline                              | Continuar sin conexión                         |
| `dismiss`                 | Dismiss                              | Fechar                                         | Cerrar                                         |
| `dismissHint`             | Swipe left or right to dismiss       | Deslize para a esquerda ou direita para fechar | Desliza a izquierda o a derecha para descartar |
| `indicatorLabelOnline`    | Online                               | Online                                         | En línea                                       |
| `indicatorLabelOffline`   | No internet                          | Sem internet                                   | Sin internet                                   |
| `indicatorLabelChecking`  | Checking connection                  | Verificando conexão                            | Verificando conexión                           |
| `indicatorAccessibleName` | Connection status: {status}          | Status da conexão: {status}                    | Estado de la conexión: {status}                |
| `fullScreenTitle`         | No internet                          | Sem internet                                   | Sin internet                                   |
| `fullScreenBody`          | Check your connection and try again. | Verifique sua conexão e tente novamente.       | Revisa tu conexión e inténtalo de nuevo.       |
| `fullScreenRetry`         | Try again                            | Tentar novamente                               | Intentar de nuevo                              |

`{status}` is replaced with the matching `indicatorLabel*` string.

## How the keys are used

- **Default message** (snackbar, banner, full-screen title): `offline` always, as the spec
  requires. With `distinguishReason` on, the message becomes `offlineNoInterface` when
  `state.reason` is `'no-interface'` and `offlineNoInternet` when it is `'no-internet'`
  (full-screen title included; its body is unchanged).
- **Recovery** (snackbar only): `online`.
- **Retry** is the snackbar and banner action; the full-screen primary button uses
  `fullScreenRetry` ("Try again") because a larger button reads better with a complete phrase, and
  falls back to `retry` when `fullScreenRetry` is unset by an override.
- **Checking**: replaces the Retry label while a check is pending (`checking`); the indicator uses
  `indicatorLabelChecking`.
- **Indicator**: chip text is the `indicatorLabel*` for the state; the accessible name is
  `indicatorAccessibleName` with the status filled in.
- **Dismiss**: accessible name of the dismiss icon button on the snackbar and banner, and of the
  indicator's `dismiss` accessibility action.
- **Dismiss hint**: spoken as the accessibility hint of a swipe-dismissible piece
  (`accessibilityHint` on native, `aria-description` on web). Omitted when `dismissible` is false.

## Notes for translators and reviewers

- pt-BR: "Online" and "offline" are standard in Brazilian UI language and stay in English form.
  "Conexão restabelecida" is preferred over a literal "De volta online" for naturalness; it is
  short enough for a single line at 360 px. "Fechar" is the common dismiss verb in Brazilian
  Android and iOS.
- es: written in neutral international Spanish with the informal `tú` ("Revisa", "inténtalo") used
  by system UI across Latin America and Spain. "En línea" for the status chip is the platform term
  ("Online" is also understood, but "En línea" is the term in system settings). "Verificando" is
  preferred over the Iberian "Comprobando" for reach; both are acceptable overrides.
- Lengths: the longest strings (full-screen body, `offlineNoInternet`) are about 40 percent longer
  in pt-BR and es than in English. Layouts wrap; no fixed widths.
- Interpolated Latin text inside right-to-left host strings is wrapped in directional isolation by
  the formatter.
