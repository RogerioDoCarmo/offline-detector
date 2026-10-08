import { act, fireEvent, render, screen } from '@testing-library/react';
import { Indicator } from './indicator';
import { EN, layout, pointer } from '../test-utils';

function renderIndicator(props: Partial<React.ComponentProps<typeof Indicator>> = {}) {
  return render(
    <Indicator phase="offline" message="No internet" strings={EN} {...props} />,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('Indicator: names and roles', () => {
  it.each([
    ['offline', 'Connection status: No internet'],
    ['recovered', 'Connection status: Online'],
  ] as const)('%s chip is an image named %s', (phase, name) => {
    renderIndicator({ phase });
    expect(screen.getByRole('img', { name })).toBeInTheDocument();
  });

  it('is never a live region and never an alert', () => {
    const { container } = renderIndicator();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('[aria-live]')).toBeNull();
  });

  it('names the checking state with the checking label', () => {
    renderIndicator({ phase: 'checking', checkingDelayMs: 0 });
    expect(
      screen.getByRole('img', { name: 'Connection status: Checking connection' }),
    ).toBeInTheDocument();
  });

  it('shows the visible chip label and a glyph that differs per state', () => {
    const { container, rerender } = renderIndicator();
    const glyph = () => container.querySelector('.od-dot svg')?.innerHTML;
    expect(container.querySelector('.od-chip')).toHaveTextContent('No internet');
    expect(glyph()).toBe('<path d="M5 5l14 14"></path>');
    rerender(<Indicator phase="checking" message="x" strings={EN} checkingDelayMs={0} />);
    expect(container.querySelector('.od-chip')).toHaveTextContent('Checking connection');
    expect(glyph()).toBe('<circle cx="12" cy="12" r="5"></circle>');
    rerender(<Indicator phase="recovered" message="x" strings={EN} />);
    expect(container.querySelector('.od-chip')).toHaveTextContent('Online');
    expect(glyph()).toBe('<path d="M5 12.5l4.5 4.5L19 7.5"></path>');
  });

  it('colours the dot by state', () => {
    const { container, rerender } = renderIndicator();
    const dot = () => container.querySelector('.od-dot')?.className;
    expect(dot()).toBe('od-dot offline');
    rerender(<Indicator phase="recovered" message="x" strings={EN} />);
    expect(dot()).toBe('od-dot online');
    rerender(<Indicator phase="checking" message="x" strings={EN} checkingDelayMs={0} />);
    expect(dot()).toBe('od-dot checking');
  });

  it('applies a custom accessible-name template', () => {
    renderIndicator({ strings: { ...EN, indicatorAccessibleName: 'Estado: {status}' } });
    expect(screen.getByRole('img', { name: 'Estado: No internet' })).toBeInTheDocument();
  });
});

describe('Indicator: variants and position', () => {
  it('defaults to a chip at top-end', () => {
    const { container } = renderIndicator();
    const root = container.firstElementChild;
    expect(root?.className).toBe('od-indicator od-pos-top-end');
    expect(container.querySelector('.od-chip')).toBeInTheDocument();
    expect(container.querySelector('.od-dot-target')).toBeNull();
  });

  it.each(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const)(
    'positions at %s',
    (position) => {
      const { container } = renderIndicator({ position });
      expect(container.firstElementChild?.className).toBe(
        `od-indicator od-pos-${position}`,
      );
    },
  );

  it('renders a dot with a 44 px target, a tooltip and the same accessible name', () => {
    const { container } = renderIndicator({ variant: 'dot' });
    const target = screen.getByRole('img', { name: 'Connection status: No internet' });
    expect(target.className).toBe('od-dot-target');
    expect(target).toHaveAttribute('title', 'No internet');
    expect(container.querySelector('.od-chip')).toBeNull();
    expect(container.querySelector('.od-dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges className, style, rootProps and marks motion and exit', () => {
    const { container } = renderIndicator({
      className: 'mine',
      style: { color: 'red' },
      rootProps: { 'data-testid': 'ind' },
      motion: 'reduced',
      visible: false,
    });
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('od-indicator od-pos-top-end mine');
    expect(root.style.color).toBe('red');
    expect(root).toHaveAttribute('data-testid', 'ind');
    expect(root).toHaveAttribute('data-od-motion', 'reduced');
    expect(root).toHaveAttribute('data-od-state', 'exit');
  });
});

describe('Indicator: checking rule (150 ms / 400 ms) and idle phase', () => {
  it('shows the idle phase until checking has been pending for 150 ms', () => {
    renderIndicator({ phase: 'checking' });
    expect(
      screen.getByRole('img', { name: 'Connection status: No internet' }),
    ).toBeInTheDocument();
    act(() => void jest.advanceTimersByTime(150));
    expect(
      screen.getByRole('img', { name: 'Connection status: Checking connection' }),
    ).toBeInTheDocument();
  });

  it('renders nothing for a quick check when the idle phase is null', () => {
    const { container } = renderIndicator({ phase: 'checking', idlePhase: null });
    expect(container).toBeEmptyDOMElement();
    act(() => void jest.advanceTimersByTime(150));
    expect(container).not.toBeEmptyDOMElement();
  });

  it('can idle as recovered', () => {
    renderIndicator({ phase: 'checking', idlePhase: 'recovered' });
    expect(
      screen.getByRole('img', { name: 'Connection status: Online' }),
    ).toBeInTheDocument();
  });
});

describe('Indicator: dismissal', () => {
  it('is not focusable and ignores keys when not dismissible', () => {
    renderIndicator();
    const chip = screen.getByRole('img');
    expect(chip).not.toHaveAttribute('tabindex');
    expect(chip).not.toHaveAttribute('aria-description');
  });

  it('is focusable with the hint when dismissible', () => {
    renderIndicator({ actions: { dismiss: jest.fn() } });
    const chip = screen.getByRole('img');
    expect(chip).toHaveAttribute('tabindex', '0');
    expect(chip).toHaveAttribute('aria-description', 'Swipe left or right to dismiss');
  });

  it('makes a focusable dot focusable too', () => {
    renderIndicator({ variant: 'dot', actions: { dismiss: jest.fn() } });
    expect(screen.getByRole('img')).toHaveAttribute('tabindex', '0');
  });

  it.each(['Escape', 'Delete'])('%s dismisses it', (key) => {
    const dismiss = jest.fn();
    renderIndicator({ actions: { dismiss } });
    fireEvent.keyDown(screen.getByRole('img'), { key });
    expect(dismiss).not.toHaveBeenCalled();
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses with a swipe', () => {
    const dismiss = jest.fn();
    const { container } = renderIndicator({ actions: { dismiss } });
    const root = container.firstElementChild as HTMLElement;
    layout(root, 120);
    pointer(root, 'pointerdown', { x: 100, y: 5 });
    pointer(root, 'pointermove', { x: 60, y: 5 });
    pointer(root, 'pointerup', { x: 60, y: 5 });
    act(() => void jest.advanceTimersByTime(150));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('does nothing while exiting', () => {
    const dismiss = jest.fn();
    renderIndicator({ visible: false, actions: { dismiss } });
    fireEvent.keyDown(screen.getByRole('img'), { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(dismiss).not.toHaveBeenCalled();
  });
});
