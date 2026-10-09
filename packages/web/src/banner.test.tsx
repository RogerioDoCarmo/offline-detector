import { act, fireEvent, render, screen } from '@testing-library/react';
import { Banner } from './banner';
import { EN, FRAME, layout, pointer } from '../test-utils';

const retry = () => Promise.resolve({} as never);

function renderBanner(props: Partial<React.ComponentProps<typeof Banner>> = {}) {
  return render(<Banner phase="offline" message="No internet" strings={EN} {...props} />);
}

/** Lets the live region receive its text (it mounts empty and is filled one frame later). */
const frame = () => act(() => void jest.advanceTimersByTime(FRAME));

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Banner: the live region exists before its text (accessibility.md, section 1)', () => {
  it('mounts the empty status region first and sets the text one frame later', () => {
    renderBanner();
    const status = screen.getByRole('status');
    expect(status.querySelector('.od-msg')).toHaveTextContent('');
    act(() => void jest.advanceTimersByTime(FRAME));
    expect(status.querySelector('.od-msg')).toHaveTextContent('No internet');
    expect(screen.getByRole('status')).toBe(status);
  });

  it('shows the text at once when it is a labelled region rather than the announcer', () => {
    renderBanner({ announce: false });
    expect(screen.getByRole('region', { name: 'No internet' })).toHaveTextContent(
      'No internet',
    );
  });
});

describe('Banner: roles', () => {
  it('is the announcer by default: role=status, never alert, no aria-label', () => {
    renderBanner();
    frame();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No internet');
    expect(status).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('is a labelled region without live behaviour when the snackbar announces', () => {
    renderBanner({ announce: false });
    const region = screen.getByRole('region', { name: 'No internet' });
    expect(region).not.toHaveAttribute('aria-live');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows the reason-aware message it is given', () => {
    renderBanner({ message: 'Connected, but no internet' });
    frame();
    expect(screen.getByRole('status')).toHaveTextContent('Connected, but no internet');
  });

  it('lets rootProps from the provider win', () => {
    renderBanner({ rootProps: { role: 'region', 'aria-label': 'Offline', dir: 'rtl' } });
    expect(screen.getByRole('region', { name: 'Offline' })).toHaveAttribute('dir', 'rtl');
  });
});

describe('Banner: anatomy', () => {
  it('has a decorative wifi-off icon and no buttons by default', () => {
    const { container } = renderBanner();
    expect(container.querySelector('svg.od-icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is sticky-styled, marks overlay, motion and exit state', () => {
    renderBanner({ overlay: true, motion: 'full', visible: false, className: 'x' });
    const root = screen.getByRole('status');
    expect(root.className).toBe('od-banner x');
    expect(root).toHaveAttribute('data-od-overlay', '');
    expect(root).toHaveAttribute('data-od-motion', 'full');
    expect(root).toHaveAttribute('data-od-state', 'exit');
  });

  it('has no overlay marker by default', () => {
    renderBanner();
    expect(screen.getByRole('status')).not.toHaveAttribute('data-od-overlay');
  });

  it('swaps the icon for a spinner while checking is shown, keeping the text', () => {
    const { container } = renderBanner({ phase: 'checking', checkingDelayMs: 0 });
    frame();
    expect(container.querySelector('.od-spinner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No internet');
  });

  it('shows the plain icon until checking has been pending for 150 ms', () => {
    const { container } = renderBanner({ phase: 'checking' });
    expect(container.querySelector('.od-spinner')).toBeNull();
    act(() => void jest.advanceTimersByTime(150));
    expect(container.querySelector('.od-spinner')).toBeInTheDocument();
  });

  it('uses a check icon for the recovered phase and honours icon overrides', () => {
    const { container, rerender } = renderBanner({ phase: 'recovered' });
    expect(container.querySelector('svg path')).toHaveAttribute(
      'd',
      'M5 12.5l4.5 4.5L19 7.5',
    );
    rerender(
      <Banner
        phase="offline"
        message="x"
        strings={EN}
        icons={{ offline: <i data-testid="mine" /> }}
      />,
    );
    expect(screen.getByTestId('mine')).toBeInTheDocument();
  });

  it('uses the checking and online icon overrides', () => {
    const { rerender } = renderBanner({
      phase: 'checking',
      checkingDelayMs: 0,
      icons: { checking: <i data-testid="c" /> },
    });
    expect(screen.getByTestId('c')).toBeInTheDocument();
    rerender(
      <Banner
        phase="recovered"
        message="x"
        strings={EN}
        icons={{ online: <i data-testid="o" /> }}
      />,
    );
    expect(screen.getByTestId('o')).toBeInTheDocument();
  });
});

describe('Banner: optional Retry', () => {
  it('shows Retry only when asked for and a retry action exists', () => {
    const spy = jest.fn(retry);
    const { rerender } = renderBanner({ actions: { retry: spy } });
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    rerender(
      <Banner
        phase="offline"
        message="x"
        strings={EN}
        actions={{ retry: spy }}
        showRetry
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(<Banner phase="offline" message="x" strings={EN} showRetry />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('turns busy and aria-disabled while checking is shown', () => {
    const spy = jest.fn(retry);
    renderBanner({
      phase: 'checking',
      checkingDelayMs: 0,
      actions: { retry: spy },
      showRetry: true,
    });
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Banner: dismissal', () => {
  it('has a Dismiss button, the hint and swipe only when actions.dismiss exists', () => {
    renderBanner();
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(screen.getByRole('status')).not.toHaveAttribute('aria-description');
  });

  it('dismisses with the button after the exit', () => {
    const dismiss = jest.fn();
    renderBanner({ actions: { dismiss } });
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-description',
      'Swipe left or right to dismiss',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses with Escape', () => {
    const dismiss = jest.fn();
    renderBanner({ actions: { dismiss } });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Dismiss' }), { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses by swiping 30% of the width in either direction', () => {
    const dismiss = jest.fn();
    renderBanner({ actions: { dismiss } });
    const root = screen.getByRole('status');
    layout(root, 400);
    pointer(root, 'pointerdown', { x: 300, y: 5 });
    pointer(root, 'pointermove', { x: 180, y: 5 });
    pointer(root, 'pointerup', { x: 180, y: 5 });
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('does not react to swipes while exiting', () => {
    const dismiss = jest.fn();
    renderBanner({ visible: false, actions: { dismiss } });
    const root = screen.getByRole('status');
    layout(root, 400);
    pointer(root, 'pointerdown', { x: 300, y: 5 });
    pointer(root, 'pointermove', { x: 100, y: 5 });
    pointer(root, 'pointerup', { x: 100, y: 5 });
    act(() => void jest.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
  });
});

describe('Banner: height publishing', () => {
  const root = document.documentElement;

  afterEach(() => {
    jest.restoreAllMocks();
    root.style.removeProperty('--od-banner-height');
  });

  it('publishes its height while visible and resets it to 0 on unmount', () => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 40,
    } as DOMRect);
    const { unmount } = renderBanner();
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('40px');
    unmount();
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('0px');
  });

  it('stops publishing once it is exiting', () => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 40,
    } as DOMRect);
    const { rerender } = renderBanner();
    rerender(<Banner phase="offline" message="x" strings={EN} visible={false} />);
    expect(root.style.getPropertyValue('--od-banner-height')).toBe('0px');
  });
});
