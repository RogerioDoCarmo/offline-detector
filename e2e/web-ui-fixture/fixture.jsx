// A tiny host app for the E2E suite: it wires the web package's adapter to the four presentational
// pieces the way phase 2's provider will, with a plain state machine instead of the detector.
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Banner,
  Indicator,
  OfflineTokens,
  Snackbar,
  createWebAdapter,
} from '../../packages/web/src/index';

const strings = {
  offline: 'No internet',
  offlineNoInterface: 'No network connection',
  offlineNoInternet: 'Connected, but no internet',
  online: 'Back online',
  retry: 'Retry',
  checking: 'Checking…',
  continueOffline: 'Continue offline',
  dismiss: 'Dismiss',
  dismissHint: 'Swipe left or right to dismiss',
  indicatorLabelOnline: 'Online',
  indicatorLabelOffline: 'No internet',
  indicatorLabelChecking: 'Checking connection',
  indicatorAccessibleName: 'Connection status: {status}',
  fullScreenTitle: 'No internet',
  fullScreenBody: 'Check your connection and try again.',
  fullScreenRetry: 'Try again',
};

function App() {
  const adapter = useMemo(() => createWebAdapter(), []);
  // 'online' | 'offline' | 'recovered' (the 4 s "Back online" window)
  const [status, setStatus] = useState(() =>
    adapter.isInterfaceUp() ? 'online' : 'offline',
  );
  const [dismissed, setDismissed] = useState({});

  useEffect(
    () =>
      adapter.subscribeInterface((up) => {
        setDismissed({});
        setStatus(up ? 'recovered' : 'offline');
      }),
    [adapter],
  );

  useEffect(() => {
    if (status !== 'recovered') return undefined;
    const timer = setTimeout(() => setStatus('online'), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const dismiss = (piece) => () => setDismissed((d) => ({ ...d, [piece]: true }));
  const offline = status === 'offline';
  const base = { strings, message: offline ? strings.offline : strings.online };

  return (
    <>
      <OfflineTokens />
      {offline && !dismissed.banner && (
        <Banner
          {...base}
          phase="offline"
          announce={dismissed.snackbar === true}
          actions={{ dismiss: dismiss('banner') }}
        />
      )}
      <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Host app</h1>
        <p>Some page content that the pieces float over.</p>
        <button type="button" id="host-action">
          Host action
        </button>
      </main>
      {status !== 'online' && !dismissed.indicator && (
        <Indicator
          {...base}
          phase={offline ? 'offline' : 'recovered'}
          variant="dot"
          actions={{ dismiss: dismiss('indicator') }}
        />
      )}
      {status !== 'online' && !dismissed.snackbar && (
        <Snackbar
          {...base}
          phase={offline ? 'offline' : 'recovered'}
          actions={{ retry: () => {}, dismiss: dismiss('snackbar') }}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
