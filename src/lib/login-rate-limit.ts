/** Failed-login rate limit (in-memory per isolate) */

const fails = new Map<string, { n: number; t: number; lockUntil: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const LOCK_MS = 5 * 60 * 1000;

export function checkLoginAllowed(key: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const row = fails.get(key);
  if (!row) return { ok: true };
  if (row.lockUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((row.lockUntil - now) / 1000) };
  }
  if (now - row.t > WINDOW_MS) {
    fails.delete(key);
    return { ok: true };
  }
  return { ok: true };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const row = fails.get(key);
  if (!row || now - row.t > WINDOW_MS) {
    fails.set(key, { n: 1, t: now, lockUntil: 0 });
    return;
  }
  row.n += 1;
  row.t = now;
  if (row.n >= MAX_FAILS) {
    row.lockUntil = now + LOCK_MS;
  }
}

export function clearLoginFailures(key: string) {
  fails.delete(key);
}
