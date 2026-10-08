import { isOnline, type OfflineState } from './types';

const base: OfflineState = {
  status: 'unknown',
  reason: null,
  checking: false,
  lastChecked: null,
  lastOnlineAt: null,
};

describe('isOnline', () => {
  it('is true while the status is unknown', () => {
    expect(isOnline(base)).toBe(true);
  });

  it('is true when online', () => {
    expect(isOnline({ ...base, status: 'online' })).toBe(true);
  });

  it('is false when offline', () => {
    expect(isOnline({ ...base, status: 'offline', reason: 'no-internet' })).toBe(false);
  });
});
