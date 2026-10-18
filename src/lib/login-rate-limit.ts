import { cacheGet, cacheSet, rateLimitIncr } from "./redis";

const WINDOW_SEC = 15 * 60;
const MAX_FAILS = 8;
const LOCK_SEC = 5 * 60;

export async function checkLoginAllowed(
  key: string
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const lock = await cacheGet(`login:lock:${key}`);
  if (lock) {
    const until = parseInt(lock, 10);
    const left = Math.ceil((until - Date.now()) / 1000);
    if (left > 0) return { ok: false, retryAfterSec: left };
  }
  return { ok: true };
}

export async function recordLoginFailure(key: string) {
  const { remaining, ok } = await rateLimitIncr(
    `login:fail:${key}`,
    MAX_FAILS,
    WINDOW_SEC
  );
  if (!ok || remaining <= 0) {
    await cacheSet(
      `login:lock:${key}`,
      String(Date.now() + LOCK_SEC * 1000),
      LOCK_SEC
    );
  }
}

export async function clearLoginFailures(key: string) {
  await cacheSet(`login:fail:${key}`, "0", 1);
  await cacheSet(`login:lock:${key}`, "0", 1);
}
