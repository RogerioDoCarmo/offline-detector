import { useRef } from 'react';
import type { PointerEvent, ReactElement } from 'react';
import {
  useAnnouncedText,
  useFocusReturn,
  useInteraction,
  usePublishHeight,
  useReducedMotion,
  useSettledChecking,
} from './hooks';
import { CheckIcon, CloseIcon, Spinner, WifiOffIcon } from './icons';
import { CHECKING_DELAY_MS, CHECKING_MIN_MS } from './piece-types';
import type { PieceProps } from './piece-types';
import { useSwipeDismiss } from './swipe';

export interface SnackbarProps extends PieceProps {
  /**
   * Reports whether the user is hovering, focused inside, or touching the snackbar, so the
   * provider can pause the 4 s recovery timer while they are.
   */
  onInteractionChange?: (active: boolean) => void;
}

/** Bottom-anchored message with Retry and, when dismissible, a dismiss button and swipe. */
export function Snackbar(props: SnackbarProps): ReactElement {
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
    checkingDelayMs = CHECKING_DELAY_MS,
    checkingMinMs = CHECKING_MIN_MS,
    onInteractionChange,
  } = props;

  const ref = useRef(null as HTMLDivElement | null);
  const text = useAnnouncedText(message, announce);
  const reduced = useReducedMotion(motion);
  const dismissible = actions?.dismiss !== undefined;
  const dismissWith = useFocusReturn(ref);
  const swipe = useSwipeDismiss({
    enabled: dismissible && visible,
    onDismiss: () => dismissWith(actions?.dismiss),
    reducedMotion: reduced,
    keys: ['Escape'],
  });
  const checking = useSettledChecking(
    phase === 'checking',
    checkingDelayMs,
    checkingMinMs,
  );
  const interaction = useInteraction(onInteractionChange);
  usePublishHeight('--od-snackbar-height', ref, visible, 8);

  const retry = actions?.retry;
  const icon =
    phase === 'recovered'
      ? (icons?.online ?? <CheckIcon />)
      : checking
        ? (icons?.checking ?? <WifiOffIcon />)
        : (icons?.offline ?? <WifiOffIcon />);

  const withTouch =
    (
      handler: ((event: PointerEvent<HTMLElement>) => void) | undefined,
      touching: boolean,
    ) =>
    (event: PointerEvent<HTMLElement>) => {
      handler?.(event);
      if (touching) interaction.touchStart();
      else interaction.touchEnd();
    };

  return (
    <div
      ref={ref}
      className={className ? `od-snackbar ${className}` : 'od-snackbar'}
      role={announce ? 'status' : undefined}
      aria-description={dismissible ? strings.dismissHint : undefined}
      data-od-phase={phase}
      data-od-motion={motion}
      data-od-state={visible ? undefined : 'exit'}
      {...swipe.props}
      style={{ ...style, ...swipe.props.style }}
      onPointerDown={withTouch(swipe.props.onPointerDown, true)}
      onPointerUp={withTouch(swipe.props.onPointerUp, false)}
      onPointerCancel={withTouch(swipe.props.onPointerCancel, false)}
      onMouseEnter={interaction.onMouseEnter}
      onMouseLeave={interaction.onMouseLeave}
      onFocus={interaction.onFocus}
      onBlur={interaction.onBlur}
      {...rootProps}
    >
      {icon}
      <span className="od-msg">{text}</span>
      {phase !== 'recovered' && retry && (
        <button
          type="button"
          className="od-text-button"
          aria-disabled={checking ? true : undefined}
          aria-busy={checking ? true : undefined}
          onClick={() => {
            if (!checking) retry();
          }}
        >
          {checking ? (
            <>
              <Spinner />
              <span>{strings.checking}</span>
            </>
          ) : (
            strings.retry
          )}
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
