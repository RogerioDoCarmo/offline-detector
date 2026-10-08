import { act, fireEvent, render, screen } from '@testing-library/react';
import { lockAxis, shouldDismiss, useSwipeDismiss } from './swipe';
import { layout, pointer } from '../test-utils';

describe('lockAxis', () => {
  it.each([
    [7, 0, null],
    [0, 7, null],
    [7, 7, null],
    [8, 0, 'horizontal'],
    [-8, 0, 'horizontal'],
    [0, 8, 'vertical'],
    [0, -8, 'vertical'],
    [8, 9, 'vertical'],
    [9, 8, 'horizontal'],
    [8, 8, 'vertical'],
  ] as const)('dx=%d dy=%d locks %s', (dx, dy, expected) => {
    expect(lockAxis(dx, dy)).toBe(expected);
  });
});

describe('shouldDismiss', () => {
  it.each([
    // distance: 29% of 100 stays, 30% goes (slow enough that speed is irrelevant)
    [29, 100, 10000, false],
    [30, 100, 10000, true],
    [-29, 100, 10000, false],
    [-30, 100, 10000, true],
    // speed: 0.49 px/ms stays, 0.5 px/ms goes (distance far below 30% of 1000)
    [49, 1000, 100, false],
    [50, 1000, 100, true],
    [-50, 1000, 100, true],
    // no time elapsed means no measurable speed
    [20, 1000, 0, false],
  ])('dx=%d width=%d elapsed=%dms -> %s', (dx, width, elapsed, expected) => {
    expect(shouldDismiss(dx, width, elapsed)).toBe(expected);
  });

  it('never dismisses a zero-width element by distance alone', () => {
    expect(shouldDismiss(0, 0, 100)).toBe(false);
  });
});

interface HarnessProps {
  enabled?: boolean;
  reducedMotion?: boolean;
  keys?: Array<'Escape' | 'Delete'>;
  onDismiss: () => void;
  onChildClick?: () => void;
}

function Harness({ onChildClick, ...options }: HarnessProps) {
  const swipe = useSwipeDismiss({ enabled: true, reducedMotion: false, ...options });
  return (
    <div data-testid="piece" tabIndex={0} {...swipe.props}>
      <button onClick={onChildClick}>child</button>
      <span data-testid="flags">{`${swipe.dragging}|${swipe.dismissed}`}</span>
    </div>
  );
}

function setup(props: Partial<HarnessProps> = {}, width = 100) {
  const onDismiss = jest.fn();
  const view = render(<Harness onDismiss={onDismiss} {...props} />);
  const piece = screen.getByTestId('piece');
  const capture = layout(piece, width);
  return { onDismiss, piece, capture, ...view };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
});
afterEach(() => {
  jest.useRealTimers();
});

/** Drag horizontally by dx over `ms`, then release. */
function swipe(piece: Element, dx: number, ms: number, dy = 0) {
  pointer(piece, 'pointerdown', { x: 100, y: 100 });
  pointer(piece, 'pointermove', { x: 100 + dx, y: 100 + dy });
  jest.advanceTimersByTime(ms);
  pointer(piece, 'pointerup', { x: 100 + dx, y: 100 + dy });
}

describe('useSwipeDismiss: distance and speed', () => {
  it('springs back at 29% of the width', () => {
    const { piece, onDismiss } = setup();
    swipe(piece, 29, 10000);
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(piece.style.transform).toBe('translateX(0px)');
    expect(piece.style.opacity).toBe('1');
    expect(screen.getByTestId('flags')).toHaveTextContent('false|false');
  });

  it('dismisses at 30% of the width, calling onDismiss after the 150 ms exit', () => {
    const { piece, onDismiss } = setup();
    swipe(piece, 30, 10000);
    expect(screen.getByTestId('flags')).toHaveTextContent('false|true');
    act(() => void jest.advanceTimersByTime(149));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => void jest.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('slides out to the left for a leftward swipe', () => {
    const { piece } = setup();
    swipe(piece, -40, 10000);
    expect(piece.style.transform).toBe('translateX(-100%)');
    expect(piece.style.opacity).toBe('0');
    expect(piece.style.transition).toBe(
      'transform var(--od-duration-exit) var(--od-ease-in), opacity var(--od-duration-exit) var(--od-ease-in)',
    );
  });

  it('slides out to the right for a rightward swipe', () => {
    const { piece } = setup();
    swipe(piece, 40, 10000);
    expect(piece.style.transform).toBe('translateX(100%)');
  });

  it('springs back at 0.49 px/ms', () => {
    const { piece, onDismiss } = setup({}, 1000);
    swipe(piece, 49, 100);
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses at 0.5 px/ms', () => {
    const { piece, onDismiss } = setup({}, 1000);
    swipe(piece, 50, 100);
    act(() => void jest.advanceTimersByTime(150));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('springs back with the base duration and ease-out', () => {
    const { piece } = setup();
    swipe(piece, 10, 10000);
    expect(piece.style.transition).toBe(
      'transform var(--od-duration-base) var(--od-ease-out), opacity var(--od-duration-base) var(--od-ease-out)',
    );
  });
});

describe('useSwipeDismiss: axis lock and drag', () => {
  it('does not move or capture before 8 px (7 px)', () => {
    const { piece, capture } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100 });
    pointer(piece, 'pointermove', { x: 107, y: 100 });
    expect(piece.style.transform).toBe('');
    expect(capture.setPointerCapture).not.toHaveBeenCalled();
    expect(screen.getByTestId('flags')).toHaveTextContent('false|false');
  });

  it('locks horizontal at 8 px, captures the pointer and follows the finger', () => {
    const { piece, capture } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100, id: 7 });
    pointer(piece, 'pointermove', { x: 108, y: 100, id: 7 });
    expect(capture.setPointerCapture).toHaveBeenCalledWith(7);
    expect(piece.style.transform).toBe('translateX(8px)');
    expect(piece.style.opacity).toBe('0.96');
    expect(piece.style.transition).toBe('none');
    expect(screen.getByTestId('flags')).toHaveTextContent('true|false');
    pointer(piece, 'pointermove', { x: 120, y: 103, id: 7 });
    expect(piece.style.transform).toBe('translateX(20px)');
  });

  it('ignores a vertical drag entirely, even if it later drifts sideways', () => {
    const { piece, capture, onDismiss } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100 });
    pointer(piece, 'pointermove', { x: 102, y: 150 });
    pointer(piece, 'pointermove', { x: 300, y: 150 });
    jest.advanceTimersByTime(50);
    pointer(piece, 'pointerup', { x: 300, y: 150 });
    act(() => void jest.advanceTimersByTime(1000));
    expect(piece.style.transform).toBe('');
    expect(capture.setPointerCapture).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('never dismisses on a tap with under 8 px of movement, however fast', () => {
    const { piece, onDismiss } = setup({}, 10);
    swipe(piece, 7, 1);
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('springs back on pointercancel', () => {
    const { piece, onDismiss } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100 });
    pointer(piece, 'pointermove', { x: 160, y: 100 });
    pointer(piece, 'pointercancel', { x: 160, y: 100 });
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(piece.style.transform).toBe('translateX(0px)');
  });

  it('ignores a second pointer while one is tracked', () => {
    const { piece, capture } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100, id: 1 });
    pointer(piece, 'pointerdown', { x: 500, y: 100, id: 2 });
    pointer(piece, 'pointermove', { x: 160, y: 100, id: 2 });
    expect(capture.setPointerCapture).not.toHaveBeenCalled();
    pointer(piece, 'pointermove', { x: 130, y: 100, id: 1 });
    expect(piece.style.transform).toBe('translateX(30px)');
    pointer(piece, 'pointerup', { x: 700, y: 100, id: 2 });
    expect(screen.getByTestId('flags')).toHaveTextContent('true|false');
  });

  it('ignores moves and releases with no gesture in progress', () => {
    const { piece, onDismiss } = setup();
    pointer(piece, 'pointermove', { x: 300, y: 100 });
    pointer(piece, 'pointerup', { x: 300, y: 100 });
    pointer(piece, 'pointercancel', { x: 300, y: 100 });
    expect(piece.style.transform).toBe('');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('ignores the secondary mouse button', () => {
    const { piece, capture } = setup();
    pointer(piece, 'pointerdown', { x: 100, y: 100, pointerType: 'mouse', button: 2 });
    pointer(piece, 'pointermove', { x: 150, y: 100, pointerType: 'mouse' });
    expect(capture.setPointerCapture).not.toHaveBeenCalled();
  });

  it('copes with an environment without pointer capture', () => {
    const { piece } = setup();
    Object.assign(piece, {
      setPointerCapture: undefined,
      releasePointerCapture: undefined,
    });
    pointer(piece, 'pointerdown', { x: 100, y: 100 });
    pointer(piece, 'pointermove', { x: 150, y: 100 });
    pointer(piece, 'pointerup', { x: 150, y: 100 });
    expect(screen.getByTestId('flags')).toHaveTextContent('false|true');
  });

  it('releases the pointer capture it took, on release', () => {
    const { piece, capture } = setup();
    swipe(piece, 10, 10000);
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(1);
  });
});

describe('useSwipeDismiss: clicks', () => {
  it('lets a plain tap reach the button inside', () => {
    const onChildClick = jest.fn();
    setup({ onChildClick });
    const button = screen.getByRole('button');
    pointer(button, 'pointerdown', { x: 100, y: 100 });
    pointer(button, 'pointerup', { x: 100, y: 100 });
    fireEvent.click(button);
    expect(onChildClick).toHaveBeenCalledTimes(1);
  });

  it('swallows the click that ends a drag', () => {
    const onChildClick = jest.fn();
    const { piece } = setup({ onChildClick });
    swipe(piece, 10, 10000);
    fireEvent.click(screen.getByRole('button'));
    expect(onChildClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button'));
    expect(onChildClick).toHaveBeenCalledTimes(1);
  });
});

describe('useSwipeDismiss: reduced motion', () => {
  it('fades out instantly with no slide, and calls onDismiss with no delay', () => {
    const { piece, onDismiss } = setup({ reducedMotion: true });
    swipe(piece, -40, 10000);
    expect(piece.style.transform).toBe('none');
    expect(piece.style.opacity).toBe('0');
    expect(piece.style.transition).toBe('opacity 0ms');
    act(() => void jest.advanceTimersByTime(0));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not tween the spring back either', () => {
    const { piece } = setup({ reducedMotion: true });
    swipe(piece, 10, 10000);
    expect(piece.style.transition).toBe('none');
  });
});

describe('useSwipeDismiss: disabled', () => {
  it('spreads no handlers and keeps touch-action pan-y', () => {
    const { piece, onDismiss } = setup({ enabled: false });
    expect(piece.style.touchAction).toBe('pan-y');
    swipe(piece, 90, 10);
    fireEvent.keyDown(piece, { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(piece.style.transform).toBe('');
  });
});

describe('useSwipeDismiss: keyboard', () => {
  it.each(['Escape', 'Delete'])('%s dismisses by default', (key) => {
    const { piece, onDismiss } = setup();
    fireEvent.keyDown(piece, { key });
    act(() => void jest.advanceTimersByTime(150));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('honours a narrower key list', () => {
    const { piece, onDismiss } = setup({ keys: ['Escape'] });
    fireEvent.keyDown(piece, { key: 'Delete' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.keyDown(piece, { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(150));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const { piece, onDismiss } = setup();
    fireEvent.keyDown(piece, { key: 'Enter' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});

function ControlHarness({ onDismiss }: { onDismiss: () => void }) {
  const swipe = useSwipeDismiss({ enabled: true, reducedMotion: false, onDismiss });
  return (
    <div data-testid="piece" {...swipe.props}>
      <button onClick={swipe.dismiss}>dismiss</button>
      <button onClick={swipe.reset}>reset</button>
      <span data-testid="flags">{String(swipe.dismissed)}</span>
    </div>
  );
}

describe('useSwipeDismiss: programmatic control', () => {
  it('dismiss() slides out and calls onDismiss after the exit; reset() brings it back', () => {
    const onDismiss = jest.fn();
    render(<ControlHarness onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('dismiss'));
    expect(screen.getByTestId('flags')).toHaveTextContent('true');
    fireEvent.click(screen.getByText('reset'));
    expect(screen.getByTestId('flags')).toHaveTextContent('false');
    expect(screen.getByTestId('piece').style.transform).toBe('');
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).not.toHaveBeenCalled(); // reset cancelled the pending exit
    fireEvent.click(screen.getByText('dismiss'));
    act(() => void jest.advanceTimersByTime(150));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('useSwipeDismiss: lifecycle', () => {
  it('calls onDismiss once even if dismissed twice', () => {
    const { piece, onDismiss } = setup();
    fireEvent.keyDown(piece, { key: 'Escape' });
    fireEvent.keyDown(piece, { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(1000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss when unmounted during the exit', () => {
    const { piece, onDismiss, unmount } = setup();
    fireEvent.keyDown(piece, { key: 'Escape' });
    unmount();
    jest.advanceTimersByTime(1000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('calls the latest onDismiss, not the one from the first render', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<Harness onDismiss={first} />);
    rerender(<Harness onDismiss={second} />);
    fireEvent.keyDown(screen.getByTestId('piece'), { key: 'Escape' });
    act(() => void jest.advanceTimersByTime(150));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
