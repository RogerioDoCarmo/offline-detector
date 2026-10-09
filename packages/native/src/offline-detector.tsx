import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import {
  OfflineDetectorProvider,
  offlineMessage,
  resolveDismissible,
  resolveStrings,
  useCheckingFeedback,
  useDismissals,
  useNetworkStatus,
  useOfflineDetector,
  type DismissiblePiece,
  type OfflineDetectorProviderProps,
  type OfflineUiOptions,
  type PieceRenderProps,
} from '@rogeriodocarmo/offline-detector-react';
import { createNativeAdapter, type NetInfoLike } from './adapter';
import { Banner } from './banner';
import { FullScreen, hostContentAccessibilityProps } from './full-screen';
import { useOfflineTheme, useReducedMotion } from './hooks';
import { Indicator } from './indicator';
import { resolveInsets, type Insets } from './insets';
import type { Phase } from './piece-types';
import { Snackbar } from './snackbar';
import type { OfflineTheme } from './theme';
import { useCheckingDisplay, useExitWindow, useRecovery } from './use-timers';

/** A replacement for one piece. It receives the whole render-props contract. */
export type OfflineDetectorSlot = ComponentType<PieceRenderProps<OfflineTheme>>;

export interface OfflineDetectorSlots {
  snackbar?: OfflineDetectorSlot;
  banner?: OfflineDetectorSlot;
  indicator?: OfflineDetectorSlot;
  fullScreen?: OfflineDetectorSlot;
}

export interface OfflineDetectorProps
  extends Omit<OfflineDetectorProviderProps, 'adapter' | 'children'>, OfflineUiOptions {
  /** A platform adapter. Default: `createNativeAdapter({ netInfo })`, created once per mount. */
  adapter?: OfflineDetectorProviderProps['adapter'];
  /**
   * The NetInfo module: `import NetInfo from '@react-native-community/netinfo'`. The package never
   * requires it itself. Without it the interface is assumed up and only the probe decides.
   * Ignored when `adapter` is given.
   */
  netInfo?: NetInfoLike | null;
  /** Replaces a piece entirely. */
  slots?: OfflineDetectorSlots;
  /** Token overrides merged over the light or dark theme. */
  theme?: Partial<OfflineTheme>;
  /** Safe-area insets, for example from `useSafeAreaInsets()`. Default: `defaultInsets()`. */
  insets?: Partial<Insets>;
  /** How long "Back online" shows after a real offline to online transition. Default 4000. */
  recoveryMs?: number;
  /** Fires when the user presses "Continue offline" on the full-screen state. */
  onContinueOffline?: () => void;
  /**
   * Called when the full-screen state leaves the screen, so the host can put screen reader focus
   * back where it was (docs/design/accessibility.md, section 2).
   */
  onRestoreFocus?: () => void;
  children?: ReactNode;
}

type ShellProps = Omit<
  OfflineDetectorProps,
  | 'adapter'
  | 'netInfo'
  | 'probe'
  | 'fetch'
  | 'onOffline'
  | 'onOnline'
  | 'onChange'
  | 'onError'
  | 'initialStatus'
  | 'detector'
>;

const IDS = {
  root: 'offline-detector-root',
  host: 'offline-detector-host',
  bannerWrapper: 'offline-detector-banner-wrapper',
  snackbar: 'offline-detector-snackbar',
  banner: 'offline-detector-banner',
  indicator: 'offline-detector-indicator',
  fullScreen: 'offline-detector-full-screen',
} as const;

/**
 * A number that goes up on every status transition. It is counted by the detector's own listener,
 * which runs when the transition happens and not when React gets round to rendering it, so a
 * value keyed on it is stale in the very first render of the new status even if an outage began
 * and ended between two renders.
 */
function useEpisode(): number {
  const detector = useOfflineDetector();
  const [box] = useState(() => ({ episode: 0 }));
  const subscribe = useCallback(
    (notify: () => void) =>
      detector.subscribe((next, previous) => {
        if (next.status === previous.status) return;
        box.episode++;
        notify();
      }),
    [detector, box],
  );
  const read = useCallback(() => box.episode, [box]);
  return useSyncExternalStore(subscribe, read, read);
}

/** The last value seen while `visible`: a piece that fades out keeps showing what it showed. */
function useWhileVisible<T>(value: T, visible: boolean): T {
  const last = useRef(value);
  if (visible) last.current = value;
  return last.current;
}

/**
 * The offline UI for React Native: a snackbar, a banner and an indicator by default, an opt-in
 * full-screen state, all driven by one detector. Wrap the app (or a screen) in it.
 */
export function OfflineDetector(props: OfflineDetectorProps): ReactElement {
  const {
    adapter: adapterProp,
    netInfo,
    probe,
    fetch,
    onOffline,
    onOnline,
    onChange,
    onError,
    initialStatus,
    detector,
    children,
    ...shell
  } = props;
  const [adapter] = useState(() => adapterProp ?? createNativeAdapter({ netInfo }));

  return (
    <OfflineDetectorProvider
      adapter={adapter}
      probe={probe}
      fetch={fetch}
      onOffline={onOffline}
      onOnline={onOnline}
      onChange={onChange}
      onError={onError}
      initialStatus={initialStatus}
      detector={detector}
    >
      <Shell {...shell}>{children}</Shell>
    </OfflineDetectorProvider>
  );
}

function Shell(props: ShellProps): ReactElement {
  const {
    slots,
    theme: themeOverrides,
    insets,
    onContinueOffline,
    onRestoreFocus,
    children,
  } = props;
  const recoveryMs = props.recoveryMs ?? 4000;
  const state = useNetworkStatus();
  const { checkNow } = state;
  const feedback = useCheckingFeedback();
  const dismissals = useDismissals(props);
  const strings = resolveStrings(
    props.locale ?? I18nManager.getConstants().localeIdentifier ?? undefined,
    props.strings,
  );
  const theme = useOfflineTheme(props.colorScheme, themeOverrides);
  const reduceMotion = useReducedMotion(props.motion);

  const offline = state.status === 'offline';
  // An `initialStatus` hint is not a result: until a real check lands nothing has been observed,
  // so the first result can never be a recovery.
  const observed = state.lastChecked === null ? 'unknown' : state.status;
  const recovered = useRecovery(observed, recoveryMs);

  // Retry: a user press always shows the checking state, whatever the host asked for.
  const [userRetrying, setUserRetrying] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const retry = useCallback(async () => {
    setUserRetrying(true);
    try {
      return await checkNow();
    } finally {
      if (mounted.current) setUserRetrying(false);
    }
  }, [checkNow]);
  const onRetry = useCallback(() => {
    void retry();
  }, [retry]);
  const checking = useCheckingDisplay(userRetrying, feedback === 'brief') && offline;

  // "Continue offline" hides only the full-screen state, until the status changes. It is stored
  // with the episode it was pressed in, so a new episode is never read as continued (no effect,
  // hence no frame in between).
  const episode = useEpisode();
  const [continuedIn, setContinuedIn] = useState<number | null>(null);
  const continued = continuedIn === episode;
  const fullScreenOption = props.fullScreen;
  const continueEnabled =
    typeof fullScreenOption === 'object' && fullScreenOption.continueOffline === true;
  const fullScreenShown = Boolean(fullScreenOption) && offline && !continued;
  const continueOffline = useCallback(() => {
    setContinuedIn(episode);
    onContinueOffline?.();
  }, [episode, onContinueOffline]);

  const offlinePhase: Exclude<Phase, 'recovered'> = checking ? 'checking' : 'offline';
  const offlineText = offlineMessage(state, strings, props.distinguishReason);

  const showingOffline = offline && !fullScreenShown;
  const showingAny = showingOffline || recovered;
  const visibility = {
    snackbar: showingAny && !dismissals.isDismissed('snackbar'),
    banner: showingOffline && !dismissals.isDismissed('banner'),
    indicator: showingAny && !dismissals.isDismissed('indicator'),
    fullScreen: fullScreenShown,
  };

  // The bundled FullScreen reports the focus restore itself; a replacement slot cannot, so the
  // shell does it when the state leaves.
  const restoreFocus = useRef(onRestoreFocus);
  restoreFocus.current = onRestoreFocus;
  const hasFullScreenSlot = slots?.fullScreen !== undefined;
  useEffect(() => {
    if (!hasFullScreenSlot || !visibility.fullScreen) return undefined;
    return () => restoreFocus.current?.();
  }, [hasFullScreenSlot, visibility.fullScreen]);

  const snackbarView = useWhileVisible(
    {
      phase: recovered ? ('recovered' as const) : offlinePhase,
      message: recovered ? strings.online : offlineText,
    },
    visibility.snackbar,
  );
  const bannerView = useWhileVisible(
    { phase: offlinePhase, message: offlineText },
    visibility.banner,
  );
  const indicatorPhase = useWhileVisible(
    recovered ? ('recovered' as const) : offlinePhase,
    visibility.indicator,
  );
  const fullScreenView = useWhileVisible(
    {
      phase: offlinePhase,
      title: props.distinguishReason ? offlineText : strings.fullScreenTitle,
    },
    visibility.fullScreen,
  );

  const dismissFor = (piece: DismissiblePiece) =>
    resolveDismissible(piece, props) ? () => dismissals.dismiss(piece) : undefined;

  // Stacking: the banner owns the top inset and pushes content; a top indicator sits below it,
  // a bottom indicator above the snackbar.
  const [bannerHeight, setBannerHeight] = useState(0);
  const onBannerLayout = useCallback((event: LayoutChangeEvent) => {
    setBannerHeight(event.nativeEvent.layout.height);
  }, []);
  const topInset = resolveInsets(insets).top;
  const indicatorOffsetTop = visibility.banner ? Math.max(0, bannerHeight - topInset) : 0;
  const indicatorOffsetBottom = visibility.snackbar
    ? theme.sizeSnackbarMinHeight + theme.spaceSm
    : 0;
  // Two signals are redundant next to a banner, so the chip collapses to its dot.
  const indicatorVariant =
    props.indicator?.variant ?? (visibility.banner ? 'dot' : 'chip');

  const snackbarMounted = useExitWindow(visibility.snackbar, theme.durationExit);
  const bannerMounted = useExitWindow(visibility.banner, theme.durationExit);
  const indicatorMounted = useExitWindow(visibility.indicator, theme.durationExit);
  const fullScreenMounted = useExitWindow(visibility.fullScreen, theme.durationExit);

  // The snackbar owns the announcement of every transition (docs/design/accessibility.md, section
  // 1), whether or not the user has dismissed it: a dismissal is never announced, so it must not
  // hand the announcement to the banner. After "Continue offline" the full-screen state has
  // already spoken (it moves focus), so the snackbar that appears is silent.
  const snackbarAnnounces = showingAny && !continued;
  const bannerAnnounces = false;

  const slotProps = (
    view: { phase: Phase; message: string },
    visible: boolean,
    actions: PieceRenderProps<OfflineTheme>['actions'],
    rootProps: Record<string, unknown>,
  ): PieceRenderProps<OfflineTheme> => ({
    state,
    phase: view.phase,
    message: view.message,
    actions,
    strings,
    theme,
    visible,
    rootProps,
  });

  const SnackbarSlot = slots?.snackbar;
  const BannerSlot = slots?.banner;
  const IndicatorSlot = slots?.indicator;
  const FullScreenSlot = slots?.fullScreen;

  const bannerAtBottom = props.banner?.position === 'bottom' && !props.banner.overlay;
  const bannerNode = (
    <View testID={IDS.bannerWrapper} onLayout={onBannerLayout}>
      {BannerSlot ? (
        bannerMounted ? (
          <BannerSlot
            {...slotProps(
              bannerView,
              visibility.banner,
              { retry, dismiss: dismissFor('banner') },
              {
                testID: IDS.banner,
                accessibilityLiveRegion: bannerAnnounces ? 'polite' : 'none',
              },
            )}
          />
        ) : null
      ) : (
        <Banner
          testID={IDS.banner}
          phase={bannerView.phase as Exclude<Phase, 'recovered'>}
          message={bannerView.message}
          strings={strings}
          position={props.banner?.position}
          overlay={props.banner?.overlay}
          visible={visibility.banner}
          actions={{ dismiss: dismissFor('banner') }}
          announce={bannerAnnounces}
          theme={theme}
          reduceMotion={reduceMotion}
          insets={insets}
        />
      )}
    </View>
  );

  return (
    <View testID={IDS.root} style={styles.fill}>
      {bannerAtBottom ? null : bannerNode}
      <View
        testID={IDS.host}
        style={styles.fill}
        {...hostContentAccessibilityProps(fullScreenShown)}
      >
        {children}
      </View>
      {bannerAtBottom ? bannerNode : null}

      {IndicatorSlot ? (
        indicatorMounted ? (
          <IndicatorSlot
            {...slotProps(
              { phase: indicatorPhase, message: offlineText },
              visibility.indicator,
              { retry, dismiss: dismissFor('indicator') },
              { testID: IDS.indicator, accessibilityLiveRegion: 'none' },
            )}
          />
        ) : null
      ) : (
        <Indicator
          testID={IDS.indicator}
          phase={indicatorPhase}
          message={offlineText}
          strings={strings}
          variant={indicatorVariant}
          position={props.indicator?.position}
          visible={visibility.indicator}
          actions={{ dismiss: dismissFor('indicator') }}
          offsetTop={indicatorOffsetTop}
          offsetBottom={indicatorOffsetBottom}
          theme={theme}
          reduceMotion={reduceMotion}
          insets={insets}
        />
      )}

      {SnackbarSlot ? (
        snackbarMounted ? (
          <SnackbarSlot
            {...slotProps(
              snackbarView,
              visibility.snackbar,
              { retry, dismiss: dismissFor('snackbar') },
              {
                testID: IDS.snackbar,
                accessibilityLiveRegion: snackbarAnnounces ? 'polite' : 'none',
              },
            )}
          />
        ) : null
      ) : (
        <Snackbar
          testID={IDS.snackbar}
          phase={snackbarView.phase}
          message={snackbarView.message}
          strings={strings}
          actions={{ retry: onRetry, dismiss: dismissFor('snackbar') }}
          visible={visibility.snackbar}
          announce={snackbarAnnounces}
          theme={theme}
          reduceMotion={reduceMotion}
          insets={insets}
        />
      )}

      {FullScreenSlot ? (
        fullScreenMounted ? (
          <FullScreenSlot
            {...slotProps(
              { phase: fullScreenView.phase, message: fullScreenView.title },
              visibility.fullScreen,
              { retry, continueOffline: continueEnabled ? continueOffline : undefined },
              { testID: IDS.fullScreen },
            )}
          />
        ) : null
      ) : (
        <FullScreen
          testID={IDS.fullScreen}
          phase={fullScreenView.phase}
          message={fullScreenView.title}
          strings={strings}
          actions={{
            retry: onRetry,
            continueOffline: continueEnabled ? continueOffline : undefined,
          }}
          onRestoreFocus={onRestoreFocus}
          visible={visibility.fullScreen}
          theme={theme}
          reduceMotion={reduceMotion}
          insets={insets}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
