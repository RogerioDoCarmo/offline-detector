// Stryker runs core and react in one jsdom environment, and jsdom does not define Node's
// setImmediate. Core's test helpers flush microtasks with it, so restore the real one.
if (typeof globalThis.setImmediate === 'undefined') {
  globalThis.setImmediate = require('node:timers').setImmediate;
}
