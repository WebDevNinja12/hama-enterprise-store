import { Redis } from "@upstash/redis";

/**
 * Upstash Redis for rate limits, lockouts, search cache.
 * Falls back to process-local memory when env is missing (dev only).
 */

const memory = new Map<string, { v: string; exp: number }>();

function memGet(key: string): string | null {
  const row = memory.get(key);
  if (!row) return null;
  if (row.exp && Date.now() > row.exp) {
    memory.delete(key);
    return null;
  }
  return row.v;
}

function memSet(key: string, value: string, ttlSec?: number) {
  memory.set(key, {
    v: value,
    exp: ttlSec ? Date.now() + ttlSec * 1000 : 0,
  });
  if (memory.size > 5000) {
    const now = Date.now();
    for (const [k, v] of memory) {
      if (v.exp && v.exp < now) memory.delete(k);
    }
  }
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return memGet(key);
  try {
    const v = await r.get<string>(key);
    return v ?? null;
  } catch {
    return memGet(key);
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSec = 60
): Promise<void> {
  const r = getRedis();
  if (!r) {
    memSet(key, value, ttlSec);
    return;
  }
  try {
    await r.set(key, value, { ex: ttlSec });
  } catch {
    memSet(key, value, ttlSec);
  }
}

/** Sliding window counter. Returns true if under limit. */
export async function rateLimitIncr(
  key: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; remaining: number }> {
  const r = getRedis();
  if (!r) {
    const raw = memGet(key);
    const n = (raw ? parseInt(raw, 10) : 0) + 1;
    memSet(key, String(n), windowSec);
    return { ok: n <= limit, remaining: Math.max(0, limit - n) };
  }
  try {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, windowSec);
    return { ok: n <= limit, remaining: Math.max(0, limit - n) };
  } catch {
    return { ok: true, remaining: limit };
  }
}

export function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
