// A probe transport that never touches the network. "Simulate offline" makes it reject, which
// the detector reads as unreachable.

export interface StubProbe {
  fetch: (
    url: string,
    init: { method: string; signal: AbortSignal },
  ) => Promise<{ ok: boolean; type?: string }>;
  setOffline: (offline: boolean) => void;
  isOffline: () => boolean;
}

export function createStubProbe(): StubProbe {
  let offline = false;
  return {
    fetch: () =>
      offline
        ? Promise.reject(new Error('Simulated offline'))
        : Promise.resolve({ ok: true, type: 'basic' }),
    setOffline: (value) => {
      offline = value;
    },
    isOffline: () => offline,
  };
}
