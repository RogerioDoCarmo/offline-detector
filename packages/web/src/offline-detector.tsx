import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import {
  OfflineDetectorProvider,
  indicatorName,
  offlineMessage,
  resolveDismissible,
  resolveStrings,
  useCheckingFeedback,
  useDismissals,
  useNetworkStatus,
} from '@rogeriodocarmo/offline-detector-react';
import type {
  DismissiblePiece,
  OfflineDetectorProviderProps,
  OfflineUiOptions,
  PieceRenderProps,
} from '@rogeriodocarmo/offline-detector-react';
import { createWebAdapter } from './adapter';
import { Banner } from './banner';
import { FullScreen } from './fullscreen';
import { Indicator } from './indicator';
import type { PieceProps } from './piece-types';
import { createWebProbeFetch } from './probe-fetch';
import { Snackbar } from './snackbar';
import { OfflineTokens } from './tokens';

/** Full replacements for the bundled pieces. Each receives the render-props contract. */
export interface OfflineDetectorSlots {
  snackbar?: ComponentType<PieceRenderProps>;
  banner?: ComponentType<PieceRenderProps>;
  indicator?: ComponentType<PieceRenderProps>;
  fullScreen?: ComponentType<PieceRenderProps>;
}

export interface OfflineDetectorProps
  extends Omit<OfflineDetectorProviderProps, 'adapter' | 'children'>, OfflineUiOptions {
  /** Defaults to `createWebAdapter()`, created once per mount. */
  adapter?: OfflineDetectorProviderProps['adapter'];
  /** Replace any bundled piece with your own component. */
  slots?: OfflineDetectorSlots;
  /** How long the "Back online" snackbar stays. Default 4000. */
  recoveryMs?: number;
  /** Fires when the user presses "Continue offline" (or Escape) on the full-screen state. */
  onContinueOffline?: () => void;
  /** CSP nonce for the inline `<style>` element that carries the tokens and piece styles. */
  nonce?: string;
  children?: ReactNode;
}

const DEFAULT_RECOVERY_MS = 4000;

type UiProps = OfflineUiOptions & {
  slots?: OfflineDetectorSlots;
  recoveryMs: number;
  onContinueOffline?: () => void;
};

type Phase = PieceRenderProps['phase'];

/** Renders `Slot` when given, else the bundled piece with the same props. */
function pick(
  Slot: ComponentType<PieceRenderProps> | undefined,
  render: () => ReactElement,
  slotProps: PieceRenderProps,
): ReactElement {
  return Slot ? <Slot {...slotProps} /> : render();
}

function Pieces(props: UiProps): ReactElement {
  const { slots, recoveryMs, motion } = props;
  const network = useNetworkStatus();
  const feedback = useCheckingFeedback();
  const dismissals = useDismissals(props);
  const strings = useMemo(
    () => resolveStrings(props.locale, props.strings),
    [props.locale, props.strings],
  );
  const { status, reason, checking, lastChecked, lastOnlineAt, checkNow } = network;
  const state: OfflineState = useMemo(
    () => ({ status, reason, checking, lastChecked, lastOnlineAt }),
    [status, reason, checking, lastChecked, lastOnlineAt],
  );

  // Transition bookkeeping, done while rendering so no frame shows a stale piece: a real
  // offline -> online change opens the recovery window, any change ends "continued offline".
  // An `initialStatus` hint is not a result: until a real check lands, nothing has been observed,
  // so a hint of offline followed by an online result is a launch, not a recovery.
  const observed = lastChecked === null ? 'unknown' : status;
  const [seen, setSeen] = useState(observed);
  const [recovering, setRecovering] = useState(false);
  const [continued, setContinued] = useState(false);
  if (seen !== observed) {
    setSeen(observed);
    setRecovering(seen === 'offline' && observed === 'online');
    setContinued(false);
  }

  // The recovery timer pauses while the snackbar reports interaction and resumes with the rest.
  const [paused, setPaused] = useState(false);
  const left = useRef(recoveryMs);
  useEffect(() => {
    if (recovering) left.current = recoveryMs;
  }, [recovering]);
  useEffect(() => {
    if (!recovering || paused) return undefined;
    const startedAt = Date.now();
    const timer = setTimeout(() => setRecovering(false), left.current);
    return () => {
      clearTimeout(timer);
      left.current -= Date.now() - startedAt;
    };
  }, [recovering, paused]);

  // A pressed Retry shows the checking state at once; background checks only when asked for.
  const [pressed, setPressed] = useState(0);
  const retry = useCallback(() => {
    setPressed((count) => count + 1);
    const result = checkNow();
    const done = () => setPressed((count) => count - 1);
    result.then(done, done);
    return result;
  }, [checkNow]);
  const userChecking = pressed > 0;

  const offline = status === 'offline';
  const fullScreenOption = props.fullScreen;
  const fullScreenOn = fullScreenOption !== undefined && fullScreenOption !== false;
  const showFullScreen = fullScreenOn && offline && !continued;
  const onContinueOffline = props.onContinueOffline;
  const continueOffline =
    typeof fullScreenOption === 'object' && fullScreenOption.continueOffline === true
      ? () => {
          setContinued(true);
          onContinueOffline?.();
        }
      : undefined;

  const showSnackbar =
    (recovering || (offline && !showFullScreen)) && !dismissals.isDismissed('snackbar');
  const showBanner = offline && !showFullScreen && !dismissals.isDismissed('banner');
  const showIndicator =
    (recovering || (offline && !showFullScreen)) && !dismissals.isDismissed('indicator');

  const phase: Phase = recovering
    ? 'recovered'
    : userChecking || (checking && feedback === 'brief')
      ? 'checking'
      : 'offline';
  const offlineText = offlineMessage(state, strings, props.distinguishReason);
  const message = recovering ? strings.online : offlineText;
  // The full-screen title is its own string, unless the reason-aware message was asked for.
  const fullScreenTitle = props.distinguishReason ? offlineText : strings.fullScreenTitle;
  const checkingDelayMs = userChecking ? 0 : undefined;

  const dismissAction = (piece: DismissiblePiece) =>
    resolveDismissible(piece, props) ? () => dismissals.dismiss(piece) : undefined;

  const bannerAnnounces = !showSnackbar;
  const common = { state, phase, message, strings, theme: undefined, visible: true };
  const shared = { ...common, actions: { retry } };
  const ownProps: PieceProps = { ...shared, motion, checkingDelayMs };

  const snackbarActions = { retry, dismiss: dismissAction('snackbar') };
  const bannerActions = { retry, dismiss: dismissAction('banner') };
  const indicatorActions = { retry, dismiss: dismissAction('indicator') };
  const fullScreenActions = { retry, continueOffline };

  const indicatorOptions = props.indicator;
  const bannerOptions = props.banner;

  // Each piece is keyed by the status it was shown for. A status change therefore starts a fresh
  // piece: its live region mounts empty (accessibility.md, section 1), and an exit animation or a
  // half-finished swipe left over from the previous status can neither hide the new piece nor
  // record a dismissal under the new status.
  return (
    <>
      {showBanner && (
        <Fragment key={`banner-${status}`}>
          {pick(
            slots?.banner,
            () => (
              <Banner
                {...ownProps}
                actions={bannerActions}
                announce={bannerAnnounces}
                overlay={bannerOptions?.overlay}
                showRetry={!showSnackbar}
              />
            ),
            {
              ...common,
              actions: bannerActions,
              rootProps: bannerAnnounces
                ? { role: 'status' }
                : { role: 'region', 'aria-label': message },
            },
          )}
        </Fragment>
      )}
      {showIndicator && (
        <Fragment key={`indicator-${status}`}>
          {pick(
            slots?.indicator,
            () => (
              <Indicator
                {...ownProps}
                actions={indicatorActions}
                variant={indicatorOptions?.variant ?? (showBanner ? 'dot' : 'chip')}
                position={indicatorOptions?.position}
              />
            ),
            {
              ...common,
              actions: indicatorActions,
              rootProps: {
                role: 'img',
                'aria-label': indicatorName(
                  strings,
                  recovering
                    ? strings.indicatorLabelOnline
                    : strings.indicatorLabelOffline,
                ),
              },
            },
          )}
        </Fragment>
      )}
      {showSnackbar && (
        <Fragment key={`snackbar-${status}`}>
          {pick(
            slots?.snackbar,
            () => (
              <Snackbar
                {...ownProps}
                actions={snackbarActions}
                onInteractionChange={setPaused}
              />
            ),
            { ...common, actions: snackbarActions, rootProps: { role: 'status' } },
          )}
        </Fragment>
      )}
      {showFullScreen &&
        pick(
          slots?.fullScreen,
          () => (
            <FullScreen
              {...ownProps}
              message={fullScreenTitle}
              actions={fullScreenActions}
            />
          ),
          {
            ...common,
            message: fullScreenTitle,
            actions: fullScreenActions,
            rootProps: {},
          },
        )}
    </>
  );
}

/**
 * Drop-in offline UI for the web: wraps your app (or sits beside it), watches the connection and
 * shows a snackbar, banner and indicator (and, opt-in, a full-screen state). No provider needed.
 */
export function OfflineDetector(props: OfflineDetectorProps): ReactElement {
  const {
    adapter,
    fetch,
    children,
    slots,
    recoveryMs = DEFAULT_RECOVERY_MS,
    colorScheme,
    nonce,
    ...rest
  } = props;
  // Both are read once by the provider, so create them once per mount. Neither touches a browser
  // global until it runs, which keeps server rendering and hydration identical.
  const [webAdapter] = useState(() => createWebAdapter());
  const [webFetch] = useState(() => createWebProbeFetch());

  const {
    probe,
    onOffline,
    onOnline,
    onChange,
    onError,
    initialStatus,
    detector,
    ...ui
  } = rest;

  const body = (
    <>
      <OfflineTokens nonce={nonce} />
      {children}
      <Pieces {...ui} slots={slots} recoveryMs={recoveryMs} />
    </>
  );

  return (
    <OfflineDetectorProvider
      adapter={adapter ?? webAdapter}
      fetch={fetch ?? webFetch}
      probe={probe}
      onOffline={onOffline}
      onOnline={onOnline}
      onChange={onChange}
      onError={onError}
      initialStatus={initialStatus}
      detector={detector}
    >
      {colorScheme === undefined || colorScheme === 'auto' ? (
        body
      ) : (
        <div data-od-root="" data-od-theme={colorScheme} style={{ display: 'contents' }}>
          {body}
        </div>
      )}
    </OfflineDetectorProvider>
  );
}
