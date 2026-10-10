import type { PlatformAdapter } from '@rogeriodocarmo/offline-detector-core';
import { AppState } from 'react-native';

/** The slice of `@react-native-community/netinfo` the adapter uses. */
export interface NetInfoLike {
  fetch(): Promise<{ isConnected: boolean | null }>;
  addEventListener(
    listener: (state: { isConnected: boolean | null }) => void,
  ): () => void;
}

/** The slice of react-native's `AppState` the adapter uses. */
export interface AppStateLike {
  currentState?: string | null;
  addEventListener(type: 'change', listener: (state: string) => void): { remove(): void };
}

export interface NativeAdapterOptions {
  /**
   * The NetInfo module, passed in by the host: `import NetInfo from
   * '@react-native-community/netinfo'`. This package never requires it itself (a bundled
   * `require` can be hoisted out of its try/catch and turn the optional peer into a hard
   * dependency for Metro). Omit it, or pass `null`, to run without it: the interface is then
   * always reported up, the probe decides, and development builds warn once.
   */
  netInfo?: NetInfoLike | null;
  /** Defaults to react-native's `AppState`. */
  appState?: AppStateLike;
}

const MISSING_NETINFO_WARNING =
  '[offline-detector] No NetInfo module was passed. The network interface is assumed to be up ' +
  'and only the reachability probe decides. Install @react-native-community/netinfo and pass ' +
  'it as the `netInfo` option for instant offline detection.';

let warnedAboutNetInfo = false;

function warnMissingNetInfoOnce(): void {
  if (warnedAboutNetInfo) return;
  warnedAboutNetInfo = true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(MISSING_NETINFO_WARNING);
  }
}

/**
 * The native platform adapter. Interface up means `isConnected !== false`; a foreground return is
 * an AppState change from `background` or `inactive` to `active`.
 */
export function createNativeAdapter(options: NativeAdapterOptions = {}): PlatformAdapter {
  const netInfo = options.netInfo ?? null;
  const appState: AppStateLike = options.appState ?? AppState;
  if (netInfo === null) warnMissingNetInfoOnce();

  // What the interface was last known to be, from a read or from an event.
  let known: boolean | undefined;

  return {
    isInterfaceUp() {
      if (netInfo === null) return true;
      return netInfo.fetch().then((state) => {
        known = state.isConnected !== false;
        return known;
      });
    },
    subscribeInterface(listener) {
      if (netInfo === null) return () => undefined;
      // NetInfo delivers the current state right after subscribing, and may repeat a value. The
      // detector must hear changes only: the first delivery is a baseline (unless it already
      // contradicts a read), and a repeat is dropped.
      let seenFirst = false;
      return netInfo.addEventListener((state) => {
        const up = state.isConnected !== false;
        const baseline = !seenFirst && (known === undefined || known === up);
        seenFirst = true;
        if (baseline) {
          known = up;
          return;
        }
        if (known === up) return;
        known = up;
        listener(up);
      });
    },
    subscribeForeground(listener) {
      let previous = appState.currentState ?? 'active';
      const subscription = appState.addEventListener('change', (next) => {
        if ((previous === 'background' || previous === 'inactive') && next === 'active') {
          listener();
        }
        previous = next;
      });
      return () => subscription.remove();
    },
  };
}
