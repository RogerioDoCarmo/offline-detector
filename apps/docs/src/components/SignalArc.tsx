import type { ReactElement } from 'react';

/**
 * The brand motif: a signal arc that is broken, then completes. Decorative (the heading next to it
 * carries the meaning). The completing stroke is a CSS animation that is switched off under
 * `prefers-reduced-motion`, leaving the whole arc.
 */
export default function SignalArc(): ReactElement {
  return (
    <svg className="sf-arc" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
      <path className="sf-arc__lost" d="M10 70A50 50 0 0 1 60 20" />
      <path className="sf-arc__found" d="M60 20A50 50 0 0 1 110 70" pathLength="100" />
      <circle className="sf-arc__dot" cx="60" cy="68" r="7" />
    </svg>
  );
}
