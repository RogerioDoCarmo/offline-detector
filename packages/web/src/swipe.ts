import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react';

/** Rules from docs/design/components.md, "Dismissal". */
export const SWIPE_RULES = {
  /** Release past this share of the width dismisses. */
  distanceRatio: 0.3,
  /** Release at or above this speed (px per ms) dismisses. */
  velocity: 0.5,
  /** Movement after which the drag locks to its dominant axis. */
  axisLockPx: 8,
  /** `--od-duration-exit`: how long the slide-out takes before `onDismiss` runs. */
  exitMs: 150,
} as const;

export type Axis = 'horizontal' | 'vertical';

/** `null` until the pointer has moved `axisLockPx`; then the dominant axis (a tie is vertical). */
export function lockAxis(dx: number, dy: number): Axis | null {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < SWIPE_RULES.axisLockPx) return null;
  return ax > ay ? 'horizontal' : 'vertical';
}

/** Release decision. Integer-friendly comparisons keep 30% and 0.5 px/ms exact. */
export function shouldDismiss(dx: number, width: number, elapsedMs: number): boolean {
  const distance = Math.abs(dx);
  if (distance === 0) return false;
  if (width > 0 && distance * 10 >= width * 3) return true;
  return elapsedMs > 0 && distance * 2 >= elapsedMs;
}

export type DismissKey = 'Escape' | 'Delete';

export interface UseSwipeDismissOptions {
  enabled: boolean;
  onDismiss: () => void;
  reducedMotion: boolean;
  /** Keys that dismiss when pressed on the piece. Default: Escape and Delete. */
  keys?: readonly DismissKey[];
}

export interface SwipeDismissProps {
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  onClickCapture?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  style: CSSProperties;
}

export interface UseSwipeDismissResult {
  /** Spread on the piece's root element. */
  props: SwipeDismissProps;
  /** True while a horizontal drag is in progress. */
  dragging: boolean;
  /** True from the moment the dismissal starts (the exit is playing). */
  dismissed: boolean;
  /** Programmatic dismissal with the same exit as a swipe. */
  dismiss: () => void;
  /** Back to the resting state, for a piece that is shown again without remounting. */
  reset: () => void;
}

interface View {
  offset: number;
  width: number;
  dragging: boolean;
  dismissed: boolean;
  exitDirection: -1 | 1;
  /** False until the first interaction: the resting style carries no transform at all. */
  touched: boolean;
}

const REST: View = {
  offset: 0,
  width: 0,
  dragging: false,
  dismissed: false,
  exitDirection: 1,
  touched: false,
};

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  width: number;
  axis: Axis | null;
  captured: boolean;
}

type Timer = ReturnType<typeof setTimeout>;

const EXIT = 'var(--od-duration-exit) var(--od-ease-in)';
const SETTLE = 'var(--od-duration-base) var(--od-ease-out)';

function styleFor(view: View, reducedMotion: boolean): CSSProperties {
  const base: CSSProperties = { touchAction: 'pan-y' };
  if (!view.touched) return base;
  if (view.dismissed) {
    return reducedMotion
      ? { ...base, transform: 'none', opacity: 0, transition: 'opacity 0ms' }
      : {
          ...base,
          transform: `translateX(${view.exitDirection * 100}%)`,
          opacity: 0,
          transition: `transform ${EXIT}, opacity ${EXIT}`,
        };
  }
  const share = view.width > 0 ? Math.min(Math.abs(view.offset) / view.width, 1) : 0;
  return {
    ...base,
    transform: `translateX(${view.offset}px)`,
    opacity: 1 - share * 0.5,
    transition: view.dragging
      ? 'none'
      : reducedMotion
        ? 'none'
        : `transform ${SETTLE}, opacity ${SETTLE}`,
  };
}

export function useSwipeDismiss(options: UseSwipeDismissOptions): UseSwipeDismissResult {
  const { enabled, reducedMotion } = options;
  const keys = options.keys ?? (['Escape', 'Delete'] as const);
  const [view, setView] = useState(REST);
  const gesture = useRef(null as Gesture | null);
  const exitTimer = useRef(null as Timer | null);
  const clickTimer = useRef(null as Timer | null);
  const swallowClick = useRef(false);
  const dismissedRef = useRef(false);
  const onDismissRef = useRef(options.onDismiss);

  useEffect(() => {
    onDismissRef.current = options.onDismiss;
  });

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    },
    [],
  );

  const startDismissal = useCallback(
    (direction: -1 | 1, width: number) => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setView({
        offset: 0,
        width,
        dragging: false,
        dismissed: true,
        exitDirection: direction,
        touched: true,
      });
      exitTimer.current = setTimeout(
        () => {
          exitTimer.current = null;
          onDismissRef.current();
        },
        reducedMotion ? 0 : SWIPE_RULES.exitMs,
      );
    },
    [reducedMotion],
  );

  const dismiss = useCallback(() => startDismissal(1, 0), [startDismissal]);

  const reset = useCallback(() => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
    dismissedRef.current = false;
    gesture.current = null;
    setView(REST);
  }, []);

  const finish = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (g.captured) {
      event.currentTarget.releasePointerCapture?.(g.pointerId);
      swallowClick.current = true;
      clickTimer.current = setTimeout(() => {
        swallowClick.current = false;
      }, 0);
    }
    if (g.axis !== 'horizontal') return;
    const dx = event.clientX - g.startX;
    if (!cancelled && shouldDismiss(dx, g.width, Date.now() - g.startTime)) {
      startDismissal(dx < 0 ? -1 : 1, g.width);
      return;
    }
    setView({ ...REST, width: g.width, touched: true });
  };

  const props: SwipeDismissProps = { style: styleFor(view, reducedMotion) };
  if (enabled) {
    props.onPointerDown = (event) => {
      if (gesture.current || dismissedRef.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      gesture.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: Date.now(),
        width: event.currentTarget.getBoundingClientRect().width,
        axis: null,
        captured: false,
      };
    };
    props.onPointerMove = (event) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      const dx = event.clientX - g.startX;
      if (g.axis === null) {
        g.axis = lockAxis(dx, event.clientY - g.startY);
        if (g.axis === 'horizontal') {
          // Capture only now: capturing on pointerdown would steal the click from inner buttons.
          event.currentTarget.setPointerCapture?.(g.pointerId);
          g.captured = true;
        }
      }
      if (g.axis !== 'horizontal') return;
      setView({ ...REST, offset: dx, width: g.width, dragging: true, touched: true });
    };
    props.onPointerUp = (event) => finish(event, false);
    props.onPointerCancel = (event) => finish(event, true);
    props.onClickCapture = (event) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };
    props.onKeyDown = (event) => {
      if ((keys as readonly string[]).includes(event.key)) {
        startDismissal(1, 0);
      }
    };
  }

  return { props, dragging: view.dragging, dismissed: view.dismissed, dismiss, reset };
}
