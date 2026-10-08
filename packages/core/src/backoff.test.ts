import { BACKOFF_BASE_MS, BACKOFF_CAP_MS, backoffDelay } from './backoff';

describe('backoffDelay', () => {
  it('exposes the documented constants', () => {
    expect(BACKOFF_BASE_MS).toBe(1000);
    expect(BACKOFF_CAP_MS).toBe(30000);
  });

  it.each([
    [0, 1000],
    [1, 2000],
    [2, 4000],
    [3, 8000],
    [4, 16000],
    [5, 30000],
    [6, 30000],
    [100, 30000],
  ])('attempt %i waits %i ms', (attempt, expected) => {
    expect(backoffDelay(attempt)).toBe(expected);
  });
});
