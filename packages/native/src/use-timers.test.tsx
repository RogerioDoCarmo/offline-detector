import { act, renderHook } from '@testing-library/react-native';
import { useCheckingDisplay, useExitWindow, useRecovery } from './use-timers';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

type Status = 'unknown' | 'online' | 'offline';

describe('useRecovery', () => {
  function setup(initial: Status, recoveryMs = 4000) {
    return renderHook(
      (props: { status: Status; ms: number }) => useRecovery(props.status, props.ms),
      { initialProps: { status: initial, ms: recoveryMs } },
    );
  }

  it('is false at launch, online or offline', async () => {
    expect((await setup('unknown')).result.current).toBe(false);
    expect((await setup('online')).result.current).toBe(false);
    expect((await setup('offline')).result.current).toBe(false);
  });

  it('is false for the first online result after unknown', async () => {
    const view = await setup('unknown');
    await view.rerender({ status: 'online', ms: 4000 });
    expect(view.result.current).toBe(false);
  });

  it('is true for exactly recoveryMs after offline to online', async () => {
    const view = await setup('offline', 4000);
    await view.rerender({ status: 'online', ms: 4000 });
    expect(view.result.current).toBe(true);
    await advance(3999);
    expect(view.result.current).toBe(true);
    await advance(1);
    expect(view.result.current).toBe(false);
  });

  it('honours a custom recoveryMs', async () => {
    const view = await setup('offline', 1500);
    await view.rerender({ status: 'online', ms: 1500 });
    await advance(1499);
    expect(view.result.current).toBe(true);
    await advance(1);
    expect(view.result.current).toBe(false);
  });

  it('is cancelled by a new offline transition', async () => {
    const view = await setup('offline');
    await view.rerender({ status: 'online', ms: 4000 });
    await advance(1000);
    await view.rerender({ status: 'offline', ms: 4000 });
    expect(view.result.current).toBe(false);
    await advance(10000);
    expect(view.result.current).toBe(false);
  });

  it('does not come back on a later unrelated rerender', async () => {
    const view = await setup('offline');
    await view.rerender({ status: 'online', ms: 4000 });
    await advance(4000);
    await view.rerender({ status: 'online', ms: 4000 });
    expect(view.result.current).toBe(false);
  });
});

describe('useCheckingDisplay', () => {
  function setup(user: boolean, brief: boolean) {
    return renderHook(
      (props: { user: boolean; brief: boolean }) =>
        useCheckingDisplay(props.user, props.brief),
      { initialProps: { user, brief } },
    );
  }

  it('is false when nothing asks for it', async () => {
    const view = await setup(false, false);
    await advance(1000);
    expect(view.result.current).toBe(false);
  });

  it('shows a user check at once', async () => {
    const view = await setup(false, false);
    await view.rerender({ user: true, brief: false });
    expect(view.result.current).toBe(true);
  });

  it('holds a user check for at least 400 ms', async () => {
    const view = await setup(true, false);
    await advance(100);
    await view.rerender({ user: false, brief: false });
    expect(view.result.current).toBe(true);
    await advance(299);
    expect(view.result.current).toBe(true);
    await advance(1);
    expect(view.result.current).toBe(false);
  });

  it('hides at once when the user check outlasted 400 ms', async () => {
    const view = await setup(true, false);
    await advance(900);
    await view.rerender({ user: false, brief: false });
    await advance(0);
    expect(view.result.current).toBe(false);
  });

  it('shows a brief check only if still pending after 150 ms', async () => {
    const view = await setup(false, true);
    await advance(149);
    expect(view.result.current).toBe(false);
    await advance(1);
    expect(view.result.current).toBe(true);
  });

  it('never shows a brief check that ends within 150 ms', async () => {
    const view = await setup(false, true);
    await advance(100);
    await view.rerender({ user: false, brief: false });
    await advance(1000);
    expect(view.result.current).toBe(false);
  });

  it('holds a shown brief check for 400 ms', async () => {
    const view = await setup(false, true);
    await advance(150);
    await view.rerender({ user: false, brief: false });
    await advance(399);
    expect(view.result.current).toBe(true);
    await advance(1);
    expect(view.result.current).toBe(false);
  });

  it('keeps showing when a user check follows a shown brief check', async () => {
    const view = await setup(false, true);
    await advance(150);
    await view.rerender({ user: true, brief: true });
    await advance(5000);
    expect(view.result.current).toBe(true);
  });
});

describe('useExitWindow', () => {
  function setup(visible: boolean) {
    return renderHook(
      (props: { visible: boolean }) => useExitWindow(props.visible, 150),
      { initialProps: { visible } },
    );
  }

  it('is false while hidden from the start', async () => {
    expect((await setup(false)).result.current).toBe(false);
  });

  it('is true while visible', async () => {
    expect((await setup(true)).result.current).toBe(true);
  });

  it('stays mounted for the exit window, then unmounts', async () => {
    const view = await setup(true);
    await view.rerender({ visible: false });
    expect(view.result.current).toBe(true);
    await advance(149);
    expect(view.result.current).toBe(true);
    await advance(1);
    expect(view.result.current).toBe(false);
  });

  it('mounts at once when it becomes visible', async () => {
    const view = await setup(false);
    await view.rerender({ visible: true });
    expect(view.result.current).toBe(true);
  });

  it('cancels the unmount when it becomes visible again', async () => {
    const view = await setup(true);
    await view.rerender({ visible: false });
    await advance(100);
    await view.rerender({ visible: true });
    await advance(500);
    expect(view.result.current).toBe(true);
  });
});
