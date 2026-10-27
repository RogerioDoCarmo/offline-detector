'use client';

import { useEffect, useState } from 'react';

const SCOPE = '/offline-detector/demo/';

type WorkerState = 'checking' | 'unsupported' | 'registering' | 'ready' | 'failed';

/**
 * The installed-app check. It registers the demo's service worker (production builds only, so the
 * dev server never serves stale files) and reports what a PWA test needs to see: whether the
 * worker is active, whether it controls this page, and whether the page runs as an installed app.
 */
export function PwaCheck() {
  const [worker, setWorker] = useState('checking' as WorkerState);
  const [controlled, setControlled] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(globalThis.matchMedia('(display-mode: standalone)').matches);
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') {
      setWorker('unsupported');
      return;
    }
    const container = navigator.serviceWorker;
    setControlled(container.controller !== null);
    const onControl = () => setControlled(container.controller !== null);
    container.addEventListener('controllerchange', onControl);
    setWorker('registering');
    container
      .register(`${SCOPE}sw.js`, { scope: SCOPE })
      .then(() => container.ready)
      .then(() => setWorker('ready'))
      .catch(() => setWorker('failed'));
    return () => container.removeEventListener('controllerchange', onControl);
  }, []);

  return (
    <section aria-labelledby="pwa-heading" className="card">
      <h2 id="pwa-heading">Installed app (PWA)</h2>
      <p>
        This demo is installable. Install it from your browser, then switch the network
        off and reload: the page still opens from the service worker, and the detector
        reports offline. The worker never answers the reachability probe.
      </p>
      <dl className="readout" aria-label="PWA state">
        <div>
          <dt>Service worker</dt>
          <dd data-testid="pwa-worker">{worker}</dd>
        </div>
        <div>
          <dt>Controls this page</dt>
          <dd data-testid="pwa-controlled">{controlled ? 'yes' : 'no'}</dd>
        </div>
        <div>
          <dt>Display mode</dt>
          <dd data-testid="pwa-display">
            {standalone ? 'installed app' : 'browser tab'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
