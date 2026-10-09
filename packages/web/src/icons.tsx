import type { ReactElement } from 'react';

const common = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
} as const;

/** Glyphs from docs/design/prototype.html. All are direction-neutral and decorative. */
export function WifiOffIcon({
  className = 'od-icon',
}: {
  className?: string;
}): ReactElement {
  return (
    <svg className={className} {...common}>
      <path d="M3 3l18 18" />
      <path d="M5.2 12.4A10 10 0 0 1 9.4 9.9" />
      <path d="M15.4 9.7a10 10 0 0 1 3.4 2.7" />
      <path d="M8.6 15.9a5 5 0 0 1 6.8 0" />
      <path d="M2 8.8a15 15 0 0 1 4-2.6" />
      <path d="M22 8.8A15 15 0 0 0 11 5" />
      <path d="M12 20h.01" />
    </svg>
  );
}

export function CheckIcon({
  className = 'od-icon',
}: {
  className?: string;
}): ReactElement {
  return (
    <svg className={className} {...common}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CloseIcon(): ReactElement {
  return (
    <svg className="od-icon" {...common}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Spinner(): ReactElement {
  return <span className="od-spinner" aria-hidden="true" />;
}

/** Inside the status dot: a slash (offline), a ring (checking) or a tick (online). */
export function DotGlyph({
  phase,
}: {
  phase: 'offline' | 'checking' | 'online';
}): ReactElement {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {phase === 'offline' && <path d="M5 5l14 14" />}
      {phase === 'checking' && <circle cx="12" cy="12" r="5" />}
      {phase === 'online' && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
}
