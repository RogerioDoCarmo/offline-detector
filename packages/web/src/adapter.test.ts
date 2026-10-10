import { createWebAdapter } from './adapter';

type Handler = () => void;

function fakeTarget(extra: Record<string, unknown> = {}) {
  const handlers: Map<string, Set<Handler>> = new Map();
  return {
    ...extra,
    handlers,
    addEventListener(type: string, fn: Handler) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)?.add(fn);
    },
    removeEventListener(type: string, fn: Handler) {
      handlers.get(type)?.delete(fn);
    },
    fire(type: string) {
      for (const fn of [...(handlers.get(type) ?? [])]) fn();
    },
    count(type: string) {
      return handlers.get(type)?.size ?? 0;
    },
  };
}

function setup(onLine = true, visibilityState: 'visible' | 'hidden' = 'visible') {
  const win = fakeTarget();
  const doc = fakeTarget({ visibilityState });
  const nav = { onLine };
  const adapter = createWebAdapter({
    window: win as never,
    document: doc as never,
    navigator: nav as never,
  });
  return { win, doc, nav, adapter };
}

describe('createWebAdapter: interface', () => {
  it('reports the interface up from navigator.onLine', () => {
    expect(setup(true).adapter.isInterfaceUp()).toBe(true);
    expect(setup(false).adapter.isInterfaceUp()).toBe(false);
  });

  it('reads navigator.onLine at call time, not at creation', () => {
    const { adapter, nav } = setup(true);
    nav.onLine = false;
    expect(adapter.isInterfaceUp()).toBe(false);
  });

  it('reports up when navigator is missing', () => {
    const adapter = createWebAdapter({ window: fakeTarget() as never });
    expect(adapter.isInterfaceUp()).toBe(true);
  });

  it('maps window online and offline events to true and false', () => {
    const { adapter, win } = setup();
    const seen: boolean[] = [];
    adapter.subscribeInterface((up) => seen.push(up));
    win.fire('offline');
    win.fire('online');
    expect(seen).toEqual([false, true]);
  });

  it('drops an immediately repeated identical interface event', () => {
    const { adapter, win } = setup();
    const seen: boolean[] = [];
    adapter.subscribeInterface((up) => seen.push(up));
    win.fire('offline');
    win.fire('offline');
    win.fire('online');
    win.fire('online');
    win.fire('offline');
    expect(seen).toEqual([false, true, false]);
  });

  it('removes both listeners on unsubscribe', () => {
    const { adapter, win } = setup();
    const seen: boolean[] = [];
    const unsubscribe = adapter.subscribeInterface((up) => seen.push(up));
    expect(win.count('online')).toBe(1);
    expect(win.count('offline')).toBe(1);
    unsubscribe();
    expect(win.count('online')).toBe(0);
    expect(win.count('offline')).toBe(0);
    win.fire('offline');
    expect(seen).toEqual([]);
  });
});

describe('createWebAdapter: foreground', () => {
  it('calls back once when visibilitychange(visible) and focus both signal one return', () => {
    const { adapter, win, doc } = setup(true, 'hidden');
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    win.fire('blur');
    doc.fire('visibilitychange'); // still hidden: ignored
    expect(listener).toHaveBeenCalledTimes(0);
    (doc as unknown as { visibilityState: string }).visibilityState = 'visible';
    doc.fire('visibilitychange');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('calls back again on a second, separate return', () => {
    const { adapter, win } = setup();
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    win.fire('blur');
    win.fire('focus');
    win.fire('blur');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not call back for a focus that was never preceded by leaving', () => {
    const { adapter, win } = setup();
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('treats the page becoming hidden as leaving', () => {
    const { adapter, doc } = setup();
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    (doc as unknown as { visibilityState: string }).visibilityState = 'hidden';
    doc.fire('visibilitychange');
    (doc as unknown as { visibilityState: string }).visibilityState = 'visible';
    doc.fire('visibilitychange');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores focus moving into an embedded iframe and back (card-field iframes)', () => {
    const { adapter, win, doc } = setup();
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    const frame = { tagName: 'IFRAME' };
    const input = { tagName: 'INPUT' };
    const active = (element: unknown) => {
      (doc as unknown as { activeElement: unknown }).activeElement = element;
    };

    // Click a card number field in an iframe, then the page's own input, then the iframe again.
    for (let round = 0; round < 3; round += 1) {
      active(frame);
      win.fire('blur');
      active(input);
      win.fire('focus');
    }
    expect(listener).toHaveBeenCalledTimes(0);

    // A genuine departure and return still counts, exactly once.
    (doc as unknown as { visibilityState: string }).visibilityState = 'hidden';
    doc.fire('visibilitychange');
    (doc as unknown as { visibilityState: string }).visibilityState = 'visible';
    doc.fire('visibilitychange');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('still counts a window blur when the focused element is not an iframe', () => {
    const { adapter, win, doc } = setup();
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    (doc as unknown as { activeElement: unknown }).activeElement = { tagName: 'BUTTON' };
    win.fire('blur');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('works with only a window (no document)', () => {
    const win = fakeTarget();
    const adapter = createWebAdapter({ window: win as never });
    const listener = jest.fn();
    adapter.subscribeForeground(listener);
    win.fire('blur');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('removes every listener on unsubscribe', () => {
    const { adapter, win, doc } = setup();
    const listener = jest.fn();
    const unsubscribe = adapter.subscribeForeground(listener);
    expect(win.count('focus')).toBe(1);
    expect(win.count('blur')).toBe(1);
    expect(doc.count('visibilitychange')).toBe(1);
    unsubscribe();
    expect(win.count('focus')).toBe(0);
    expect(win.count('blur')).toBe(0);
    expect(doc.count('visibilitychange')).toBe(0);
    win.fire('blur');
    win.fire('focus');
    expect(listener).toHaveBeenCalledTimes(0);
  });
});

describe('createWebAdapter: no window (SSR)', () => {
  it('is inert: interface up, no listeners, unsubscribe is a no-op', () => {
    const adapter = createWebAdapter({});
    const listener = jest.fn();
    expect(adapter.isInterfaceUp()).toBe(true);
    const a = adapter.subscribeInterface(listener);
    const b = adapter.subscribeForeground(listener);
    expect(typeof a).toBe('function');
    expect(typeof b).toBe('function');
    a();
    b();
    expect(listener).not.toHaveBeenCalled();
  });

  it('defaults to the real window when no env is given (jsdom here)', () => {
    const adapter = createWebAdapter();
    const seen: boolean[] = [];
    const off = adapter.subscribeInterface((up) => seen.push(up));
    window.dispatchEvent(new Event('offline'));
    off();
    expect(seen).toEqual([false]);
    expect(adapter.isInterfaceUp()).toBe(true);
  });
});
