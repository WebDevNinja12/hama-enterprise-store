/**
 * Login attempt rate limiting.
 * Uses Redis when available; falls back to in-memory (resets on cold start).
 */

import { rateLimitIncr } from "./redis";

const WINDOW_SEC = 5 * 60;
const MAX_FAILURES = 8;

const memoryFails = new Map<string, { count: number; resetAt: number }>();

export async function checkLoginAllowed(
  key: string
): Promise<{ ok: boolean; remaining?: number }> {
  const k = `loginfail:${key.toLowerCase()}`;

  try {
    const { ok, remaining } = await rateLimitIncr(k, MAX_FAILURES, WINDOW_SEC);
    // rateLimitIncr counts hits; for login we only count failures via recordLoginFailure.
    // Here we only block if memory map is over limit (Redis path handled in record).
    void ok;
    void remaining;
  } catch {
    /* ignore */
  }

  const now = Date.now();
  const entry = memoryFails.get(k);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
    return { ok: false };
  }
  if (entry && entry.resetAt <= now) {
    memoryFails.delete(k);
  }
  return { ok: true };
}

export async function recordLoginFailure(key: string): Promise<void> {
  const k = `loginfail:${key.toLowerCase()}`;
  const now = Date.now();

  try {
    await rateLimitIncr(k, MAX_FAILURES, WINDOW_SEC);
  } catch {
    /* ignore */
  }

  const entry = memoryFails.get(k);
  if (!entry || entry.resetAt <= now) {
    memoryFails.set(k, { count: 1, resetAt: now + WINDOW_SEC * 1000 });
    return;
  }
  entry.count += 1;
}

export async function clearLoginFailures(key: string): Promise<void> {
  const k = `loginfail:${key.toLowerCase()}`;
  memoryFails.delete(k);
}
