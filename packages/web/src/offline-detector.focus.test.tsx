import { fireEvent } from '@testing-library/react';
import { FRAME } from '../test-utils';
import { $, advance, must, mountDetector } from '../test-utils/mount';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('sequence: dismissing a piece that holds focus', () => {
  const dismissButton = (piece: string) =>
    must($(piece)).querySelector('button[aria-label="Dismiss"]') as HTMLElement;

  async function offlineWithHostFocus() {
    const view = await mountDetector();
    const host = document.querySelector('button') as HTMLElement;
    host.focus();
    await view.goOffline();
    await advance(FRAME);
    return { view, host };
  }

  it('returns focus to the element that had it before the piece appeared', async () => {
    const { host } = await offlineWithHostFocus();
    dismissButton('.od-snackbar').focus();
    expect(document.activeElement).toBe(dismissButton('.od-snackbar'));

    fireEvent.click(dismissButton('.od-snackbar'));
    await advance(200);

    expect($('.od-snackbar')).toBeNull();
    expect(document.activeElement).toBe(host);
  });

  it('does the same for Escape pressed inside the piece', async () => {
    const { host } = await offlineWithHostFocus();
    const retry = must($('.od-snackbar')).querySelector('.od-text-button') as HTMLElement;
    retry.focus();
    fireEvent.keyDown(retry, { key: 'Escape' });
    await advance(200);
    expect(document.activeElement).toBe(host);
  });

  it('does the same for the banner', async () => {
    const { host } = await offlineWithHostFocus();
    dismissButton('.od-banner').focus();
    fireEvent.click(dismissButton('.od-banner'));
    await advance(200);
    expect($('.od-banner')).toBeNull();
    expect(document.activeElement).toBe(host);
  });

  it('does the same for the indicator, which takes focus itself when dismissible', async () => {
    const { host } = await offlineWithHostFocus();
    const mark = must($('.od-indicator')).querySelector('[tabindex="0"]') as HTMLElement;
    mark.focus();
    fireEvent.keyDown(mark, { key: 'Delete' });
    await advance(200);
    expect($('.od-indicator')).toBeNull();
    expect(document.activeElement).toBe(host);
  });

  it('falls back to the document body when that element is gone', async () => {
    const view = await mountDetector();
    const external = document.createElement('button');
    document.body.append(external);
    external.focus();
    await view.goOffline();
    await advance(FRAME);
    dismissButton('.od-snackbar').focus();
    external.remove();
    fireEvent.click(dismissButton('.od-snackbar'));
    await advance(200);
    expect($('.od-snackbar')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('does not take focus when the piece did not hold it', async () => {
    const { host } = await offlineWithHostFocus();
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();
    fireEvent.click(dismissButton('.od-snackbar'));
    await advance(200);
    expect(document.activeElement).toBe(other);
    expect(host).not.toHaveFocus();
    other.remove();
  });

  it('does not touch focus when a piece goes away without being dismissed', async () => {
    const { view, host } = await offlineWithHostFocus();
    const other = document.createElement('input');
    document.body.append(other);
    other.focus();
    await view.goOnline();
    await advance(5000);
    expect(document.activeElement).toBe(other);
    expect(host).not.toHaveFocus();
    other.remove();
  });
});

describe('sequence: the full-screen state', () => {
  const title = () => must($('.od-fullscreen h1'));

  it('uses strings.fullScreenTitle as its title', async () => {
    const view = await mountDetector({
      fullScreen: true,
      strings: { fullScreenTitle: 'You are offline' },
    });
    await view.goOffline();
    expect(title()).toHaveTextContent('You are offline');
  });

  it('uses the reason-aware message instead when distinguishReason is on', async () => {
    const view = await mountDetector({
      fullScreen: true,
      distinguishReason: true,
      strings: { fullScreenTitle: 'You are offline' },
    });
    await view.goOffline();
    expect(title()).toHaveTextContent('No network connection');
  });

  it('speaks the localised title by default', async () => {
    const view = await mountDetector({ fullScreen: true, locale: 'pt-BR' });
    await view.goOffline();
    expect(title()).toHaveTextContent('Sem internet');
  });

  it('calls onContinueOffline once when "Continue offline" is pressed', async () => {
    const onContinueOffline = jest.fn();
    const view = await mountDetector({
      fullScreen: { continueOffline: true },
      onContinueOffline,
    });
    await view.goOffline();
    expect(onContinueOffline).not.toHaveBeenCalled();
    fireEvent.click(
      must($('.od-fullscreen')).querySelector('.od-text-button') as Element,
    );
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
    expect($('.od-fullscreen')).toBeNull();
  });

  it('calls onContinueOffline for Escape as well', async () => {
    const onContinueOffline = jest.fn();
    const view = await mountDetector({
      fullScreen: { continueOffline: true },
      onContinueOffline,
    });
    await view.goOffline();
    fireEvent.keyDown(must($('.od-fullscreen')), { key: 'Escape' });
    expect(onContinueOffline).toHaveBeenCalledTimes(1);
  });

  it('never calls onContinueOffline when the escape hatch is not enabled', async () => {
    const onContinueOffline = jest.fn();
    const view = await mountDetector({ fullScreen: true, onContinueOffline });
    await view.goOffline();
    fireEvent.keyDown(must($('.od-fullscreen')), { key: 'Escape' });
    expect(onContinueOffline).not.toHaveBeenCalled();
    expect($('.od-fullscreen')).not.toBeNull();
  });
});
