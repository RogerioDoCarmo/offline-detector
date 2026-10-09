import { useEffect } from 'react';
import {
  useNetworkStatus,
  useRecheckOnReturn,
} from '@rogeriodocarmo/offline-detector-react';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import type { DemoController } from '../lib/controller';

/** Hands the mounted detector's `checkNow` to the controller so Simulate can trigger a probe. */
export function Bridge({ controller }: { controller: DemoController }) {
  const { checkNow } = useNetworkStatus();
  useEffect(() => controller.attach(checkNow), [controller, checkNow]);
  return null;
}

/** The detector's state as the hooks report it. Not a live region: the pieces announce it. */
export function StatusReadout() {
  const { status, reason, checking, isOnline } = useNetworkStatus();
  return (
    <dl className="readout" aria-label="Detector state">
      <div>
        <dt>Status</dt>
        <dd data-testid="status">{status}</dd>
      </div>
      <div>
        <dt>Reason</dt>
        <dd data-testid="reason">{reason ?? 'none'}</dd>
      </div>
      <div>
        <dt>Checking</dt>
        <dd data-testid="checking">{checking ? 'yes' : 'no'}</dd>
      </div>
      <div>
        <dt>isOnline</dt>
        <dd data-testid="is-online">{isOnline ? 'true' : 'false'}</dd>
      </div>
    </dl>
  );
}

/**
 * A screen that opts in to re-checking when the user returns to the app. The hook is mounted only
 * while this component is, as the docs describe ("opt-in per screen").
 */
export function RecheckScreen({
  checkingFeedback,
  onResult,
}: {
  checkingFeedback: 'brief' | 'none';
  onResult: (isOnline: boolean) => void;
}) {
  const online = useRecheckOnReturn({ checkingFeedback, onResult });
  return (
    <div className="screen" data-testid="recheck-screen">
      <h3>Checkout screen</h3>
      <p>
        This screen calls <code>useRecheckOnReturn</code> with{' '}
        <code>checkingFeedback: &apos;{checkingFeedback}&apos;</code>. It reports{' '}
        <strong data-testid="recheck-online">{online ? 'online' : 'offline'}</strong>.
      </p>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          // Exactly what the web adapter listens for when a tab is left and entered again.
          window.dispatchEvent(new Event('blur'));
          window.dispatchEvent(new Event('focus'));
        }}
      >
        Simulate returning to the tab
      </button>
    </div>
  );
}

/** A slot: replaces the bundled snackbar entirely and gets the render-props contract. */
export function DemoToast({ message, phase, actions, rootProps }: PieceRenderProps) {
  return (
    <div {...rootProps} className="demo-toast" data-phase={phase}>
      <span className="demo-toast-dot" aria-hidden="true" />
      <span>{message}</span>
      {phase === 'offline' ? (
        <button type="button" onClick={() => void actions.retry()}>
          Try again
        </button>
      ) : null}
      {actions.dismiss ? (
        <button type="button" onClick={actions.dismiss}>
          Close
        </button>
      ) : null}
    </div>
  );
}
