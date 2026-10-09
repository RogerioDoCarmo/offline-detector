import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRecheckOnReturn } from '@rogeriodocarmo/offline-detector-react';
import type { PieceRenderProps } from '@rogeriodocarmo/offline-detector-react';
import { OfflineDetector } from './offline-detector';
import type { OfflineDetectorProps } from './offline-detector';
import { createFakeAdapter, createFakeFetch, PROBE } from '../test-utils/fakes';
import { FRAME } from '../test-utils';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

const settle = () =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(0);
  });
const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

const $ = (selector: string) => document.querySelector(selector);
const snackbar = () => $('.od-snackbar');
const banner = () => $('.od-banner');
const indicator = () => $('.od-indicator');
const fullScreen = () => $('.od-fullscreen');

/** Presses a piece's Dismiss button and lets its 150 ms exit animation finish. */
async function dismiss(piece: Element | null) {
  fireEvent.click(
    must(piece).querySelector('button[aria-label="Dismiss"]') as HTMLElement,
  );
  await advance(200);
}

function must(element: Element | null): Element {
  if (!element) throw new Error('expected the element to be present');
  return element;
}

function Recheck({ feedback }: { feedback: 'brief' | 'none' }) {
  useRecheckOnReturn({ checkingFeedback: feedback });
  return null;
}

async function mount(
  props: Partial<OfflineDetectorProps> & { up?: boolean; children?: ReactNode } = {},
) {
  const { up = true, children, ...rest } = props;
  const fake = createFakeAdapter(up);
  const fetch = createFakeFetch();
  const view = render(
    <OfflineDetector adapter={fake.adapter} probe={PROBE} fetch={fetch} {...rest}>
      {children ?? <h1>Host app</h1>}
    </OfflineDetector>,
  );
  await settle();
  const goOffline = async () => {
    act(() => fake.setUp(false));
    await settle();
  };
  const goOnline = async () => {
    act(() => fake.setUp(true));
    await settle();
  };
  return { ...view, fake, fetch, goOffline, goOnline };
}

describe('OfflineDetector: launch', () => {
  it('shows nothing when the app launches online, and never "Back online"', async () => {
    await mount();
    expect(screen.getByText('Host app')).toBeInTheDocument();
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
    expect(fullScreen()).toBeNull();
    expect(screen.queryByText('Back online')).toBeNull();
    await advance(10_000);
    expect(screen.queryByText('Back online')).toBeNull();
  });

  it('shows the pieces when the app launches offline', async () => {
    await mount({ up: false });
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('No internet');
    expect(banner()).toHaveTextContent('No internet');
    expect(indicator()).not.toBeNull();
  });

  it('renders one style element with the tokens', async () => {
    await mount();
    expect(document.querySelectorAll('style[data-od-tokens]')).toHaveLength(1);
  });

  it('passes a CSP nonce to the style element', async () => {
    await mount({ nonce: 'abc123' });
    expect($('style[data-od-tokens]')).toHaveAttribute('nonce', 'abc123');
  });

  it('puts no nonce on the style element by default', async () => {
    await mount();
    expect($('style[data-od-tokens]')).not.toHaveAttribute('nonce');
  });
});

describe('OfflineDetector: going offline', () => {
  it('shows snackbar, banner and indicator with the literal text "No internet"', async () => {
    const view = await mount();
    await view.goOffline();

    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('No internet');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(banner()).toHaveTextContent('No internet');
    expect(indicator()).not.toBeNull();
    expect(
      screen.getByRole('img', { name: 'Connection status: No internet' }),
    ).toBeInTheDocument();
    expect(fullScreen()).toBeNull();
  });

  it('has exactly one live region: the snackbar announces, the banner is a landmark', async () => {
    const view = await mount();
    await view.goOffline();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(snackbar()).toHaveAttribute('role', 'status');
    expect(banner()).toHaveAttribute('role', 'region');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says "No internet" for every reason by default', async () => {
    const view = await mount();
    view.fetch.setOk(false);
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('No internet');
    expect(snackbar()).not.toHaveTextContent('Connected');
  });

  it('with distinguishReason names a missing interface', async () => {
    const view = await mount({ distinguishReason: true });
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('No network connection');
  });

  it('with distinguishReason names a reachable network without internet', async () => {
    const view = await mount({ distinguishReason: true });
    view.fetch.setOk(false);
    await act(async () => {
      view.fake.setUp(true);
      await jest.advanceTimersByTimeAsync(PROBE.intervalMs);
    });
    await settle();
    expect(snackbar()).toHaveTextContent('Connected, but no internet');
  });
});

describe('OfflineDetector: dismissing', () => {
  it('dismissing one piece leaves the others, and onDismiss fires once after dismiss', async () => {
    const onDismiss = jest.fn();
    const view = await mount({ onDismiss });
    await view.goOffline();

    await dismiss(snackbar());

    expect(snackbar()).toBeNull();
    expect(banner()).not.toBeNull();
    expect(indicator()).not.toBeNull();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith('snackbar');
  });

  it('hands the live region to the banner once the snackbar is gone, and gives it Retry', async () => {
    const view = await mount();
    await view.goOffline();
    await dismiss(snackbar());
    expect(banner()).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('brings every piece back after the next transition', async () => {
    const view = await mount();
    await view.goOffline();
    await dismiss(snackbar());
    await dismiss(banner());
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();

    await view.goOnline();
    await view.goOffline();

    expect(snackbar()).not.toBeNull();
    expect(banner()).not.toBeNull();
    expect(indicator()).not.toBeNull();
  });

  it('shows the recovery snackbar even after the offline snackbar was dismissed', async () => {
    const view = await mount();
    await view.goOffline();
    await dismiss(snackbar());
    await view.goOnline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Back online');
  });

  it('offers no dismiss action where dismissible is false', async () => {
    const view = await mount({
      dismissible: true,
      banner: { dismissible: false },
      indicator: { dismissible: false },
    });
    await view.goOffline();
    expect(must(snackbar()).querySelector('button[aria-label="Dismiss"]')).not.toBeNull();
    expect(must(banner()).querySelector('button[aria-label="Dismiss"]')).toBeNull();
    expect(must(indicator()).querySelector('[tabindex]')).toBeNull();
  });

  it('offers no dismiss action anywhere with dismissible false', async () => {
    const view = await mount({ dismissible: false });
    await view.goOffline();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });
});

describe('OfflineDetector: recovery', () => {
  it('shows "Back online" for exactly 4000 ms by default, then clears everything', async () => {
    const view = await mount();
    await view.goOffline();
    await view.goOnline();

    expect(snackbar()).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).not.toBeNull();

    await advance(3999);
    expect(snackbar()).toHaveTextContent('Back online');
    await advance(1);
    expect(snackbar()).toBeNull();
    expect(indicator()).toBeNull();
  });

  it('honours recoveryMs', async () => {
    const view = await mount({ recoveryMs: 1000 });
    await view.goOffline();
    await view.goOnline();
    await advance(999);
    expect(snackbar()).not.toBeNull();
    await advance(1);
    expect(snackbar()).toBeNull();
  });

  it('pauses the timer while the snackbar is hovered and resumes with the remainder', async () => {
    const view = await mount({ recoveryMs: 1000 });
    await view.goOffline();
    await view.goOnline();
    await advance(900);

    fireEvent.mouseEnter(must(snackbar()));
    await advance(5000);
    expect(snackbar()).toHaveTextContent('Back online');

    fireEvent.mouseLeave(must(snackbar()));
    await advance(99);
    expect(snackbar()).not.toBeNull();
    await advance(1);
    expect(snackbar()).toBeNull();
  });

  it('a second offline transition during recovery replaces the recovery message', async () => {
    const view = await mount();
    await view.goOffline();
    await view.goOnline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Back online');
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('No internet');
    expect(banner()).not.toBeNull();
    await advance(10_000);
    expect(snackbar()).toHaveTextContent('No internet');
  });
});

describe('OfflineDetector: full-screen', () => {
  it('is off by default', async () => {
    const view = await mount();
    await view.goOffline();
    expect(fullScreen()).toBeNull();
  });

  it('opt-in shows it offline and suppresses banner, indicator and the offline snackbar', async () => {
    const view = await mount({ fullScreen: true });
    await view.goOffline();
    expect(fullScreen()).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'No internet' })).toBeInTheDocument();
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue offline' })).toBeNull();
  });

  it('"Continue offline" hides only the full-screen state until the next transition', async () => {
    const view = await mount({ fullScreen: { continueOffline: true } });
    await view.goOffline();
    fireEvent.click(screen.getByRole('button', { name: 'Continue offline' }));

    expect(fullScreen()).toBeNull();
    expect(banner()).not.toBeNull();
    expect(snackbar()).not.toBeNull();

    await view.goOnline();
    await view.goOffline();
    expect(fullScreen()).not.toBeNull();
  });

  it('the recovery snackbar shows after the full-screen state closes', async () => {
    const view = await mount({ fullScreen: true });
    await view.goOffline();
    await view.goOnline();
    expect(fullScreen()).toBeNull();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Back online');
  });

  it('Retry in the full-screen state checks now', async () => {
    const view = await mount({ fullScreen: true });
    view.fetch.setOk(false);
    await view.goOffline();
    view.fetch.hold();
    view.fake.setUp(true);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('button', { name: /Checking/ })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});

describe('OfflineDetector: slots', () => {
  const Slot = (name: string) =>
    function Slot(props: PieceRenderProps) {
      return (
        <div data-testid={name}>
          {props.message}|{props.phase}|{props.state.status}|
          {typeof props.actions.dismiss}|{typeof props.actions.retry}|
          {props.strings.retry}|{String(props.visible)}
        </div>
      );
    };

  it('replace their piece entirely and receive the render props', async () => {
    const view = await mount({
      slots: {
        snackbar: Slot('s'),
        banner: Slot('b'),
        indicator: Slot('i'),
      },
    });
    await view.goOffline();
    expect(screen.getByTestId('s')).toHaveTextContent(
      'No internet|offline|offline|function|function|Retry|true',
    );
    expect(screen.getByTestId('b')).toBeInTheDocument();
    expect(screen.getByTestId('i')).toBeInTheDocument();
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
    expect(document.querySelectorAll('style[data-od-tokens]')).toHaveLength(1);
  });

  it('the full-screen slot receives continueOffline only when opted in', async () => {
    const Full = (props: PieceRenderProps) => (
      <div data-testid="f">{typeof props.actions.continueOffline}</div>
    );
    const view = await mount({
      fullScreen: { continueOffline: true },
      slots: { fullScreen: Full },
    });
    await view.goOffline();
    expect(screen.getByTestId('f')).toHaveTextContent('function');
    expect(fullScreen()).toBeNull();
  });

  it('a slot gets no dismiss action when the piece is not dismissible', async () => {
    const view = await mount({
      snackbar: { dismissible: false },
      slots: { snackbar: Slot('s') },
    });
    await view.goOffline();
    expect(screen.getByTestId('s')).toHaveTextContent(
      'No internet|offline|offline|undefined',
    );
  });

  it('a slot can dismiss through its action', async () => {
    const view = await mount({
      slots: {
        snackbar: (props: PieceRenderProps) => (
          <button type="button" onClick={props.actions.dismiss}>
            custom dismiss
          </button>
        ),
      },
    });
    await view.goOffline();
    fireEvent.click(screen.getByRole('button', { name: 'custom dismiss' }));
    expect(screen.queryByRole('button', { name: 'custom dismiss' })).toBeNull();
  });
});

describe('OfflineDetector: copy', () => {
  it('speaks pt-BR', async () => {
    const view = await mount({ locale: 'pt-BR' });
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Sem internet');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
    await view.goOnline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Conexão restabelecida');
  });

  it('speaks es', async () => {
    const view = await mount({ locale: 'es-MX' });
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Sin internet');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    await view.goOnline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Conexión restablecida');
  });

  it('applies string overrides', async () => {
    const view = await mount({ strings: { offline: 'Offline!', retry: 'Again' } });
    await view.goOffline();
    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Offline!');
    expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
  });
});

describe('OfflineDetector: callbacks', () => {
  it('fires onOffline, onOnline and onChange once per transition', async () => {
    const onOffline = jest.fn();
    const onOnline = jest.fn();
    const onChange = jest.fn();
    const view = await mount({ onOffline, onOnline, onChange });
    expect(onChange).toHaveBeenCalledTimes(1);

    await view.goOffline();
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onOnline).not.toHaveBeenCalled();

    await view.goOnline();
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onOffline.mock.calls.at(0)?.at(0)).toMatchObject({
      status: 'offline',
      reason: 'no-interface',
    });
  });

  it('forwards onError', async () => {
    const onError = jest.fn();
    const boom = new Error('boom');
    const view = await mount({
      onError,
      onOffline: () => {
        throw boom;
      },
    });
    await view.goOffline();
    expect(onError).toHaveBeenCalledWith(boom);
  });
});

describe('OfflineDetector: checking feedback', () => {
  it('a pressed Retry shows the checking state immediately', async () => {
    const view = await mount();
    view.fetch.setOk(false);
    await view.goOffline();
    view.fake.setUp(true); // interface back, but the probe still fails
    await settle();
    view.fetch.hold();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    const busy = screen.getByRole('button', { name: /Checking/ });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(banner()).toHaveTextContent('No internet');
    // Not even a 150 ms wait happened.
    view.fetch.release();
    await settle();
    await advance(400);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('a successful Retry recovers', async () => {
    const view = await mount();
    view.fetch.setOk(false);
    await view.goOffline();
    view.fake.setUp(true);
    await settle();
    view.fetch.setOk(true);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await settle();

    await advance(FRAME);
    expect(snackbar()).toHaveTextContent('Back online');
  });

  it('a background check shows nothing when no screen asked for feedback', async () => {
    const view = await mount({ children: <Recheck feedback="none" /> });
    view.fetch.setOk(false);
    await view.goOffline();
    view.fake.setUp(true);
    await settle();
    view.fetch.hold();
    act(() => view.fake.foreground());
    await advance(1000);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByText('Checking…')).toBeNull();
  });

  it('useRecheckOnReturn({ checkingFeedback: "brief" }) shows Checking on a foreground return', async () => {
    const view = await mount({ children: <Recheck feedback="brief" /> });
    view.fetch.setOk(false);
    await view.goOffline();
    view.fake.setUp(true);
    await settle();
    view.fetch.hold();

    act(() => view.fake.foreground());
    await advance(150);

    expect(screen.getByRole('button', { name: /Checking/ })).toBeInTheDocument();

    view.fetch.release();
    await settle();
    await advance(400);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('a brief check while online shows nothing at all', async () => {
    const view = await mount({ children: <Recheck feedback="brief" /> });
    view.fetch.hold();
    act(() => view.fake.foreground());
    await advance(1000);
    expect(snackbar()).toBeNull();
    expect(banner()).toBeNull();
    expect(indicator()).toBeNull();
  });
});

describe('OfflineDetector: options', () => {
  it('adds no wrapper for colorScheme auto', async () => {
    const view = await mount();
    expect(document.querySelector('[data-od-theme]')).toBeNull();
    expect(view.container.firstElementChild?.tagName).toBe('STYLE');
  });

  it.each(['light', 'dark'] as const)('wraps in data-od-theme=%s', async (scheme) => {
    const view = await mount({ colorScheme: scheme });
    const wrapper = document.querySelector('[data-od-theme]');
    expect(wrapper).toHaveAttribute('data-od-theme', scheme);
    expect(wrapper).toContainElement(screen.getByText('Host app'));
    await view.goOffline();
    expect(wrapper).toContainElement(snackbar() as HTMLElement);
  });

  it('passes motion to the pieces', async () => {
    const view = await mount({ motion: 'reduced' });
    await view.goOffline();
    expect(snackbar()).toHaveAttribute('data-od-motion', 'reduced');
    expect(banner()).toHaveAttribute('data-od-motion', 'reduced');
  });

  it('uses the dot indicator when the banner is shown and the chip otherwise', async () => {
    const view = await mount();
    await view.goOffline();
    expect(must(indicator()).querySelector('.od-dot-target')).not.toBeNull();
    await dismiss(banner());
    expect(must(indicator()).querySelector('.od-chip')).not.toBeNull();
  });

  it('honours indicator variant and position', async () => {
    const view = await mount({
      indicator: { variant: 'chip', position: 'bottom-start' },
    });
    await view.goOffline();
    expect(indicator()).toHaveClass('od-pos-bottom-start');
    expect(must(indicator()).querySelector('.od-chip')).not.toBeNull();
  });

  it('honours banner overlay', async () => {
    const view = await mount({ banner: { overlay: true } });
    await view.goOffline();
    expect(banner()).toHaveAttribute('data-od-overlay');
  });

  it('uses the fetch it is given instead of the web probe fetch', async () => {
    const view = await mount();
    expect(view.fetch.calls).toEqual(['https://a.test']);
  });

  it('defaults to the web adapter and probe fetch', async () => {
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      calls.push(url);
      return Promise.resolve({ ok: false, type: 'opaque' });
    }) as unknown as typeof fetch;
    try {
      render(
        <OfflineDetector probe={{ urls: ['https://b.test'] }}>
          <h1>Host app</h1>
        </OfflineDetector>,
      );
      await settle();
      expect(calls).toEqual(['https://b.test']);
      expect(snackbar()).toBeNull();
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          value: false,
          configurable: true,
        });
        window.dispatchEvent(new Event('offline'));
      });
      await settle();
      await advance(FRAME);
      expect(snackbar()).toHaveTextContent('No internet');
    } finally {
      globalThis.fetch = original;
      delete (window.navigator as { onLine?: boolean }).onLine;
    }
  });
});

describe('OfflineDetector: StrictMode', () => {
  it('leaves exactly one detector: one listener set and one first probe', async () => {
    const fake = createFakeAdapter();
    const fetch = createFakeFetch();
    const view = render(
      <StrictMode>
        <OfflineDetector adapter={fake.adapter} probe={PROBE} fetch={fetch}>
          <h1>Host app</h1>
        </OfflineDetector>
      </StrictMode>,
    );
    await settle();
    expect(fake.interfaceListenerCount()).toBe(1);
    expect(fetch.calls).toEqual(['https://a.test']);
    expect(document.querySelectorAll('style[data-od-tokens]')).toHaveLength(1);

    act(() => fake.setUp(false));
    await settle();
    expect(document.querySelectorAll('.od-snackbar')).toHaveLength(1);
    expect(document.querySelectorAll('.od-banner')).toHaveLength(1);
    expect(document.querySelectorAll('.od-indicator')).toHaveLength(1);

    view.unmount();
    await settle();
    expect(fake.interfaceListenerCount()).toBe(0);
  });
});
