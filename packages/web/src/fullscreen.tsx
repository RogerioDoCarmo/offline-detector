import { useEffect, useRef } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { useSettledChecking } from './hooks';
import { WifiOffIcon, Spinner } from './icons';
import { CHECKING_DELAY_MS, CHECKING_MIN_MS } from './piece-types';
import type { PieceProps } from './piece-types';

const SKIPPED = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT']);

/**
 * Marks everything outside the full-screen state as `inert` (with `aria-hidden` for engines that
 * lack `inert`). It walks from the element up to `<body>` and marks the siblings at every level,
 * so it works wherever the piece is rendered. Returns a function that restores the previous
 * attribute values exactly.
 */
function inertHost(root: HTMLElement): () => void {
  const restore: Array<() => void> = [];
  let node: HTMLElement = root;
  while (node.parentElement) {
    const parent: HTMLElement = node.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || SKIPPED.has(sibling.tagName)) continue;
      const inert = sibling.getAttribute('inert');
      const hidden = sibling.getAttribute('aria-hidden');
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
      restore.push(() => {
        if (inert === null) sibling.removeAttribute('inert');
        else sibling.setAttribute('inert', inert);
        if (hidden === null) sibling.removeAttribute('aria-hidden');
        else sibling.setAttribute('aria-hidden', hidden);
      });
    }
    if (parent === parent.ownerDocument.body) break;
    node = parent;
  }
  return () => restore.forEach((undo) => undo());
}

/**
 * Page-level replacement for hosts whose screens are useless offline. Not a dialog: it takes
 * focus (title first) and makes the host inert, and gives focus back when it goes away.
 */
export function FullScreen(props: PieceProps): ReactElement {
  const {
    phase,
    message,
    strings,
    actions,
    visible = true,
    rootProps,
    motion = 'auto',
    className,
    style,
    icons,
    checkingDelayMs = CHECKING_DELAY_MS,
    checkingMinMs = CHECKING_MIN_MS,
  } = props;

  const rootRef = useRef(null as HTMLDivElement | null);
  const titleRef = useRef(null as HTMLHeadingElement | null);
  const checking = useSettledChecking(
    phase === 'checking',
    checkingDelayMs,
    checkingMinMs,
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!visible || !root) return undefined;
    const doc = root.ownerDocument;
    const previous = doc.activeElement as HTMLElement | null;
    titleRef.current?.focus();
    const release = inertHost(root);
    return () => {
      release();
      if (previous && previous !== doc.body && previous.isConnected) previous.focus();
      else doc.body.focus();
    };
  }, [visible]);

  const retry = actions?.retry;
  const continueOffline = actions?.continueOffline;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') continueOffline?.();
  };

  return (
    <div
      ref={rootRef}
      className={className ? `od-fullscreen ${className}` : 'od-fullscreen'}
      data-od-phase={phase}
      data-od-motion={motion}
      data-od-state={visible ? undefined : 'exit'}
      onKeyDown={onKeyDown}
      style={style}
      {...rootProps}
    >
      <div className="od-fullscreen-inner">
        {icons?.offline ?? <WifiOffIcon className="od-icon od-big-icon" />}
        <h1 ref={titleRef} tabIndex={-1}>
          {message}
        </h1>
        <p>{strings.fullScreenBody}</p>
        <div className="od-fullscreen-actions">
          {retry && (
            <button
              type="button"
              className="od-button full"
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
                strings.fullScreenRetry || strings.retry
              )}
            </button>
          )}
          {continueOffline && (
            <button type="button" className="od-text-button" onClick={continueOffline}>
              {strings.continueOffline}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
