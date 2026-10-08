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
  currentState?: string;
  addEventListener(type: 'change', listener: (state: string) => void): { remove(): void };
}

export interface NativeAdapterOptions {
  /**
   * Defaults to a lazy `require('@react-native-community/netinfo')`. Pass `null` to run without
   * it: the interface is then always reported up and the probe decides.
   */
  netInfo?: NetInfoLike | null;
  /** Defaults to react-native's `AppState`. */
  appState?: AppStateLike;
}

const MISSING_NETINFO_WARNING =
  '[offline-detector] @react-native-community/netinfo is not installed. The network interface is ' +
  'assumed to be up and only the reachability probe decides. Install it for instant offline detection.';

let warnedAboutNetInfo = false;

function warnMissingNetInfoOnce(): void {
  if (warnedAboutNetInfo) return;
  warnedAboutNetInfo = true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(MISSING_NETINFO_WARNING);
  }
}

function loadNetInfo(): NetInfoLike | null {
  try {
    // A literal specifier on purpose: Metro resolves it statically and treats a require inside
    // try/catch as optional.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-community/netinfo') as {
      default?: NetInfoLike;
    } & NetInfoLike;
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * The native platform adapter. Interface up means `isConnected !== false`; a foreground return is
 * an AppState change from `background` or `inactive` to `active`.
 */
export function createNativeAdapter(options: NativeAdapterOptions = {}): PlatformAdapter {
  const netInfo = options.netInfo === undefined ? loadNetInfo() : options.netInfo;
  const appState: AppStateLike = options.appState ?? AppState;
  if (netInfo === null) warnMissingNetInfoOnce();

  return {
    isInterfaceUp() {
      if (netInfo === null) return true;
      return netInfo.fetch().then((state) => state.isConnected !== false);
    },
    subscribeInterface(listener) {
      if (netInfo === null) return () => undefined;
      return netInfo.addEventListener((state) => listener(state.isConnected !== false));
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
