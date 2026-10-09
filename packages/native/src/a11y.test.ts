import { splitRootProps } from './a11y';

describe('splitRootProps', () => {
  it('uses the announce default when the provider says nothing', () => {
    expect(splitRootProps(undefined, true)).toEqual({ root: {}, announces: true });
    expect(splitRootProps({ testID: 'x' }, false)).toEqual({
      root: { testID: 'x' },
      announces: false,
    });
  });

  it('lets the provider live region decide, and keeps it off the root', () => {
    expect(
      splitRootProps({ testID: 'x', accessibilityLiveRegion: 'none' }, true),
    ).toEqual({ root: { testID: 'x' }, announces: false });
    expect(splitRootProps({ accessibilityLiveRegion: 'polite' }, false)).toEqual({
      root: {},
      announces: true,
    });
  });
});
