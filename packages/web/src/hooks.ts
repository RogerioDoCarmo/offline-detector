import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, RefObject } from 'react';

/**
 * Turns a raw "a check is pending" flag into what the user should see (docs/design/components.md,
 * "Checking feedback"): nothing until the check has been pending for `delayMs` (no flash on a
 * fast network), then at least `minMs` on screen (no flicker). With `delayMs` 0 the visual is
 * immediate, which is what a user-pressed Retry wants.
 */
export function useSettledChecking(
  active: boolean,
  delayMs: number,
  minMs: number,
): boolean {
  const [shown, setShown] = useState(active && delayMs <= 0);
  const shownAt = useRef(null as number | null);

  useEffect(() => {
    if (shown) shownAt.current ??= Date.now();
    else shownAt.current = null;
  }, [shown]);

  useEffect(() => {
    if (active && !shown) {
      if (delayMs <= 0) {
        setShown(true);
        return undefined;
      }
      const timer = setTimeout(() => setShown(true), delayMs);
      return () => clearTimeout(timer);
    }
    if (!active && shown) {
      const remaining = minMs - (Date.now() - (shownAt.current ?? Date.now()));
      if (remaining <= 0) {
        setShown(false);
        return undefined;
      }
      const timer = setTimeout(() => setShown(false), remaining);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [active, shown, delayMs, minMs]);

  // With no delay the visual is on in the very render that asked for it, not one effect later.
  return shown || (active && delayMs <= 0);
}

/**
 * Text for a live region. Screen readers skip a live region that is mounted together with its
 * text (docs/design/accessibility.md, section 1), so a piece that owns the announcement mounts
 * the region empty and receives the text one frame later. Once the text is there, changes pass
 * through at once. A piece that is not the announcer gets its text immediately, and one that
 * becomes the announcer later keeps what it shows.
 */
export function useAnnouncedText(text: string, announces: boolean): string {
  const [ready, setReady] = useState(!announces);
  useEffect(() => {
    if (ready) return undefined;
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  return ready ? text : '';
}

/** Resolves the `motion` option to a boolean. `auto` follows the OS; SSR starts at false. */
export function useReducedMotion(motion: 'auto' | 'reduced' | 'full' = 'auto'): boolean {
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    if (motion !== 'auto' || typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReduced(query.matches);
    const onChange = (event: { matches: boolean }) => setOsReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [motion]);

  if (motion === 'reduced') return true;
  if (motion === 'full') return false;
  return osReduced;
}

/**
 * Publishes the element's height (plus `extra` px) as a custom property on `<html>` while
 * `active`, so sibling pieces can stack against it (`--od-banner-height`,
 * `--od-snackbar-height`). Resets to 0 when the piece goes away.
 */
export function usePublishHeight(
  name: string,
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  extra = 0,
): void {
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return undefined;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty(name, `${element.getBoundingClientRect().height + extra}px`);
    publish();
    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(publish) : undefined;
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      root.style.setProperty(name, '0px');
    };
  }, [name, ref, active, extra]);
}

type InteractionKey = 'hover' | 'focus' | 'touch';

/**
 * Collapses hover, focus-within and touch into one "the user is interacting" signal, reported
 * only when it changes. The provider uses it to pause the 4 s recovery timer.
 */
export function useInteraction(onChange?: (active: boolean) => void) {
  const flags = useRef({ hover: false, focus: false, touch: false });
  const last = useRef(false);
  const callback = useRef(onChange);

  useEffect(() => {
    callback.current = onChange;
  });

  const stopWatching = useRef(null as (() => void) | null);

  useEffect(
    () => () => {
      stopWatching.current?.();
      stopWatching.current = null;
      // A piece that goes away mid-interaction must not leave the timer paused.
      if (last.current) callback.current?.(false);
    },
    [],
  );

  const set = (key: InteractionKey, value: boolean) => {
    flags.current[key] = value;
    const active = flags.current.hover || flags.current.focus || flags.current.touch;
    if (active === last.current) return;
    last.current = active;
    callback.current?.(active);
  };

  const touchEnd = () => {
    stopWatching.current?.();
    stopWatching.current = null;
    set('touch', false);
  };

  const touchStart = () => {
    set('touch', true);
    if (stopWatching.current) return;
    // The release may land outside the piece (a mouse let go elsewhere): the window hears it.
    window.addEventListener('pointerup', touchEnd);
    window.addEventListener('pointercancel', touchEnd);
    stopWatching.current = () => {
      window.removeEventListener('pointerup', touchEnd);
      window.removeEventListener('pointercancel', touchEnd);
    };
  };

  return {
    onMouseEnter: () => set('hover', true),
    onMouseLeave: () => set('hover', false),
    onFocus: () => set('focus', true),
    onBlur: (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      set('focus', false);
    },
    touchStart,
    touchEnd,
  };
}
