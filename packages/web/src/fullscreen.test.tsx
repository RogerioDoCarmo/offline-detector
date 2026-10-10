import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FullScreen } from './fullscreen';
import { EN } from '../test-utils';

const retry = () => Promise.resolve({} as never);

function renderFullScreen(props: Partial<React.ComponentProps<typeof FullScreen>> = {}) {
  return render(
    <FullScreen
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

describe('FullScreen: content and semantics', () => {
  it('shows the title as an h1, the body and a Try again button', () => {
    renderFullScreen();
    expect(
      screen.getByRole('heading', { level: 1, name: 'No internet' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('is not a dialog and has no live region or alert role', () => {
    const { container } = renderFullScreen();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('[aria-modal],[aria-live]')).toBeNull();
  });

  it('uses the reason-aware message as the title', () => {
    renderFullScreen({ message: 'Connected, but no internet' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Connected, but no internet',
    );
  });

  it('falls back to the plain retry string when fullScreenRetry is empty', () => {
    renderFullScreen({ strings: { ...EN, fullScreenRetry: '' } });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('has a decorative large icon', () => {
    const { container } = renderFullScreen();
    expect(container.querySelector('svg.od-big-icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('merges className, style, rootProps, motion and exit state', () => {
    renderFullScreen({
      className: 'mine',
      style: { color: 'red' },
      rootProps: { 'data-testid': 'fs', dir: 'rtl' },
      motion: 'reduced',
      visible: false,
    });
    const root = screen.getByTestId('fs');
    expect(root.className).toBe('od-fullscreen mine');
    expect(root.style.color).toBe('red');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('data-od-motion', 'reduced');
    expect(root).toHaveAttribute('data-od-state', 'exit');
  });

  it('uses the offline icon override', () => {
    renderFullScreen({ icons: { offline: <i data-testid="mine" /> } });
    expect(screen.getByTestId('mine')).toBeInTheDocument();
  });

  it('is not swipe-dismissible: no dismiss button or swipe hint even if given a dismiss', () => {
    const dismiss = jest.fn();
    const { container } = renderFullScreen({ actions: { retry, dismiss } });
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('aria-description');
    expect(container.firstElementChild).toHaveStyle({ touchAction: '' });
  });
});

describe('FullScreen: actions', () => {
  it('calls retry from the primary button', () => {
    const spy = jest.fn(retry);
    renderFullScreen({ actions: { retry: spy } });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('shows Continue offline only when the action exists, and calls it', () => {
    const { rerender } = renderFullScreen();
    expect(screen.queryByRole('button', { name: 'Continue offline' })).toBeNull();
    const spy = jest.fn();
    rerender(
      <FullScreen
        phase="offline"
        message="x"
        strings={EN}
        actions={{ retry, continueOffline: spy }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue offline' }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Escape triggers Continue offline when it exists', () => {
    const spy = jest.fn();
    renderFullScreen({ actions: { retry, continueOffline: spy } });
    fireEvent.keyDown(screen.getByRole('heading'), { key: 'Escape' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('Escape does nothing without Continue offline, and other keys are ignored', () => {
    const spy = jest.fn(retry);
    renderFullScreen({ actions: { retry: spy } });
    fireEvent.keyDown(screen.getByRole('heading'), { key: 'Escape' });
    fireEvent.keyDown(screen.getByRole('heading'), { key: 'Enter' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('hides the primary button when there is no retry action', () => {
    renderFullScreen({ actions: {} });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps focus on the button and makes it busy and aria-disabled while checking', () => {
    const spy = jest.fn(retry);
    const { rerender } = renderFullScreen({ actions: { retry: spy } });
    const button = screen.getByRole('button', { name: 'Try again' });
    button.focus();
    rerender(
      <FullScreen
        phase="checking"
        message="x"
        strings={EN}
        actions={{ retry: spy }}
        checkingDelayMs={0}
      />,
    );
    const busy = screen.getByRole('button', { name: 'Checking…' });
    expect(busy).toBe(button);
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(busy).not.toBeDisabled();
    expect(busy).toHaveFocus();
    fireEvent.click(busy);
    expect(spy).not.toHaveBeenCalled();
  });

  it('applies the 150 ms rule to the checking label', () => {
    renderFullScreen({ phase: 'checking' });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    act(() => void jest.advanceTimersByTime(150));
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeInTheDocument();
  });
});

describe('FullScreen: focus management', () => {
  it('moves focus to the title on appearance and restores it on removal', () => {
    const outside = document.createElement('button');
    outside.textContent = 'host button';
    document.body.append(outside);
    outside.focus();
    const { unmount } = renderFullScreen();
    expect(screen.getByRole('heading')).toHaveFocus();
    expect(screen.getByRole('heading')).toHaveAttribute('tabindex', '-1');
    unmount();
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('does not restore focus to an element that left the document', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const { unmount } = renderFullScreen();
    outside.remove();
    expect(() => unmount()).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });

  it('restores focus when it becomes not visible (exit), not only on unmount', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const { rerender } = renderFullScreen();
    rerender(
      <FullScreen
        phase="offline"
        message="x"
        strings={EN}
        actions={{ retry }}
        visible={false}
      />,
    );
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('does not steal focus while not visible', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    renderFullScreen({ visible: false });
    expect(outside).toHaveFocus();
    outside.remove();
  });
});

describe('FullScreen: focus return under StrictMode', () => {
  /** A browser blurs the focused element when `inert` lands on it or an ancestor. */
  let setAttribute: typeof Element.prototype.setAttribute;
  beforeEach(() => {
    setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function patched(name: string, value: string) {
      setAttribute.call(this, name, value);
      const active = document.activeElement as HTMLElement | null;
      if (
        name === 'inert' &&
        active &&
        active !== document.body &&
        this.contains(active)
      ) {
        active.blur();
      }
    };
  });
  afterEach(() => {
    Element.prototype.setAttribute = setAttribute;
    document.body.innerHTML = '';
  });

  it('returns focus to the element that had it before the screen appeared', () => {
    const app = document.createElement('div');
    const outside = document.createElement('button');
    outside.textContent = 'host button';
    app.append(outside);
    const mount = document.createElement('div');
    document.body.append(app, mount);
    outside.focus();

    const { unmount } = render(
      <StrictMode>
        <FullScreen phase="offline" message="x" strings={EN} actions={{ retry }} />
      </StrictMode>,
      { container: mount },
    );
    expect(screen.getByRole('heading')).toHaveFocus();
    unmount();
    expect(outside).toHaveFocus();
  });

  it('returns focus after the exit too (visible turning false)', () => {
    const outside = document.createElement('button');
    const mount = document.createElement('div');
    document.body.append(outside, mount);
    outside.focus();
    const ui = (visible: boolean) => (
      <StrictMode>
        <FullScreen
          phase="offline"
          message="x"
          strings={EN}
          actions={{ retry }}
          visible={visible}
        />
      </StrictMode>
    );
    const { rerender } = render(ui(true), { container: mount });
    rerender(ui(false));
    expect(outside).toHaveFocus();
  });
});

describe('FullScreen: inert host', () => {
  function host() {
    const app = document.createElement('div');
    app.id = 'app';
    const sibling = document.createElement('main');
    sibling.id = 'sibling';
    const other = document.createElement('div');
    other.id = 'other';
    other.setAttribute('aria-hidden', 'false');
    document.body.append(app, other);
    app.append(sibling);
    return { app, sibling, other };
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('makes every sibling on the path to the full-screen inert and aria-hidden, then restores', () => {
    const { app, sibling, other } = host();
    const mount = document.createElement('div');
    app.append(mount);
    const { unmount } = render(
      <FullScreen phase="offline" message="x" strings={EN} actions={{ retry }} />,
      { container: mount },
    );
    for (const el of [sibling, other]) {
      expect(el).toHaveAttribute('inert', '');
      expect(el).toHaveAttribute('aria-hidden', 'true');
    }
    expect(mount).not.toHaveAttribute('inert');
    expect(app).not.toHaveAttribute('inert');
    expect(screen.getByRole('heading')).not.toHaveAttribute('inert');
    unmount();
    expect(sibling).not.toHaveAttribute('inert');
    expect(sibling).not.toHaveAttribute('aria-hidden');
    expect(other).not.toHaveAttribute('inert');
    expect(other).toHaveAttribute('aria-hidden', 'false');
  });

  it('also makes siblings that appear after it inert (a toast or modal injected later)', async () => {
    const { app } = host();
    const mount = document.createElement('div');
    app.append(mount);
    const { unmount } = render(
      <FullScreen phase="offline" message="x" strings={EN} actions={{ retry }} />,
      { container: mount },
    );
    const lateInApp = document.createElement('aside');
    const lateInBody = document.createElement('div');
    const lateScript = document.createElement('script');
    app.append(lateInApp);
    document.body.append(lateInBody, lateScript);
    await act(async () => {
      await Promise.resolve();
    });
    for (const el of [lateInApp, lateInBody]) {
      expect(el).toHaveAttribute('inert', '');
      expect(el).toHaveAttribute('aria-hidden', 'true');
    }
    expect(lateScript).not.toHaveAttribute('inert');

    unmount();
    for (const el of [lateInApp, lateInBody]) {
      expect(el).not.toHaveAttribute('inert');
      expect(el).not.toHaveAttribute('aria-hidden');
    }
  });

  it('stops watching for new siblings once it is gone', async () => {
    host();
    const { unmount } = renderFullScreen();
    unmount();
    const late = document.createElement('div');
    document.body.append(late);
    await act(async () => {
      await Promise.resolve();
    });
    expect(late).not.toHaveAttribute('inert');
  });

  it('restores a sibling that was already inert to its own value', () => {
    const { app } = host();
    app.setAttribute('inert', 'until-found');
    const { unmount } = renderFullScreen();
    expect(app).toHaveAttribute('inert', '');
    unmount();
    expect(app).toHaveAttribute('inert', 'until-found');
  });

  it('leaves script, style and link elements alone', () => {
    const style = document.createElement('style');
    const script = document.createElement('script');
    const link = document.createElement('link');
    document.body.append(style, script, link);
    renderFullScreen();
    for (const el of [style, script, link]) {
      expect(el).not.toHaveAttribute('inert');
    }
  });

  it('does not make the host inert while not visible', () => {
    const { sibling } = host();
    renderFullScreen({ visible: false });
    expect(sibling).not.toHaveAttribute('inert');
  });
});
