# UI layer contract (Plan 5)

Status: binding for the three parallel Plan 5 workers (`react`, `web`, `native`). It refines
section 4 and 5 of `2026-10-07-offline-detector-design.md` and the design in `docs/design/`.
If this contract and a design doc disagree on an **API name**, this contract wins; on **look and
behavior**, `docs/design/` wins. Disagreements are reported, not silently resolved.

## Phases and ownership

| Phase           | Who             | Delivers                                                                     |
| --------------- | --------------- | ---------------------------------------------------------------------------- |
| 1 (parallel)    | `react` worker  | Provider, hooks, dismissal state, i18n, shared types                         |
| 1 (parallel)    | `web` worker    | Web adapter, probe fetch, swipe hook, tokens, four presentational pieces     |
| 1 (parallel)    | `native` worker | Native adapter, swipe hook, theme, four presentational pieces                |
| 2 (after merge) | integrator      | `OfflineDetector` wiring components in `web` and `native`, integration tests |

Each worker owns **only** its `packages/<name>/**` (including its `jest.config.cjs`) and its
plan file. Nobody edits the root, `tests/`, `.github/`, another package, or the manifests'
dependency graph (already declared). Adding a **devDependency** to your own package with
`pnpm --filter <package> add -D ...` is allowed; if the lockfile conflicts later, the integrator
regenerates it. Phase 1 `web` and `native` build against the **types** in section 2 and must not
import runtime code from `react` (it is landing at the same time); the wiring is phase 2.

## 1. Shared concepts

```ts
type PieceName = 'snackbar' | 'banner' | 'indicator' | 'fullScreen';
type DismissiblePiece = Exclude<PieceName, 'fullScreen'>;
type Locale = 'en' | 'pt-BR' | 'es';
```

- Core types (`OfflineState`, `OfflineDetector`, `PlatformAdapter`, `ProbeFetch`,
  `OfflineDetectorOptions`) come from `@rogeriodocarmo/offline-detector-core`.
- Core's `recheckOnForeground` stays **off**; only the `useRecheckOnReturn` hook re-checks on
  return.

## 2. `@rogeriodocarmo/offline-detector-react`

Peer: React 18+. No DOM and no React Native imports anywhere in this package.

```ts
interface OfflineDetectorProviderProps {
  adapter: PlatformAdapter;
  probe?: ProbeOptions;
  onOffline?(state: OfflineState): void;
  onOnline?(state: OfflineState): void;
  onChange?(state: OfflineState, previous: OfflineState): void;
  onError?(error: unknown): void;
  fetch?: ProbeFetch;
  /** SSR hint: what the first render assumes. Default: the detector's own 'unknown' state. */
  initialStatus?: 'online' | 'offline';
  /** Test seam: use this detector instead of creating one. */
  detector?: OfflineDetector;
  children: ReactNode;
}
function OfflineDetectorProvider(props: OfflineDetectorProviderProps): JSX.Element;

type UseNetworkStatusResult = OfflineState & {
  /** True while status is 'unknown'. */
  isOnline: boolean;
  checkNow(): Promise<OfflineState>;
};
function useNetworkStatus(): UseNetworkStatusResult;
function useOfflineDetector(): OfflineDetector;

interface RecheckOnReturnOptions {
  /** 'brief' asks the UI to show a "Checking" state; 'none' (default) shows nothing. */
  checkingFeedback?: 'brief' | 'none';
  onResult?(isOnline: boolean): void;
}
/** Opt-in per screen. Re-probes on foreground return while mounted. Returns the latest boolean. */
function useRecheckOnReturn(options?: RecheckOnReturnOptions): boolean;
/** For the UI layer: 'brief' while any mounted useRecheckOnReturn asked for it, else 'none'. */
function useCheckingFeedback(): 'brief' | 'none';
```

Required behavior:

- The provider creates **one** detector per mount, calls `start()` in an effect and `stop()` on
  cleanup (StrictMode double-invocation must not leak timers or duplicate listeners). Reads use
  `useSyncExternalStore` with a **server snapshot** so SSR and hydration match: nothing runs
  before mount, no `navigator` access, first check happens in an effect.
- `useRecheckOnReturn` subscribes with `adapter.subscribeForeground` (the adapter is held by the
  provider) while mounted, calls `checkNow()`, then `onResult`. Multiple mounted hooks share one
  probe (core de-duplicates). Unmount unsubscribes.
- Callback props are read through refs, so changing them never restarts the detector.

Dismissal (shared by `web` and `native`):

```ts
interface DismissOptions {
  dismissible?: boolean; // global, default true
  snackbar?: { dismissible?: boolean };
  banner?: { dismissible?: boolean };
  indicator?: { dismissible?: boolean };
  onDismiss?(piece: DismissiblePiece): void;
}
/** Pure. A per-piece value wins over the global one; the default is true. */
function resolveDismissible(piece: DismissiblePiece, options: DismissOptions): boolean;
function useDismissals(options?: DismissOptions): {
  isDismissed(piece: DismissiblePiece): boolean;
  dismiss(piece: DismissiblePiece): void; // no-op when resolveDismissible is false
};
```

A dismissed piece stays hidden until the **next status transition** (online to offline or the
reverse), then every piece is un-dismissed. In memory only, never persisted.

Strings and message selection:

```ts
interface OfflineStrings {
  offline: string;
  offlineNoInterface: string;
  offlineNoInternet: string;
  online: string;
  retry: string;
  checking: string;
  continueOffline: string;
  dismiss: string;
  dismissHint: string;
  indicatorLabelOnline: string;
  indicatorLabelOffline: string;
  indicatorLabelChecking: string;
  indicatorAccessibleName: string; // contains the literal token {status}
  fullScreenTitle: string;
  fullScreenBody: string;
  fullScreenRetry: string;
}
const STRINGS: Record<Locale, OfflineStrings>; // exactly the table in docs/design/strings.md
function resolveLocale(input?: string): Locale; // 'pt'/'pt-PT'/'pt-br' -> 'pt-BR', 'es-MX' -> 'es', else 'en'
function resolveStrings(
  locale?: string,
  overrides?: Partial<OfflineStrings>,
): OfflineStrings;
function offlineMessage(
  state: OfflineState,
  strings: OfflineStrings,
  distinguishReason?: boolean, // default false: always strings.offline ("No internet")
): string;
function indicatorName(strings: OfflineStrings, statusLabel: string): string; // fills {status}
```

Shared UI option and render-prop types (types only, used by `web` and `native`; the exact shape of
`PieceRenderProps` is in `docs/design/components.md`, section "Slots and render props"):

```ts
interface OfflineUiOptions extends DismissOptions {
  locale?: string;
  strings?: Partial<OfflineStrings>;
  distinguishReason?: boolean;
  fullScreen?: boolean | { continueOffline?: boolean };
  indicator?: {
    position?: IndicatorPosition;
    variant?: 'chip' | 'dot';
    dismissible?: boolean;
  };
  banner?: { position?: 'top' | 'bottom'; overlay?: boolean; dismissible?: boolean };
  snackbar?: { dismissible?: boolean };
  motion?: 'auto' | 'reduced' | 'full';
  colorScheme?: 'auto' | 'light' | 'dark';
}
type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
interface PieceRenderProps {
  /* exactly as specified in docs/design/components.md */
}
```

## 3. `@rogeriodocarmo/offline-detector-web` (phase 1)

Peer: React and react-dom 18+. SSR-safe: importing the package never touches `window`.

- `createWebAdapter(env?: { window?; document?; navigator? }): PlatformAdapter`. Interface up =
  `navigator.onLine`; `subscribeInterface` = window `online`/`offline`; `subscribeForeground` =
  `visibilitychange` to visible plus window `focus`, de-duplicated to one callback per return.
  With no `window` it returns an inert adapter (no listeners, interface up).
- `createWebProbeFetch(fetchImpl?): ProbeFetch`: calls `fetch(url, { ...init, mode: 'no-cors',
cache: 'no-store' })` and reports success for `type === 'opaque'` (per core's rule).
- `useSwipeDismiss({ enabled, onDismiss, reducedMotion })`: pointer events with pointer capture,
  the 30% / 0.5 px per ms / 8 px axis-lock rules of `docs/design/components.md`, returns props to
  spread on the piece (`onPointerDown`, ..., `style` with transform and opacity,
  `touch-action: pan-y`) plus `dismissed` state; Escape/Delete handling for the indicator.
- Tokens: the `--od-*` custom properties for light and dark exactly per `docs/design/tokens.md`,
  selectable with `data-od-theme`, delivered without a build-time CSS dependency (an inline
  `<style>` rendered by a `OfflineTokens` component, SSR-safe) and also exported as a string.
- Presentational pieces, props-driven only (state, strings, callbacks), no hooks from `react`:
  `Snackbar`, `Banner`, `Indicator`, `FullScreen`, each accepting the slot/render-props contract,
  correct roles (`role="status"`, never `role="alert"`; labels only on naming-capable roles),
  focus handling for `FullScreen`, `prefers-reduced-motion` support, RTL via logical properties.
- Tests: jsdom + Testing Library for behavior and ARIA; literal-value assertions; swipe tests with
  synthetic pointer events at the 29%/30% and 0.49/0.5 px per ms boundaries. Also add a Playwright
  spec under `e2e/` (`web-ui.spec.ts`) if a bundled fixture page is feasible with the existing
  dependencies; if it is not, say exactly why and leave the E2E to Plan 6's demo app.

## 4. `@rogeriodocarmo/offline-detector-native` (phase 1)

Peers: React 18+, React Native 0.73+, optional `@react-native-community/netinfo`. No native code,
no Reanimated, no gesture-handler, no `react-native-web`.

- `createNativeAdapter({ netInfo?, appState? }): PlatformAdapter`. Defaults load
  `@react-native-community/netinfo` lazily and `react-native`'s `AppState`; both are injectable
  for tests. Interface up = `isConnected !== false`; `subscribeInterface` = NetInfo listener;
  `subscribeForeground` = `AppState` change from `background`/`inactive` to `active`. If NetInfo is
  absent it must degrade to an adapter that always reports the interface up (probe still decides)
  and warn once in development.
- `useSwipeDismiss`: `PanResponder` plus built-in `Animated` with the native driver, same rules as
  web (30% / 0.5 px per ms / 8 px axis lock), reduced motion via
  `AccessibilityInfo.isReduceMotionEnabled` and its change event.
- `OfflineTheme` type and `lightTheme`/`darkTheme` objects with the same token names in camelCase
  per `docs/design/tokens.md`; `useOfflineTheme(colorScheme)` resolving `auto` through
  `useColorScheme`.
- Presentational `Snackbar`, `Banner`, `Indicator`, `FullScreen` as the web ones: safe-area aware,
  `accessibilityLiveRegion`/announcements per `docs/design/accessibility.md`, `accessibilityActions`
  with a `dismiss` action plus `dismissHint`, the full-screen state traps focus as specified.
- Tests: `@testing-library/react-native` (or `react-test-renderer`) with the React Native Jest
  setup configured in `packages/native/jest.config.cjs` only; literal-value assertions.

## 5. Every worker

- Superpowers flow: `superpowers:writing-plans` (plan file named in your brief, with a Tests
  section per level), then `superpowers:test-driven-development`.
- Tests: unit with literal expected values; property tests with fast-check where there is logic
  (the `react` worker); mutation-resistant assertions; coverage of your package at 95% lines and
  branches or better. Stryker covers `packages/react/src`; run it scoped to your package if it
  works in your worktree and report the score honestly, otherwise say why it did not.
- Babel 8 under Jest mishandles explicit type arguments on any call or `new` expression
  (`new Promise<boolean>(...)`, `useState<T>(x)`, `createContext<T>(x)`, `useRef<T>(null)`): use a
  typed parameter or a cast instead (`new Promise((resolve: (v: boolean) => void) => ...)`,
  `useRef(null as T | null)`). Rslib builds are not affected; only the Jest transform is.
- Commit on your own branch with the `Co-Authored-By: Claude Sonnet 5.5
<noreply@anthropic.com>` trailer. Never rebase. Do not push, open PRs or run `gh`.
- Finish with `pnpm typecheck`, `pnpm typecheck:tests`, `pnpm lint`, `pnpm format:check`,
  `pnpm lint:md`, `pnpm build` and `CI=1 pnpm test:ci` all passing in your worktree, and report
  every deviation from this contract with the reason.
