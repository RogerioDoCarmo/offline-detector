import { useRef } from 'react';
import { useFocusReturn, useReducedMotion, useSettledChecking } from './hooks';
import type { ReactElement } from 'react';
import { DotGlyph } from './icons';
import { indicatorName } from '@rogeriodocarmo/offline-detector-react';
import type { IndicatorPosition } from '@rogeriodocarmo/offline-detector-react';
import { CHECKING_DELAY_MS, CHECKING_MIN_MS } from './piece-types';
import type { PieceProps } from './piece-types';
import { useSwipeDismiss } from './swipe';

export interface IndicatorProps extends PieceProps {
  /** Default `chip`. The provider passes `dot` when the banner is visible (autoCollapse). */
  variant?: 'chip' | 'dot';
  /** Default `top-end`. `start` and `end` follow the writing direction. */
  position?: IndicatorPosition;
  /**
   * What to show while a check is pending but not yet shown (the 150 ms window). `null` renders
   * nothing, for an indicator that only exists while checking. Default `offline`.
   */
  idlePhase?: 'offline' | 'recovered' | null;
}

/** A small, always-labelled status marker. Never a live region: state is read on focus. */
export function Indicator(props: IndicatorProps): ReactElement | null {
  const {
    phase,
    strings,
    actions,
    visible = true,
    rootProps,
    motion = 'auto',
    className,
    style,
    variant = 'chip',
    position = 'top-end',
    idlePhase = 'offline',
    checkingDelayMs = CHECKING_DELAY_MS,
    checkingMinMs = CHECKING_MIN_MS,
  } = props;

  const ref = useRef(null as HTMLDivElement | null);
  const reduced = useReducedMotion(motion);
  const dismissible = actions?.dismiss !== undefined;
  const dismissWith = useFocusReturn(ref);
  const swipe = useSwipeDismiss({
    enabled: dismissible && visible,
    onDismiss: () => dismissWith(actions?.dismiss),
    reducedMotion: reduced,
  });
  const checking = useSettledChecking(
    phase === 'checking',
    checkingDelayMs,
    checkingMinMs,
  );

  const shown = phase === 'checking' ? (checking ? 'checking' : idlePhase) : phase;
  if (shown === null) return null;

  const dot = shown === 'recovered' ? 'online' : shown;
  const label =
    dot === 'online'
      ? strings.indicatorLabelOnline
      : dot === 'checking'
        ? strings.indicatorLabelChecking
        : strings.indicatorLabelOffline;
  const name = indicatorName(strings, label);

  const labelled = {
    role: 'img',
    'aria-label': name,
    'aria-description': dismissible ? strings.dismissHint : undefined,
    tabIndex: dismissible ? 0 : undefined,
  };

  return (
    <div
      ref={ref}
      className={`od-indicator od-pos-${position}${className ? ` ${className}` : ''}`}
      data-od-phase={shown}
      data-od-motion={motion}
      data-od-state={visible ? undefined : 'exit'}
      {...swipe.props}
      style={{ ...style, ...swipe.props.style }}
      {...rootProps}
    >
      {variant === 'dot' ? (
        <span className="od-dot-target" title={label} {...labelled}>
          <span className={`od-dot ${dot}`} aria-hidden="true">
            <DotGlyph phase={dot} />
          </span>
        </span>
      ) : (
        <span className="od-chip" {...labelled}>
          <span className={`od-dot ${dot}`} aria-hidden="true">
            <DotGlyph phase={dot} />
          </span>
          <span>{label}</span>
        </span>
      )}
    </div>
  );
}
