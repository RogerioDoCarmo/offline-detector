import { useEffect, useRef, useState } from 'react';

type Status = 'unknown' | 'online' | 'offline';

/** A brief background check shows only if it is still pending after this long. */
export const CHECKING_DELAY_MS = 150;
/** Once the checking state is shown it stays at least this long. */
export const CHECKING_MIN_MS = 400;

/**
 * True for `recoveryMs` after a real `offline` to `online` transition, and never at launch. It is
 * derived during render (not in an effect) so the offline snackbar is replaced in place by the
 * recovery message, with no frame in between.
 */
export function useRecovery(status: Status, recoveryMs: number): boolean {
  const [tracked, setTracked] = useState({ status, recovered: false });
  let current = tracked;
  if (tracked.status !== status) {
    current = {
      status,
      recovered: tracked.status === 'offline' && status === 'online',
    };
    setTracked(current);
  }
  const recovered = current.recovered;

  useEffect(() => {
    if (!recovered) return undefined;
    const timer = setTimeout(
      () => setTracked((c) => ({ ...c, recovered: false })),
      recoveryMs,
    );
    return () => clearTimeout(timer);
  }, [recovered, recoveryMs]);

  return recovered;
}

/**
 * Whether the checking state is on screen. A user-pressed Retry (`user`) shows at once; a
 * background check the host asked to see (`brief`) shows only after `CHECKING_DELAY_MS`. Once
 * shown it stays `CHECKING_MIN_MS`, so a fast network never flashes.
 */
export function useCheckingDisplay(user: boolean, brief: boolean): boolean {
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    if (user || brief) {
      if (shown) return undefined;
      const show = () => {
        shownAt.current = Date.now();
        setShown(true);
      };
      if (user) {
        show();
        return undefined;
      }
      const timer = setTimeout(show, CHECKING_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (!shown) return undefined;
    const remaining = Math.max(0, CHECKING_MIN_MS - (Date.now() - shownAt.current));
    const timer = setTimeout(() => setShown(false), remaining);
    return () => clearTimeout(timer);
  }, [user, brief, shown]);

  return user || shown;
}

/**
 * Keeps a slot mounted for `exitMs` after `visible` turns false, so it can play its own exit
 * animation. Returns whether to render it.
 */
export function useExitWindow(visible: boolean, exitMs: number): boolean {
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [visible, exitMs]);

  return visible || mounted;
}
