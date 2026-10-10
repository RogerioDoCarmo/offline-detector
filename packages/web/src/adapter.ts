import type { PlatformAdapter } from '@rogeriodocarmo/offline-detector-core';

/** The browser globals the adapter reads. Injectable for tests; each defaults to the real global. */
export interface WebAdapterEnv {
  window?: Window;
  document?: Document;
  navigator?: Navigator;
}

/**
 * Resolved at call time, never at import or creation: importing this module (or creating an
 * adapter on the server) must not touch `window`, and an adapter created during SSR still works
 * once it runs in the browser.
 */
function resolve(env: WebAdapterEnv) {
  const hasWindow = typeof window !== 'undefined';
  const win = env.window ?? (hasWindow ? window : undefined);
  const doc = env.document ?? (win && hasWindow && win === window ? document : undefined);
  const nav = env.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  return { win, doc, nav };
}

const noop = () => {};

export function createWebAdapter(env: WebAdapterEnv = {}): PlatformAdapter {
  return {
    isInterfaceUp() {
      return resolve(env).nav?.onLine !== false;
    },

    subscribeInterface(listener) {
      const { win } = resolve(env);
      if (!win) return noop;
      let last: boolean | undefined;
      const emit = (up: boolean) => {
        // Some engines (and test helpers) raise the event twice; the detector hears it once.
        if (last === up) return;
        last = up;
        listener(up);
      };
      const onOnline = () => emit(true);
      const onOffline = () => emit(false);
      win.addEventListener('online', onOnline);
      win.addEventListener('offline', onOffline);
      return () => {
        win.removeEventListener('online', onOnline);
        win.removeEventListener('offline', onOffline);
      };
    },

    subscribeForeground(listener) {
      const { win, doc } = resolve(env);
      if (!win) return noop;
      // A return is announced by up to two events (visibilitychange and focus). Only the first
      // one after the app was left counts.
      let away = false;
      const leave = () => {
        away = true;
      };
      const back = () => {
        if (!away) return;
        away = false;
        listener();
      };
      // Focus moving into an embedded iframe (a card field, a captcha) blurs the window although
      // the user never left the page. At blur time the iframe is already the active element.
      const onBlur = () => {
        if (doc?.activeElement?.tagName === 'IFRAME') return;
        leave();
      };
      const onVisibility = () => {
        if (doc?.visibilityState === 'hidden') leave();
        else back();
      };
      win.addEventListener('blur', onBlur);
      win.addEventListener('focus', back);
      doc?.addEventListener('visibilitychange', onVisibility);
      return () => {
        win.removeEventListener('blur', onBlur);
        win.removeEventListener('focus', back);
        doc?.removeEventListener('visibilitychange', onVisibility);
      };
    },
  };
}
