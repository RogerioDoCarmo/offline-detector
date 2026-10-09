# @offline-detector/docs

The documentation site for offline-detector: a Docusaurus 3 site with three locales, English
(default), Brazilian Portuguese (`pt-BR`) and Spanish (`es`). It is published as one GitHub Pages
site together with the web demo (see `docs/OWNER-ACTIONS.md`).

| Setting | Value                                                |
| ------- | ---------------------------------------------------- |
| URL     | `https://rogeriodocarmo.github.io/offline-detector/` |
| baseUrl | `/offline-detector/`                                 |
| Demo    | `/offline-detector/demo/` (built by `apps/demo-web`) |
| Privacy | `/offline-detector/privacy-policy.html` (Plan 7)     |

## Commands

```bash
pnpm --filter @offline-detector/docs dev        # one locale at a time: add -- --locale pt-BR
pnpm --filter @offline-detector/docs build      # all three locales, broken links throw
pnpm --filter @offline-detector/docs typecheck
pnpm --filter @offline-detector/docs contrast   # prints the brand contrast table
```

The build is offline: no search service, no analytics, no remote fonts and no CDN. Nothing is
fetched at build time.

## Layout

- `docs/` English pages. `docs/reference/*` are written against the packages' real exports; each
  ends in an export index (heading id `export-index`) that `tests/docs.test.ts` compares with the
  package's `src/index.ts`.
- `i18n/pt-BR`, `i18n/es`: the same pages, translated, plus the UI strings (`code.json`, navbar,
  footer, sidebar labels). Every English page must exist in both, with the same structure.
- `src/css/custom.css`: the brand layer "Signal, found" from `DESIGN.md`. It lives only here, never
  in the package's `--od-*` defaults.
- `scripts/contrast.cjs`: the WCAG contrast of every brand text pairing. `scripts/assemble-site.cjs`:
  assembles the Pages artifact.

## Translations need a native-speaker review

The `pt-BR` and `es` pages are real translations, written with the bundled strings of
`docs/design/strings.md` as the terminology reference, but they have **not** been reviewed by native
speakers. A native-speaker review is still needed before they are treated as final. Open an issue
or a pull request with corrections.

## Adding or changing a page

1. Change the English page, then the `pt-BR` and `es` versions in the same commit. The test fails
   when a locale is missing a page or the heading and code-block counts differ.
2. If a package export changes, update the export index of its reference page in all three locales.
3. Run `pnpm --filter @offline-detector/docs build` and `pnpm test`.

## Known limits

- Syntax-highlighting colours come from the `prism-react-renderer` themes (GitHub and Dracula) and
  are not part of the computed contrast table.
- There is no site search: an offline-capable local search is a third-party plugin and was left out
  on purpose.
- The display typeface proposed in `DESIGN.md` was not added: the docs use the system font stack,
  so nothing is downloaded.
