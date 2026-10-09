'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OfflineState } from '@rogeriodocarmo/offline-detector-core';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';
import { createDemoController } from '../lib/controller';
import type { Simulation } from '../lib/controller';
import { DEFAULT_OPTIONS, buildDetectorProps, mountKey } from '../lib/options';
import type { DemoOptions } from '../lib/options';
import { CheckField, NumberField, RadioGroup, SelectField, TextField } from './fields';
import { Bridge, DemoToast, RecheckScreen, StatusReadout } from './live';

const LOG_LIMIT = 12;

const TRI = [
  { value: 'default', label: 'Library default' },
  { value: 'yes', label: 'Dismissible' },
  { value: 'no', label: 'Not dismissible' },
] as const;

export function Demo() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [offline, setOffline] = useState(false);
  const [kind, setKind] = useState('no-internet' as Exclude<Simulation, 'online'>);
  const [log, setLog] = useState([] as string[]);
  const [controller] = useState(() =>
    createDemoController(DEFAULT_OPTIONS.stubLatencyMs),
  );

  const set = useCallback(
    <K extends keyof DemoOptions>(key: K, value: DemoOptions[K]) =>
      setOptions((current) => ({ ...current, [key]: value })),
    [],
  );

  const record = useCallback(
    (line: string) => setLog((current) => [line, ...current].slice(0, LOG_LIMIT)),
    [],
  );

  useEffect(() => {
    controller.onProbe = record;
  }, [controller, record]);

  useEffect(() => {
    controller.setLatency(options.stubLatencyMs);
  }, [controller, options.stubLatencyMs]);

  // The page follows a forced colour scheme too; `auto` leaves it to prefers-color-scheme.
  useEffect(() => {
    const root = document.documentElement;
    if (options.colorScheme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = options.colorScheme;
    return () => {
      delete root.dataset.theme;
    };
  }, [options.colorScheme]);

  // A remount (probe settings changed) starts a fresh detector, so the simulation starts over.
  const key = mountKey(options);
  useEffect(() => {
    setOffline(false);
    controller.simulate('online');
  }, [controller, key]);

  const simulate = (nextOffline: boolean, nextKind: Exclude<Simulation, 'online'>) => {
    setOffline(nextOffline);
    setKind(nextKind);
    controller.simulate(nextOffline ? nextKind : 'online');
  };

  const detectorProps = useMemo(() => buildDetectorProps(options), [options]);

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">@rogeriodocarmo/offline-detector-web</p>
        <h1>offline-detector web demo</h1>
        <p className="lede">
          The app starts online and shows nothing. Use <strong>Simulate offline</strong>{' '}
          below to see the snackbar, banner and indicator, then change any option and
          watch it apply. Simulation uses a stub probe, so nothing here contacts the
          network. Real offline works too: switch the network off in your browser&apos;s
          DevTools.
        </p>
      </header>

      <main>
        <section aria-labelledby="simulate-heading" className="card">
          <h2 id="simulate-heading">Simulate</h2>
          <div className="row">
            <button
              type="button"
              className="primary"
              aria-pressed={offline}
              onClick={() => simulate(!offline, kind)}
            >
              {offline ? 'Simulate online' : 'Simulate offline'}
            </button>
            <RadioGroup
              legend="Kind of offline"
              name="kind"
              value={kind}
              options={[
                { value: 'no-internet', label: 'Connected, but no internet' },
                { value: 'no-interface', label: 'No network connection' },
              ]}
              onChange={(next) => simulate(offline, next)}
              hint="Only visible in the message when Distinguish the reason is on."
            />
          </div>
        </section>

        <OfflineDetector
          key={key}
          {...detectorProps}
          adapter={controller.adapter}
          fetch={options.realProbe ? undefined : controller.fetch}
          slots={options.customSnackbar ? { snackbar: DemoToast } : undefined}
          onOffline={(state: OfflineState) =>
            record(`onOffline (${state.reason ?? 'unknown'})`)
          }
          onOnline={() => record('onOnline')}
          onChange={(state: OfflineState, previous: OfflineState) =>
            record(`onChange: ${previous.status} to ${state.status}`)
          }
          onDismiss={(piece) => record(`onDismiss: ${piece}`)}
          onError={(error) => record(`onError: ${String(error)}`)}
        >
          <Bridge controller={controller} />
          <section aria-labelledby="live-heading" className="card">
            <h2 id="live-heading">Live state</h2>
            <StatusReadout />
          </section>

          <section aria-labelledby="recheck-heading" className="card">
            <h2 id="recheck-heading">Re-check on return</h2>
            <p>
              Re-probing when the user comes back to the tab is opt-in per screen, with{' '}
              <code>useRecheckOnReturn</code>. With <code>brief</code> the pieces show a
              short &ldquo;Checking&hellip;&rdquo; while that background probe runs; with{' '}
              <code>none</code> it stays invisible.
            </p>
            <div className="grid">
              <CheckField
                label="Mount the screen that uses the hook"
                checked={options.recheckScreen}
                onChange={(value) => set('recheckScreen', value)}
              />
              <SelectField
                label="checkingFeedback"
                value={options.checkingFeedback}
                options={[
                  { value: 'brief', label: 'brief' },
                  { value: 'none', label: 'none' },
                ]}
                onChange={(value) => set('checkingFeedback', value)}
              />
              <NumberField
                label="Stub probe latency (ms)"
                value={options.stubLatencyMs}
                step={100}
                onChange={(value) => set('stubLatencyMs', value)}
                hint="How long the stub takes to answer, so Checking is visible."
              />
            </div>
            {options.recheckScreen ? (
              <RecheckScreen
                checkingFeedback={options.checkingFeedback}
                onResult={(online) =>
                  record(`useRecheckOnReturn result: ${online ? 'online' : 'offline'}`)
                }
              />
            ) : null}
          </section>
        </OfflineDetector>

        <section aria-labelledby="options-heading" className="card">
          <h2 id="options-heading">Options</h2>

          <fieldset className="group">
            <legend>Text</legend>
            <div className="grid">
              <SelectField
                label="locale"
                value={options.locale}
                options={[
                  { value: 'en', label: 'English (en)' },
                  { value: 'pt-BR', label: 'Português (pt-BR)' },
                  { value: 'es', label: 'Español (es)' },
                ]}
                onChange={(value) => set('locale', value)}
              />
              <CheckField
                label="distinguishReason"
                checked={options.distinguishReason}
                onChange={(value) => set('distinguishReason', value)}
                hint="Say what is wrong instead of plain No internet."
              />
              <TextField
                label="strings.retry (override)"
                value={options.retryLabel}
                placeholder="Retry"
                onChange={(value) => set('retryLabel', value)}
                hint="Any string can be overridden; this one changes the Retry button."
              />
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>Look and motion</legend>
            <div className="grid">
              <SelectField
                label="colorScheme"
                value={options.colorScheme}
                options={[
                  { value: 'auto', label: 'auto (follow the system)' },
                  { value: 'light', label: 'light' },
                  { value: 'dark', label: 'dark' },
                ]}
                onChange={(value) => set('colorScheme', value)}
              />
              <SelectField
                label="motion"
                value={options.motion}
                options={[
                  { value: 'auto', label: 'auto (prefers-reduced-motion)' },
                  { value: 'reduced', label: 'reduced' },
                  { value: 'full', label: 'full' },
                ]}
                onChange={(value) => set('motion', value)}
              />
              <NumberField
                label="recoveryMs"
                value={options.recoveryMs}
                step={500}
                onChange={(value) => set('recoveryMs', value)}
                hint="How long Back online stays."
              />
              <CheckField
                label="Custom snackbar (slots.snackbar)"
                checked={options.customSnackbar}
                onChange={(value) => set('customSnackbar', value)}
                hint="Replaces the bundled snackbar with the component in this demo."
              />
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>Pieces</legend>
            <div className="grid">
              <RadioGroup
                legend="fullScreen"
                name="fullScreen"
                value={options.fullScreen}
                options={[
                  { value: 'off', label: 'Off' },
                  { value: 'on', label: 'On' },
                  { value: 'continue', label: 'On, with Continue offline' },
                ]}
                onChange={(value) => set('fullScreen', value)}
              />
              <CheckField
                label="dismissible (global)"
                checked={options.dismissible}
                onChange={(value) => set('dismissible', value)}
                hint="Swipe, Dismiss button and Escape on the indicator."
              />
              <SelectField
                label="snackbar.dismissible"
                value={options.snackbarDismissible}
                options={TRI}
                onChange={(value) => set('snackbarDismissible', value)}
              />
              <SelectField
                label="banner.dismissible"
                value={options.bannerDismissible}
                options={TRI}
                onChange={(value) => set('bannerDismissible', value)}
              />
              <SelectField
                label="indicator.dismissible"
                value={options.indicatorDismissible}
                options={TRI}
                onChange={(value) => set('indicatorDismissible', value)}
              />
              <CheckField
                label="banner.overlay"
                checked={options.bannerOverlay}
                onChange={(value) => set('bannerOverlay', value)}
                hint="Float the banner over the content."
              />
              <SelectField
                label="indicator.position"
                value={options.indicatorPosition}
                options={[
                  { value: 'default', label: 'Library default (top-end)' },
                  { value: 'top-start', label: 'top-start' },
                  { value: 'top-end', label: 'top-end' },
                  { value: 'bottom-start', label: 'bottom-start' },
                  { value: 'bottom-end', label: 'bottom-end' },
                ]}
                onChange={(value) => set('indicatorPosition', value)}
              />
              <SelectField
                label="indicator.variant"
                value={options.indicatorVariant}
                options={[
                  { value: 'auto', label: 'Library default (auto)' },
                  { value: 'chip', label: 'chip' },
                  { value: 'dot', label: 'dot' },
                ]}
                onChange={(value) => set('indicatorVariant', value)}
              />
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>Probe (restarts the detector when changed)</legend>
            <div className="grid">
              <TextField
                label="probe.urls (one per line)"
                value={options.probeUrls}
                multiline
                onChange={(value) => set('probeUrls', value)}
                hint="Tried in order; the first success wins. Not contacted while the stub is on."
              />
              <NumberField
                label="probe.intervalMs"
                value={options.probeIntervalMs}
                step={1000}
                min={1000}
                onChange={(value) => set('probeIntervalMs', value)}
              />
              <NumberField
                label="probe.timeoutMs"
                value={options.probeTimeoutMs}
                step={500}
                min={500}
                onChange={(value) => set('probeTimeoutMs', value)}
              />
              <SelectField
                label="probe.method"
                value={options.probeMethod}
                options={[
                  { value: 'HEAD', label: 'HEAD' },
                  { value: 'GET', label: 'GET' },
                ]}
                onChange={(value) => set('probeMethod', value)}
              />
              <SelectField
                label="probe.mode"
                value={options.probeMode}
                options={[
                  { value: 'probe', label: 'probe' },
                  {
                    value: 'interface-only',
                    label: 'interface-only (never calls fetch)',
                  },
                ]}
                onChange={(value) => set('probeMode', value)}
                hint="With interface-only, only the Simulate kind No network connection works."
              />
              <SelectField
                label="initialStatus (SSR hint)"
                value={options.initialStatus}
                options={[
                  { value: 'unknown', label: 'not set' },
                  { value: 'online', label: 'online' },
                  { value: 'offline', label: 'offline' },
                ]}
                onChange={(value) => set('initialStatus', value)}
              />
              <CheckField
                label="Use the real network probe"
                checked={options.realProbe}
                onChange={(value) => set('realProbe', value)}
                hint="Off by default. When on, the library contacts the probe URLs above, and Simulate only affects the network interface."
              />
            </div>
          </fieldset>

          <button
            type="button"
            className="secondary"
            onClick={() => setOptions(DEFAULT_OPTIONS)}
          >
            Reset all options
          </button>
        </section>

        <section aria-labelledby="log-heading" className="card">
          <h2 id="log-heading">Callbacks</h2>
          <p>
            <code>onOffline</code>, <code>onOnline</code>, <code>onChange</code>,{' '}
            <code>onDismiss</code> and <code>onError</code> write here, newest first.
          </p>
          {log.length === 0 ? (
            <p className="hint">Nothing yet.</p>
          ) : (
            <div role="log" aria-label="Callback log" aria-live="off">
              <ol className="log">
                {log.map((line, index) => (
                  <li key={`${log.length - index}-${line}`}>{line}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          The only network traffic is the configurable reachability probe.{' '}
          <a href="https://github.com/RogerioDoCarmo/offline-detector/blob/main/PRIVACY.md">
            Privacy
          </a>
          {' · '}
          <a href="/offline-detector/">Documentation</a>
          {' · '}
          <a href="https://github.com/RogerioDoCarmo/offline-detector">Source</a>
        </p>
      </footer>
    </div>
  );
}
