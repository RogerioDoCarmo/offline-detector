import { StrictMode, useState } from 'react';
import type { ReactNode } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { OfflineDetectorProvider } from './provider';
import { useCheckingFeedback, useRecheckOnReturn } from './recheck';
import type { OfflineDetectorProviderProps, RecheckOnReturnOptions } from './types';
import {
  createAdapter,
  createFakeDetector,
  createFetch,
  PROBE,
  stateOf,
} from '../tests/helpers';

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

function Recheck(
  props: RecheckOnReturnOptions & { label?: string; onRender?: () => void },
) {
  props.onRender?.();
  const online = useRecheckOnReturn(props);
  return (
    <span data-testid={props.label ?? 'recheck'}>{online ? 'online' : 'offline'}</span>
  );
}

function Feedback() {
  return <span data-testid="feedback">{useCheckingFeedback()}</span>;
}

function setup(extra: Partial<OfflineDetectorProviderProps> = {}) {
  const adapter = createAdapter();
  const fetch = createFetch();
  const tree = (children: ReactNode) => (
    <OfflineDetectorProvider
      adapter={adapter.adapter}
      probe={PROBE}
      fetch={fetch}
      {...extra}
    >
      {children}
    </OfflineDetectorProvider>
  );
  return { adapter, fetch, tree };
}

describe('useRecheckOnReturn: subscription', () => {
  it('subscribes only while mounted', async () => {
    const { adapter, tree } = setup();
    const view = render(tree(<span />));
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(0);

    view.rerender(tree(<Recheck />));
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(1);

    view.rerender(tree(<span />));
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(0);
  });

  it('leaves exactly one subscription after a StrictMode double mount', async () => {
    const { adapter, tree } = setup();
    const view = render(<StrictMode>{tree(<Recheck />)}</StrictMode>);
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(1);
    view.unmount();
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(0);
  });

  it('does not resubscribe when only onResult changes', async () => {
    const { adapter, tree } = setup();
    const first = jest.fn();
    const second = jest.fn();
    const view = render(tree(<Recheck onResult={first} />));
    await settle();
    const calls = adapter.subscribeForegroundCalls();
    view.rerender(tree(<Recheck onResult={second} />));
    await settle();
    expect(adapter.subscribeForegroundCalls()).toBe(calls);

    await act(async () => adapter.foreground());
    await settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error outside a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useRecheckOnReturn())).toThrow(
      'useRecheckOnReturn must be used inside <OfflineDetectorProvider>.',
    );
    expect(() => renderHook(() => useCheckingFeedback())).toThrow(
      'useCheckingFeedback must be used inside <OfflineDetectorProvider>.',
    );
    spy.mockRestore();
  });
});

describe('useRecheckOnReturn: renders', () => {
  it('re-renders only when the boolean it returns changes, not on every checking flip', async () => {
    const { adapter, fetch, tree } = setup();
    let renders = 0;
    const view = render(
      tree(
        <Recheck
          onRender={() => {
            renders++;
          }}
        />,
      ),
    );
    await settle();
    expect(view.getByTestId('recheck').textContent).toBe('online');
    const settled = renders;

    // checking flips true then false and lastChecked changes, yet the answer stays online.
    await act(async () => adapter.foreground());
    await settle();
    await act(async () => adapter.foreground());
    await settle();
    expect(fetch.calls).toHaveLength(3);
    expect(renders).toBe(settled);

    fetch.setOk(false);
    await act(async () => adapter.foreground());
    await settle();
    expect(view.getByTestId('recheck').textContent).toBe('offline');
    expect(renders).toBe(settled + 1);
  });
});

describe('useRecheckOnReturn: checking and results', () => {
  it('re-probes on a foreground return and reports the outcome', async () => {
    const { adapter, fetch, tree } = setup();
    const onResult = jest.fn();
    const view = render(tree(<Recheck onResult={onResult} />));
    await settle();
    expect(fetch.calls).toHaveLength(1);
    expect(view.getByTestId('recheck').textContent).toBe('online');

    fetch.setOk(false);
    await act(async () => adapter.foreground());
    await settle();
    expect(fetch.calls).toHaveLength(2);
    expect(onResult.mock.calls).toEqual([[false]]);
    expect(view.getByTestId('recheck').textContent).toBe('offline');

    fetch.setOk(true);
    await act(async () => adapter.foreground());
    await settle();
    expect(onResult.mock.calls).toEqual([[false], [true]]);
    expect(view.getByTestId('recheck').textContent).toBe('online');
  });

  it('reports the overtaking result when an online event lands during the return check', async () => {
    const { adapter, fetch, tree } = setup();
    const onResult = jest.fn();
    render(tree(<Recheck onResult={onResult} />));
    await settle();
    fetch.setOk(false);
    await act(async () => adapter.foreground());
    await settle();
    expect(onResult.mock.calls).toEqual([[false]]);

    fetch.setOk(true);
    await act(async () => {
      adapter.foreground();
      adapter.setUp(true);
    });
    await settle();
    expect(onResult.mock.calls).toEqual([[false], [true]]);
  });

  it('does not re-probe on return when no hook is mounted', async () => {
    const { adapter, fetch, tree } = setup();
    render(tree(<span />));
    await settle();
    await act(async () => adapter.foreground());
    await settle();
    expect(fetch.calls).toHaveLength(1);
  });

  it('shares one probe between several mounted hooks', async () => {
    const { adapter, fetch, tree } = setup();
    const a = jest.fn();
    const b = jest.fn();
    const c = jest.fn();
    render(
      tree(
        <>
          <Recheck label="a" onResult={a} />
          <Recheck label="b" onResult={b} />
          <Recheck label="c" onResult={c} checkingFeedback="brief" />
        </>,
      ),
    );
    await settle();
    expect(fetch.calls).toHaveLength(1);
    expect(adapter.foregroundListenerCount()).toBe(3);

    await act(async () => adapter.foreground());
    await settle();
    expect(fetch.calls).toHaveLength(2);
    expect(a.mock.calls).toEqual([[true]]);
    expect(b.mock.calls).toEqual([[true]]);
    expect(c.mock.calls).toEqual([[true]]);
  });

  it('does not call onResult after unmount, even if the probe finishes later', async () => {
    const { adapter, fetch, tree } = setup();
    const onResult = jest.fn();
    const view = render(tree(<Recheck onResult={onResult} />));
    await settle();
    fetch.hold();
    await act(async () => adapter.foreground());
    view.rerender(tree(<span />));
    await act(async () => fetch.release());
    await settle();
    expect(onResult).not.toHaveBeenCalled();
  });

  it('reports an onResult that throws to the provider onError', async () => {
    const boom = new Error('boom');
    const onError = jest.fn();
    const { adapter, tree } = setup({ onError });
    render(
      tree(
        <Recheck
          onResult={() => {
            throw boom;
          }}
        />,
      ),
    );
    await settle();
    await act(async () => adapter.foreground());
    await settle();
    expect(onError).toHaveBeenCalledWith(boom);
  });

  it('reports a rejected check to the provider onError and ends the feedback', async () => {
    const failure = new Error('probe exploded');
    const fake = createFakeDetector(stateOf('online'));
    fake.willReject(failure);
    const onError = jest.fn();
    const onResult = jest.fn();
    const { adapter, tree } = setup({ detector: fake.detector, onError });
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="brief" onResult={onResult} />
          <Feedback />
        </>,
      ),
    );
    await settle();
    await act(async () => adapter.foreground());
    await settle();
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onResult).not.toHaveBeenCalled();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it('swallows a rejected check when the provider has no onError', async () => {
    const fake = createFakeDetector(stateOf('online'));
    fake.willReject(new Error('x'));
    const { adapter, tree } = setup({ detector: fake.detector });
    render(tree(<Recheck />));
    await settle();
    await act(async () => adapter.foreground());
    await settle();
    expect(fake.counts.checkNow).toBe(1);
  });
});

describe('useCheckingFeedback', () => {
  it("is 'none' with no hook mounted", async () => {
    const { tree } = setup();
    const view = render(tree(<Feedback />));
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it("is 'brief' only while a brief return check is pending", async () => {
    const { adapter, fetch, tree } = setup();
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="brief" />
          <Feedback />
        </>,
      ),
    );
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');

    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('brief');
    await act(async () => fetch.release());
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it("stays 'none' for hooks that use 'none' or the default", async () => {
    const { adapter, fetch, tree } = setup();
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="none" label="a" />
          <Recheck label="b" />
          <Feedback />
        </>,
      ),
    );
    await settle();
    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('none');
    await act(async () => fetch.release());
    await settle();
  });

  it("aggregates: 'brief' while any brief hook asked, even next to a 'none' hook", async () => {
    const { adapter, fetch, tree } = setup();
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="none" label="a" />
          <Recheck checkingFeedback="brief" label="b" />
          <Feedback />
        </>,
      ),
    );
    await settle();
    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('brief');
    await act(async () => fetch.release());
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it("releases 'brief' when the asking hook unmounts mid-check", async () => {
    const { adapter, fetch, tree } = setup();
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="brief" />
          <Feedback />
        </>,
      ),
    );
    await settle();
    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('brief');
    view.rerender(tree(<Feedback />));
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
    await act(async () => fetch.release());
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it('counts overlapping brief checks and ends only when the last one finishes', async () => {
    const { adapter, fetch, tree } = setup();
    const view = render(
      tree(
        <>
          <Recheck checkingFeedback="brief" label="a" />
          <Recheck checkingFeedback="brief" label="b" />
          <Feedback />
        </>,
      ),
    );
    await settle();
    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('brief');
    await act(async () => fetch.release());
    await settle();
    expect(view.getByTestId('feedback').textContent).toBe('none');
  });

  it('re-subscribes when the feedback mode changes', async () => {
    const { adapter, fetch, tree } = setup();
    function Toggle() {
      const [mode, setMode] = useState('none' as 'brief' | 'none');
      return (
        <>
          <button onClick={() => setMode('brief')}>go</button>
          <Recheck checkingFeedback={mode} />
          <Feedback />
        </>
      );
    }
    const view = render(tree(<Toggle />));
    await settle();
    await act(async () => view.getByText('go').click());
    await settle();
    expect(adapter.foregroundListenerCount()).toBe(1);
    fetch.hold();
    await act(async () => adapter.foreground());
    expect(view.getByTestId('feedback').textContent).toBe('brief');
    await act(async () => fetch.release());
    await settle();
  });
});
