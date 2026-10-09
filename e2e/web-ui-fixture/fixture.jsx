// A tiny host app for the E2E suite: it renders the REAL <OfflineDetector> from the web package
// (web adapter, real detector, real react hooks) around some page content. Only the probe's
// `fetch` is fake, so the suite never needs the network:
//   window.__probeOk       true (default) or false (the probe request fails).
//   window.__odProps       extra JSON props for <OfflineDetector> (locale, fullScreen, ...).
import { createRoot } from 'react-dom/client';
import { OfflineDetector } from '../../packages/web/src/index';

const props = window.__odProps ?? {};
window.__probeOk ??= true;
window.__probeCalls = 0;

const fetchStub = async () => {
  window.__probeCalls += 1;
  // Any completed request means reachable; only a failed one means not.
  if (window.__probeOk === false) throw new TypeError('Failed to fetch');
  return { ok: true };
};

function App() {
  return (
    <OfflineDetector
      {...props}
      fetch={fetchStub}
      probe={{ urls: ['https://probe.invalid/'], intervalMs: 600_000 }}
    >
      <main style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Host app</h1>
        <p>Some page content that the pieces float over.</p>
        <button type="button" id="host-action">
          Host action
        </button>
      </main>
    </OfflineDetector>
  );
}

createRoot(document.getElementById('root')).render(<App />);
