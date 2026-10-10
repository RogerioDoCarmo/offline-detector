export const BACKOFF_BASE_MS = 1000;
export const BACKOFF_CAP_MS = 30000;

/** Delay before retry number `attempt` (0-based): 1s, 2s, 4s, ... capped at 30s. */
export function backoffDelay(attempt: number): number {
  return Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
}
