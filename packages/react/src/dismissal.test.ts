import { resolveDismissible } from './dismissal';

describe('resolveDismissible', () => {
  it('defaults to true for every piece', () => {
    expect(resolveDismissible('snackbar', {})).toBe(true);
    expect(resolveDismissible('banner', {})).toBe(true);
    expect(resolveDismissible('indicator', {})).toBe(true);
  });

  it('uses the global flag when no per-piece value exists', () => {
    expect(resolveDismissible('banner', { dismissible: false })).toBe(false);
    expect(resolveDismissible('banner', { dismissible: true })).toBe(true);
  });

  it('lets a per-piece value win over the global one, both ways', () => {
    expect(
      resolveDismissible('banner', { dismissible: true, banner: { dismissible: false } }),
    ).toBe(false);
    expect(
      resolveDismissible('banner', { dismissible: false, banner: { dismissible: true } }),
    ).toBe(true);
  });

  it('ignores the other pieces settings', () => {
    const options = {
      snackbar: { dismissible: false },
      indicator: { dismissible: false },
    };
    expect(resolveDismissible('banner', options)).toBe(true);
    expect(resolveDismissible('snackbar', options)).toBe(false);
    expect(resolveDismissible('indicator', options)).toBe(false);
  });

  it('falls through to the global flag when the per-piece object has no value', () => {
    expect(resolveDismissible('indicator', { dismissible: false, indicator: {} })).toBe(
      false,
    );
  });
});
