import { useRef } from 'react';
import type { ReactElement } from 'react';
import { usePublishHeight, useReducedMotion, useSettledChecking } from './hooks';
import { CheckIcon, CloseIcon, Spinner, WifiOffIcon } from './icons';
import { CHECKING_DELAY_MS, CHECKING_MIN_MS } from './piece-types';
import type { PieceProps } from './piece-types';
import { useSwipeDismiss } from './swipe';

export interface BannerProps extends PieceProps {
  /** Floats over the content instead of pushing it down. */
  overlay?: boolean;
  /** Adds a Retry text button, for hosts that turn the snackbar off. Needs `actions.retry`. */
  showRetry?: boolean;
}

/** Full-width strip at the top while offline. Sticky, in the flow, square corners. */
export function Banner(props: BannerProps): ReactElement {
  const {
    phase,
    message,
    strings,
    actions,
    visible = true,
    rootProps,
    announce = true,
    motion = 'auto',
    className,
    style,
    icons,
    overlay,
    showRetry,
    checkingDelayMs = CHECKING_DELAY_MS,
    checkingMinMs = CHECKING_MIN_MS,
  } = props;

  const ref = useRef(null as HTMLDivElement | null);
  const reduced = useReducedMotion(motion);
  const dismissible = actions?.dismiss !== undefined;
  const swipe = useSwipeDismiss({
    enabled: dismissible && visible,
    onDismiss: () => actions?.dismiss?.(),
    reducedMotion: reduced,
    keys: ['Escape'],
  });
  const checking = useSettledChecking(
    phase === 'checking',
    checkingDelayMs,
    checkingMinMs,
  );
  usePublishHeight('--od-banner-height', ref, visible);

  const retry = actions?.retry;
  const icon =
    phase === 'recovered'
      ? (icons?.online ?? <CheckIcon />)
      : checking
        ? (icons?.checking ?? <Spinner />)
        : (icons?.offline ?? <WifiOffIcon />);

  // The banner announces unless the snackbar already does; then it is a labelled landmark.
  const roleProps = announce
    ? { role: 'status' }
    : { role: 'region', 'aria-label': message };

  return (
    <div
      ref={ref}
      className={className ? `od-banner ${className}` : 'od-banner'}
      {...roleProps}
      aria-description={dismissible ? strings.dismissHint : undefined}
      data-od-phase={phase}
      data-od-motion={motion}
      data-od-overlay={overlay ? '' : undefined}
      data-od-state={visible ? undefined : 'exit'}
      {...swipe.props}
      style={{ ...style, ...swipe.props.style }}
      {...rootProps}
    >
      {icon}
      <span className="od-msg">{message}</span>
      {showRetry && retry && phase !== 'recovered' && (
        <button
          type="button"
          className="od-text-button"
          aria-disabled={checking ? true : undefined}
          aria-busy={checking ? true : undefined}
          onClick={() => {
            if (!checking) retry();
          }}
        >
          {checking ? strings.checking : strings.retry}
        </button>
      )}
      {dismissible && (
        <button
          type="button"
          className="od-icon-button"
          aria-label={strings.dismiss}
          onClick={swipe.dismiss}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
