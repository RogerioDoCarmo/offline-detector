import { act, fireEvent, render, screen } from '@testing-library/react';
import { Snackbar } from './snackbar';
import { EN, layout, pointer } from './test-utils';

const retry = () => Promise.resolve({} as never);

function renderSnackbar(props: Partial<React.ComponentProps<typeof Snackbar>> = {}) {
  return render(
    <Snackbar
      phase="offline"
      message="No internet"
      strings={EN}
      actions={{ retry }}
      {...props}
    />,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Snackbar: offline', () => {
  it('is a polite status region (role=status, never alert) showing the message', () => {
    renderSnackbar();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No internet');
    expect(status.className).toBe('od-snackbar');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(status).not.toHaveAttribute('aria-label');
  });

  it('shows a named Retry button that calls actions.retry', () => {
    const spy = jest.fn(retry);
    renderSnackbar({ actions: { retry: spy } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('hides Retry when there is no retry action', () => {
    renderSnackbar({ actions: {} });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has a decorative icon hidden from assistive technology', () => {
    const { container } = renderSnackbar();
    const svg = container.querySelector('svg.od-icon');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('is silent (no role) when another piece owns the announcement', () => {
    const { container } = renderSnackbar({ announce: false });
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });

  it('lets rootProps from the provider win', () => {
    renderSnackbar({
      rootProps: { 'aria-live': 'off', 'data-testid': 'snack', dir: 'rtl' },
    });
    const root = screen.getByTestId('snack');
    expect(root).toHaveAttribute('aria-live', 'off');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('role', 'status');
  });

  it('merges className and style, and marks the motion setting', () => {
    renderSnackbar({ className: 'mine', style: { color: 'red' }, motion: 'reduced' });
    const root = screen.getByRole('status');
    expect(root.className).toBe('od-snackbar mine');
    expect(root.style.color).toBe('red');
    expect(root).toHaveAttribute('data-od-motion', 'reduced');
  });

  it('defaults the motion marker to auto', () => {
    renderSnackbar();
    expect(screen.getByRole('status')).toHaveAttribute('data-od-motion', 'auto');
  });

  it('marks the exit state when not visible, and keeps its content', () => {
    renderSnackbar({ visible: false });
    const root = screen.getByRole('status');
    expect(root).toHaveAttribute('data-od-state', 'exit');
    expect(root).toHaveTextContent('No internet');
  });

  it('uses the icons override', () => {
    renderSnackbar({ icons: { offline: <i data-testid="mine" /> } });
    expect(screen.getByTestId('mine')).toBeInTheDocument();
  });
});

describe('Snackbar: recovery', () => {
  it('shows the message and a check icon, with no Retry', () => {
    const { container } = renderSnackbar({ phase: 'recovered', message: 'Back online' });
    expect(screen.getByRole('status')).toHaveTextContent('Back online');
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    expect(container.querySelector('svg path')).toHaveAttribute(
      'd',
      'M5 12.5l4.5 4.5L19 7.5',
    );
  });

  it('uses the online icon override', () => {
    renderSnackbar({ phase: 'recovered', icons: { online: <i data-testid="ok" /> } });
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });
});

describe('Snackbar: checking', () => {
  it('keeps the plain Retry for a check shorter than 150 ms', () => {
    renderSnackbar({ phase: 'checking' });
    act(() => void jest.advanceTimersByTime(149));
    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('turns Retry into a busy, aria-disabled "Checking…" after 150 ms, keeping focus', () => {
    const { rerender } = renderSnackbar({ phase: 'offline' });
    screen.getByRole('button', { name: 'Retry' }).focus();
    rerender(
      <Snackbar
        phase="checking"
        message="No internet"
        strings={EN}
        actions={{ retry }}
      />,
    );
    act(() => void jest.advanceTimersByTime(150));
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveFocus();
  });

  it('ignores clicks while checking is shown', () => {
    const spy = jest.fn(retry);
    renderSnackbar({ phase: 'checking', actions: { retry: spy }, checkingDelayMs: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Checking…' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows checking at once with a zero delay (user-pressed Retry)', () => {
    renderSnackbar({ phase: 'checking', checkingDelayMs: 0 });
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeInTheDocument();
  });

  it('honours a custom minimum display time', () => {
    const { rerender } = renderSnackbar({
      phase: 'checking',
      checkingDelayMs: 0,
      checkingMinMs: 1000,
    });
    rerender(
      <Snackbar
        phase="offline"
        message="No internet"
        strings={EN}
        actions={{ retry }}
        checkingDelayMs={0}
        checkingMinMs={1000}
      />,
    );
    act(() => void jest.advanceTimersByTime(999));
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeInTheDocument();
    act(() => void jest.advanceTimersByTime(1));
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

describe('Snackbar: dismissal', () => {
  it('has no dismiss button, hint or swipe when not dismissible', () => {
    renderSnackbar({ actions: { retry } });
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    const root = screen.getByRole('status');
    expect(root).not.toHaveAttribute('aria-description');
    expect(root.style.touchAction).toBe('pan-y');
    expect(root.style.transform).toBe('');
  });

  it('shows a Dismiss button and the swipe hint when actions.dismiss exists', () => {
    renderSnackbar({ actions: { retry, dismiss: jest.fn() } });
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-description',
      'Swipe left or right to dismiss',
    );
  });

  it('dismisses with the button, after the exit', () => {
    const dismiss = jest.fn();
    renderSnackbar({ actions: { retry, dismiss } });
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses with Escape while focus is inside', () => {
    const dismiss = jest.fn();
    renderSnackbar({ actions: { retry, dismiss } });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Retry' }), { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss with Delete (it could be meant for the Retry button)', () => {
    const dismiss = jest.fn();
    renderSnackbar({ actions: { retry, dismiss } });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Retry' }), { key: 'Delete' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('dismisses with a swipe of 30% of its width', () => {
    const dismiss = jest.fn();
    renderSnackbar({ actions: { retry, dismiss } });
    const root = screen.getByRole('status');
    layout(root, 300);
    pointer(root, 'pointerdown', { x: 200, y: 10 });
    pointer(root, 'pointermove', { x: 290, y: 10 });
    pointer(root, 'pointerup', { x: 290, y: 10 });
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss when the swipe is vertical', () => {
    const dismiss = jest.fn();
    renderSnackbar({ actions: { retry, dismiss } });
    const root = screen.getByRole('status');
    layout(root, 300);
    pointer(root, 'pointerdown', { x: 200, y: 10 });
    pointer(root, 'pointermove', { x: 205, y: 200 });
    pointer(root, 'pointerup', { x: 205, y: 200 });
    act(() => void jest.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('cannot be swiped while it is exiting (not visible)', () => {
    const dismiss = jest.fn();
    renderSnackbar({ visible: false, actions: { retry, dismiss } });
    const root = screen.getByRole('status');
    layout(root, 300);
    pointer(root, 'pointerdown', { x: 200, y: 10 });
    pointer(root, 'pointermove', { x: 290, y: 10 });
    pointer(root, 'pointerup', { x: 290, y: 10 });
    act(() => void jest.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('still lets a tap on Retry through', () => {
    const spy = jest.fn(retry);
    renderSnackbar({ actions: { retry: spy, dismiss: jest.fn() } });
    const button = screen.getByRole('button', { name: 'Retry' });
    pointer(button, 'pointerdown', { x: 10, y: 10 });
    pointer(button, 'pointerup', { x: 10, y: 10 });
    fireEvent.click(button);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('Snackbar: recovery timer pausing', () => {
  it('reports hover, focus and touch as one interaction signal', () => {
    const onInteractionChange = jest.fn();
    renderSnackbar({ onInteractionChange, actions: { retry, dismiss: jest.fn() } });
    const root = screen.getByRole('status');
    const button = screen.getByRole('button', { name: 'Retry' });
    layout(root, 300);

    fireEvent.mouseEnter(root);
    expect(onInteractionChange).toHaveBeenLastCalledWith(true);
    fireEvent.mouseLeave(root);
    expect(onInteractionChange).toHaveBeenLastCalledWith(false);

    fireEvent.focus(button);
    expect(onInteractionChange).toHaveBeenLastCalledWith(true);
    fireEvent.blur(button, {
      relatedTarget: screen.getByRole('button', { name: 'Dismiss' }),
    });
    expect(onInteractionChange).toHaveBeenLastCalledWith(true); // focus stays inside
    fireEvent.blur(screen.getByRole('button', { name: 'Dismiss' }), {
      relatedTarget: null,
    });
    expect(onInteractionChange).toHaveBeenLastCalledWith(false);

    pointer(root, 'pointerdown', { x: 1, y: 1 });
    expect(onInteractionChange).toHaveBeenLastCalledWith(true);
    pointer(root, 'pointerup', { x: 1, y: 1 });
    expect(onInteractionChange).toHaveBeenLastCalledWith(false);
    pointer(root, 'pointerdown', { x: 1, y: 1 });
    pointer(root, 'pointercancel', { x: 1, y: 1 });
    expect(onInteractionChange).toHaveBeenLastCalledWith(false);
  });

  it('does not report the same value twice in a row', () => {
    const onInteractionChange = jest.fn();
    renderSnackbar({ onInteractionChange });
    const root = screen.getByRole('status');
    fireEvent.mouseEnter(root);
    fireEvent.focus(screen.getByRole('button', { name: 'Retry' }));
    expect(onInteractionChange).toHaveBeenCalledTimes(1);
  });

  it('releases the pause if it unmounts while the user is interacting', () => {
    const onInteractionChange = jest.fn();
    const { unmount } = renderSnackbar({ onInteractionChange });
    fireEvent.mouseEnter(screen.getByRole('status'));
    unmount();
    expect(onInteractionChange.mock.calls).toEqual([[true], [false]]);
  });

  it('works without a listener', () => {
    renderSnackbar();
    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Snackbar: height publishing', () => {
  it('publishes its height plus the 8 px gap for the indicator above it', () => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 48,
    } as DOMRect);
    const { unmount } = renderSnackbar();
    expect(document.documentElement.style.getPropertyValue('--od-snackbar-height')).toBe(
      '56px',
    );
    unmount();
    expect(document.documentElement.style.getPropertyValue('--od-snackbar-height')).toBe(
      '0px',
    );
    jest.restoreAllMocks();
  });
});
