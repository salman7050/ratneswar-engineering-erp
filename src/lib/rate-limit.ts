import "server-only";

/**
 * In-memory sliding-window limiter. Good enough for a single-instance
 * deployment; swap for a Redis/Upstash-backed limiter if this ever runs
 * on multiple server instances, since counts here don't share state
 * across processes.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    const retryAfterMs = windowMs - (now - oldest);
    return { ok: false, retryAfterMs };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }

  return { ok: true };
}
